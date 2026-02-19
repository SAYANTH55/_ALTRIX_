import requests
import urllib3

# Suppress warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

API_KEY = "Your api key"

def test_groq_insecure():
    print(f"Testing Groq API (INSECURE MODE)...")
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
        # verify=False disables SSL cert checking
        response = requests.post(url, headers=headers, json=data, timeout=10, verify=False)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS (Insecure Mode Works!)")
            print(response.json()['choices'][0]['message']['content'])
        else:
            print(f"❌ Failed even with insecure. Status: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"❌ Connection Error (Insecure failed): {str(e)}")

if __name__ == "__main__":
    test_groq_insecure()
