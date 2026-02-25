import requests
import os

# Minimal valid PDF binary
pdf_content = (
    b'%PDF-1.1\n'
    b'1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n'
    b'2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n'
    b'3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 <<\n'
    b'/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n'
    b'/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n'
    b'4 0 obj\n<<\n/Length 53\n>>\nstream\n'
    b'BT\n/F1 24 Tf\n100 100 Td\n(Hello World) Tj\nET\n'
    b'endstream\nendobj\n'
    b'xref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n'
    b'0000000114 00000 n \n0000000300 00000 n \n'
    b'trailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n368\n%%EOF\n'
)

with open("valid.pdf", "wb") as f:
    f.write(pdf_content)

url = "http://127.0.0.1:8000/extract-text"
files = {'file': ('valid.pdf', open('valid.pdf', 'rb'), 'application/pdf')}

try:
    print("Uploading valid.pdf...")
    response = requests.post(url, files=files)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")

try:
    os.remove("valid.pdf")
except:
    pass
