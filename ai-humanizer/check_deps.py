import importlib.util
import sys

dependencies = [
    "fastapi",
    "uvicorn",
    "multipart", # python-multipart
    "docx", # python-docx
    "pdfplumber",
    "pytesseract",
    "PIL" # Pillow
]

missing = []
for package in dependencies:
    # Handle package name differences
    import_name = package
    if package == "multipart": import_name = "python_multipart" # generic check helpful
    if package == "docx": import_name = "docx"
    if package == "PIL": import_name = "PIL"
    
    # Simple try-import approach is more robust than importlib util for some packages
    try:
        if package == "multipart":
            import python_multipart
        elif package == "docx":
            import docx
        elif package == "PIL":
            import PIL
        else:
            __import__(package)
        print(f"[OK] {package}")
    except ImportError:
        print(f"[MISSING] {package}")
        missing.append(package)

if missing:
    print(f"\nCRITICAL: Missing dependencies: {', '.join(missing)}")
    sys.exit(1)
else:
    print("\nAll dependencies installed.")
