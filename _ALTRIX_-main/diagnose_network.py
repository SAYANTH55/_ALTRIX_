import requests
import urllib3

import os

# Suppress warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_KEY = os.environ.get("GROQ_API_KEY", "")

def diagnose():
    print(f"Diagnosing Connection...")
    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": [{"role": "user", "content": "Hello"}],
        "max_tokens": 10
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=10, verify=False)
        print(f"--- STATUS: {response.status_code} ---")
        print("--- HEADERS ---")
        for k,v in response.headers.items():
            print(f"{k}: {v}")
        print("--- BODY START ---")
        print(response.text[:1000]) # Print first 1000 chars
        print("--- BODY END ---")
            
    except Exception as e:
        print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    diagnose()
