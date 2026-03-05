import asyncio
import httpx
import json
import os
import time
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

class AIGateway:
    def __init__(self):
        self.api_key = None
        self.api_key_2 = None
        self._load_key()
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"

    def _load_key(self):
        # Look for .env.local in current dir or parent (root)
        # Structure: root/ai-humanizer/services/ai_gateway.py
        # Need 3 levels up to reach root
        root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        env_path = os.path.join(root_dir, ".env.local")
        load_dotenv(env_path, override=True)
        self.api_key = os.environ.get("GROQ_API_KEY")
        self.api_key_2 = os.environ.get("GROQ_API_KEY_2")
        if self.api_key:
            print(f"Gateway: Primary API Key loaded (starts with {self.api_key[:5]}...)")
        else:
            print(f"Gateway: FAILED to load Primary API Key from {env_path}")
        if self.api_key_2:
            print(f"Gateway: Fallback API Key loaded (starts with {self.api_key_2[:5]}...)")
        self.base_url = "https://api.groq.com/openai/v1/chat/completions"
        
        # Concurrency Semaphores
        self.sem_heavy = asyncio.Semaphore(2)  # Max 2 concurrent 70B requests
        self.sem_light = asyncio.Semaphore(4)  # Max 4 concurrent 8B requests
        
        # Model Mapping
        self.models = {
            "heavy": "llama-3.3-70b-versatile",
            "light": "llama-3.1-8b-instant"
        }

    async def generate(self, 
                       model_type: str, 
                       prompt: str, 
                       system_prompt: str = "You are a helpful assistant.",
                       temperature: float = 0.1,
                       max_tokens: int = 1024,
                       response_format: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Centrally handles Groq API calls with:
        - Model routing
        - Concurrency control
        - Retries & Timeouts
        - Token truncation
        """
        
        if not self.api_key:
            self._load_key()
            
        if not self.api_key:
            return {"error": "GROQ_API_KEY not configured", "status_code": 500}
        
        # Try primary key first, fall back to key_2 on rate-limit or auth error
        keys_to_try = [k for k in [self.api_key, self.api_key_2] if k]

        model = self.models.get(model_type, self.models["light"])
        semaphore = self.sem_heavy if model_type == "heavy" else self.sem_light
        
        # Safety Truncation (Approx 6k tokens for 70B, 4k for 8B)
        max_input = 24000 if model_type == "heavy" else 16000 # Rough char count limit
        if len(prompt) > max_input:
            print(f"Gateway: Truncating large input for {model_type} request.")
            prompt = prompt[:max_input] + "\n[TRUNCATED]"

        async with semaphore:
            for key_index, active_key in enumerate(keys_to_try):
                key_label = "primary" if key_index == 0 else "fallback"
                retries = 2
                backoff = 1.0

                for attempt in range(retries + 1):
                    try:
                        async with httpx.AsyncClient(timeout=25.0) as client:
                            payload = {
                                "model": model,
                                "messages": [
                                    {"role": "system", "content": system_prompt},
                                    {"role": "user", "content": prompt}
                                ],
                                "temperature": temperature,
                                "max_tokens": max_tokens
                            }
                            if response_format:
                                payload["response_format"] = response_format

                            response = await client.post(
                                self.base_url,
                                headers={"Authorization": f"Bearer {active_key}"},
                                json=payload
                            )

                            if response.status_code == 200:
                                return response.json()

                            # Rate limit or auth error → try next key
                            if response.status_code in [429, 401]:
                                if response.status_code == 429 and model_type == "heavy" and key_index == len(keys_to_try) - 1:
                                    print("Gateway: All keys rate limited on heavy model. Falling back to light model...")
                                    return await self.generate("light", prompt, system_prompt, temperature, max_tokens, response_format)
                                print(f"Gateway: {key_label} key got {response.status_code}. Trying next key...")
                                break  # break inner retry loop → go to next key

                            # Server error - retry with same key
                            if response.status_code in [500, 502, 503, 504]:
                                print(f"Gateway: Request failed with {response.status_code}. Retrying in {backoff}s...")
                                await asyncio.sleep(backoff)
                                backoff *= 2
                                continue

                            return {"error": f"API Error: {response.text}", "status_code": response.status_code}

                    except httpx.TimeoutException:
                        print(f"Gateway: Timeout on attempt {attempt + 1} ({key_label} key). Retrying...")
                        await asyncio.sleep(backoff)
                        backoff *= 2
                    except Exception as e:
                        return {"error": f"Gateway Critical Error: {str(e)}", "status_code": 500}

            return {"error": "Exceeded maximum retries or timeout across all keys", "status_code": 504}

# Global Instance
gateway = AIGateway()
