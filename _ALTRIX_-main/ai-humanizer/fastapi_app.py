import sys
import os
import re

current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.append(current_dir)

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from document_reader import process_document
import uvicorn

app = FastAPI(title="SENTIC — Linguistic Entropy Backend")

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
    return {"status": "ok", "service": "SENTIC Linguistic Entropy Backend"}


# ── Stage 3: Pragmatic Marker Injection ─────────────────────────────────────
class MarkerRequest(BaseModel):
    text: str
    injection_rate: float = 0.28


@app.post("/inject-markers")
def inject_markers_endpoint(req: MarkerRequest):
    """
    Stage 3 of the Linguistic Entropy Pipeline.
    Injects human pragmatic markers (Frankly, In practice, Oddly enough…)
    into sentences that lack discourse signals.
    """
    try:
        result = inject_pragmatic_markers(req.text, injection_rate=req.injection_rate)
        return {"text": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Legacy endpoint alias (keeps any old clients working) ───────────────────
class LegacyHumanizeRequest(BaseModel):
    text: str


@app.post("/humanize")
def legacy_humanize(req: LegacyHumanizeRequest):
    """Legacy alias → routes to inject-markers."""
    result = inject_pragmatic_markers(req.text)
    return {"humanized_text": result, "text": result}


# ── Document text extraction ─────────────────────────────────────────────────
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
