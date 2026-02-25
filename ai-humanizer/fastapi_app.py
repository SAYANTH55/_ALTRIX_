import sys
import os
import re

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from document_reader import process_document
from services.ai_gateway import gateway
from services.karion_service import KarionService
import uvicorn

app = FastAPI(title="ALTRIX â€” Research Intelligence Backend")
karion = KarionService(gateway)

# Import marker injector (replaces old BERT humanizer)
try:
    from humanizer import inject_pragmatic_markers
except ImportError as e:
    print(f"Warning: could not import humanizer: {e}")
    def inject_pragmatic_markers(text: str, **_) -> str:
        return text

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "ALTRIX Research Intelligence Backend"}


# â”€â”€ KARION: Citation Intelligence â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class KarionRequest(BaseModel):
    text: str
    style: str = "ieee"
    mode: str = "standard"  # quick, standard, strict


@app.post("/karion/verify")
async def karion_verify(req: KarionRequest):
    """
    4-Stage Citation Pipeline:
    1. AI Metadata Extraction
    2. Scholarly Verification (Crossref/Semantic Scholar)
    3. Official CSL Formatting
    4. BibTeX/Metadata Generation
    """
    try:
        # Step 1: Extract
        extracted = await karion.extract_metadata(req.text)
        if not extracted:
            return {"formatted": [], "bibtex": "", "metadata": [], "warning": "No citations found or failed to parse."}

        # Step 2: Verify
        verified_tasks = [karion.verify_metadata(item, mode=req.mode) for item in extracted]
        verified_items = await asyncio.gather(*verified_tasks)

        # Step 3 & 4: Format & Package
        result = karion.format_citation(verified_items, style_name=req.style)
        return result
    except Exception as e:
        import traceback
        with open("backend_errors.log", "a") as f:
            f.write(f"\n--- KARION Error ---\n{traceback.format_exc()}\n")
        raise HTTPException(status_code=500, detail=f"KARION Pipeline Error: {str(e)}")


# â”€â”€ Stage 3: Pragmatic Marker Injection â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class MarkerRequest(BaseModel):
    text: str
    injection_rate: float = 0.28


@app.post("/inject-markers")
def inject_markers_endpoint(req: MarkerRequest):
    """
    Stage 3 of the Linguistic Entropy Pipeline.
    Injects human pragmatic markers (Frankly, In practice, Oddly enoughâ€¦)
    into sentences that lack discourse signals.
    """
    try:
        result = inject_pragmatic_markers(req.text, injection_rate=req.injection_rate)
        return {"text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# â”€â”€ Legacy endpoint alias (keeps any old clients working) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class LegacyHumanizeRequest(BaseModel):
    text: str


@app.post("/humanize")
def legacy_humanize(req: LegacyHumanizeRequest):
    """Legacy alias â†’ routes to inject-markers."""
    result = inject_pragmatic_markers(req.text)
    return {"humanized_text": result, "text": result}


# â”€â”€ Document text extraction â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
@app.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    allowed = [".pdf", ".docx"]
    if not any(file.filename.lower().endswith(ext) for ext in allowed):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX supported")

    try:
        content = await file.read()
        text, method = process_document(file.filename, content)

        # Normalise whitespace
        text = text.replace("-\n", "").replace("\xa0", " ")
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"-\s*\n\s*", "", text)
        text = re.sub(r"\n\s*\n", "\n\n", text).strip()

        word_count = len(text.split())
        warning = None
        if word_count < 50:
            warning = "Text is very short."
        elif word_count > 3000:
            warning = "Text is very long."

        return {
            "filename": file.filename,
            "text": text,
            "word_count": word_count,
            "extraction_method": method,
            "warning": warning,
        }
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        import traceback
        with open("backend_errors.log", "a") as f:
            f.write(f"\n--- Error ---\n{traceback.format_exc()}\n")
        raise HTTPException(status_code=500, detail=f"Processing Error: {str(e)}")


if __name__ == "__main__":
    uvicorn.run("fastapi_app:app", host="0.0.0.0", port=8000, reload=True)
