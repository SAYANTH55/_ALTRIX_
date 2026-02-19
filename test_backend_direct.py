import requests

url = "http://127.0.0.1:8000/extract-text"
files = {'file': ('test.txt', 'This is a test file content to verify the backend work.')}

try:
    print(f"Sending request to {url}...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
