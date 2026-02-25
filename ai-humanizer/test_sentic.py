import requests

sample = (
    "AI tools are widely used. They provide comprehensive assistance. "
    "Furthermore, they foster better outcomes and underscore the importance of holistic approaches."
)

r = requests.post("http://127.0.0.1:8000/inject-markers", json={"text": sample})
data = r.json()
text = data.get("text", "")

print("STATUS:", r.status_code)
print("OUTPUT:", text)
print()

# Check for banned words
BANNED = ["comprehensive","foster","delve","multifaceted","underscores","underscore",
          "testament","realm","pivotal","holistic","furthermore","moreover"]
hits = [w for w in BANNED if w.lower() in text.lower()]
print("Banned words remaining:", hits if hits else "NONE ✓")
print("Endpoint /inject-markers: OK ✓" if r.status_code == 200 else "FAIL ✗")
