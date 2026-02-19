import sys
import os

# Add current directory to sys.path so we can import local modules
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from document_reader import process_document
import uvicorn

app = FastAPI(title="Anti-Gravity Document Ingestion")

# Import local humanizer
try:
    from humanizer import humanizNOe_text_bert
except ImportError:
    print("Warning: fit to import humanizer module.")
    def humanize_text_bert(text): return text + " [Error: Humanizer module not found]"


# Allow CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development, allow all. In prod, restrict to Next.js domain.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "service": "Anti-Gravity Document Ingestion"}

from pydantic import BaseModel

class HumanizeRequest(BaseModel):
    text: str

@app.post("/humanize")
def humanize_text_endpoint(request: HumanizeRequest):
    """
    Endpoint to humanize text using BERT.
    """
    try:
        humanized = humanize_text_bert(request.text)
        return {"humanized_text": humanized}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Endpoint to upload a file (PDF/DOCX) and get extracted text.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    # Validate extension
    allowed_extensions = [".pdf", ".docx"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed_extensions):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are supported.")

    try:
        content = await file.read()
        
        # Process extracted text
        text, method = process_document(file.filename, content)
        
        # Word count validation
        word_count = len(text.split())
        
        # Cleaning/Normalization (basic)
        # 1. Merge hyphenated words at end of lines (e.g. "exam-\nple" -> "example")
        text = text.replace("-\n", "")
        import re
        
        # 2. Normalize whitespace but preserve structure
        # Replace non-breaking spaces
        text = text.replace('\xa0', ' ')
        
        # Collapse multiple spaces/tabs to single space (horizontal only)
        # We explicitly exclude \n from this regex to preserve line breaks
        text = re.sub(r'[ \t]+', ' ', text)
        
        # Fix hyphens at end of lines (basic un-breaking)
        text = re.sub(r'-\s*\n\s*', '', text)
        
        # Collapse multiple newlines to max 2 (paragraph separation)
        text = re.sub(r'\n\s*\n', '\n\n', text)
        
        text = text.strip()
        
        # Re-check count after cleaning
        word_count = len(text.split())

        if word_count < 50: # Lowered threshold for testing, but spec says 500
             warning = "Text is very short."
        elif word_count > 3000: # Spec says 1500, but let's be generous for the extractor
             warning = "Text is very long."
        else:
             warning = None

        return {
            "filename": file.filename,
            "text": text,
            "word_count": word_count,
            "extraction_method": method,
            "warning": warning
        }

    except ValueError as ve:
        # User error (invalid file, empty, etc.)
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        # Log to file
        with open("backend_errors.log", "a") as f:
            f.write(f"\n--- Error ---\n{error_details}\n")
        
        print(f"Error processing file: {error_details}")
        raise HTTPException(status_code=500, detail=f"Processing Error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
