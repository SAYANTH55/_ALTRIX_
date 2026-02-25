import io
import docx
import pdfplumber
from PIL import Image
from ocr import extract_text_from_pil_image

OCR_THRESHOLD = 50  # If extracted text has fewer chars than this, try OCR

def read_docx(file_bytes: bytes) -> str:
    """
    Extracts text from a DOCX file.
    """
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text.strip())
        return "\n\n".join(full_text)
    except Exception as e:
        raise ValueError(f"Error reading DOCX: {str(e)}")

def read_pdf(file_bytes: bytes) -> tuple[str, str]:
    """
    Extracts text from a PDF file.
    Returns (text, method) where method is 'text' or 'ocr'.
    """
    text_content = []
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                
                # If page is mostly blank or image-based, try OCR logic on *that page* if needed
                # For simplicity here, we'll extract text first.
                if page_text and len(page_text.strip()) > 0:
                    text_content.append(page_text)
        
        extracted_text = "\n\n".join(text_content)
        
        # Check if we got enough text
        if len(extracted_text.strip()) < OCR_THRESHOLD:
            # Fallback to OCR
            print("Low text density in PDF, switching to OCR...")
            ocr_text_content = []
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    # Convert page to image
                    # Resolution 300 is standard for OCR
                    im = page.to_image(resolution=300).original
                    page_ocr_text = extract_text_from_pil_image(im)
                    ocr_text_content.append(page_ocr_text)
            
            return "\n\n".join(ocr_text_content), "ocr"

        return extracted_text, "text"

    except Exception as e:
        raise ValueError(f"Error reading PDF: {str(e)}")

def process_document(filename: str, file_bytes: bytes) -> tuple[str, str]:
    """
    Main entry point for document processing.
    Returns (extracted_text, extraction_method).
    """
    filename = filename.lower()
    
    if filename.endswith(".docx"):
        return read_docx(file_bytes), "docx_text"
    elif filename.endswith(".pdf"):
        return read_pdf(file_bytes)
    else:
        raise ValueError("Unsupported file format. Please upload .pdf or .docx")
