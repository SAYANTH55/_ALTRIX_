import requests
import sys

def test_health():
    print("Testing Health Endpoint...")
    try:
        r = requests.get("http://localhost:8000/")
        if r.status_code == 200:
            print("✅ Health Check Passed:", r.json())
        else:
            print("❌ Health Check Failed:", r.status_code)
    except Exception as e:
        print("❌ Health Check Connection Error:", e)
        print("   (Make sure 'python -m uvicorn ai-humanizer.fastapi_app:app' is running)")

if __name__ == "__main__":
    test_health()
