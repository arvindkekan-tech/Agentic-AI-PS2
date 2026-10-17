import io
import os
import re
import uuid
from pathlib import Path
from typing import Tuple, Dict, Any
from fastapi import UploadFile, HTTPException, status
from pypdf import PdfReader
from pypdf.errors import PdfReadError
import docx
from docx.opc.exceptions import PackageNotFoundError

from app.core.config import settings


def sanitize_filename(filename: str) -> str:
    """Strip dangerous characters and keep extension safe."""
    clean = re.sub(r"[^\w\.-]", "_", filename)
    return clean[-100:]  # Limit length


def extract_text_from_pdf(content_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
    """Extract selectable text and page count from PDF bytes."""
    try:
        reader = PdfReader(io.BytesIO(content_bytes))
        if reader.is_encrypted:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF is encrypted or password-protected. Please upload an unencrypted document."
            )
        
        pages_count = len(reader.pages)
        if pages_count == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded PDF contains no pages."
            )

        extracted_pages = []
        for i, page in enumerate(reader.pages):
            text = page.extract_text() or ""
            if text.strip():
                extracted_pages.append(f"--- Page {i + 1} ---\n{text.strip()}")

        full_text = "\n\n".join(extracted_pages).strip()
        if len(full_text) < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No readable text found in PDF. Scanned or image-only PDFs are not supported in Phase 1; please upload a text-based PDF or DOCX document."
            )

        metadata = {
            "format": "pdf",
            "page_count": pages_count,
            "char_count": len(full_text),
            "word_count": len(full_text.split())
        }
        return full_text, metadata

    except PdfReadError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Corrupt or invalid PDF file: {str(e)}"
        )


def extract_text_from_docx(content_bytes: bytes) -> Tuple[str, Dict[str, Any]]:
    """Extract text from DOCX document bytes."""
    try:
        doc = docx.Document(io.BytesIO(content_bytes))
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
        
        # Also extract table text
        table_texts = []
        for table in doc.tables:
            for row in table.rows:
                row_cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_cells:
                    table_texts.append(" | ".join(row_cells))

        all_text = "\n".join(paragraphs + table_texts).strip()
        if len(all_text) < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The uploaded DOCX document contains no readable text."
            )

        metadata = {
            "format": "docx",
            "paragraphs_count": len(paragraphs),
            "tables_count": len(doc.tables),
            "char_count": len(all_text),
            "word_count": len(all_text.split())
        }
        return all_text, metadata

    except (PackageNotFoundError, Exception) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupt DOCX file: {str(e)}"
        )


def process_resume_upload(user_id: str, file: UploadFile) -> Tuple[str, Dict[str, Any], str, int, str]:
    """
    Process, safely store, and extract text from uploaded résumé file.
    Returns (extracted_text, metadata, safe_path, file_size, mime_type).
    """
    filename = file.filename or "resume.pdf"
    extension = Path(filename).suffix.lower()
    
    if extension not in (".pdf", ".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{extension}'. Please upload a PDF or DOCX file."
        )

    # Read content
    content = file.file.read()
    file_size = len(content)

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty (0 bytes)."
        )

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {max_mb}MB."
        )

    # Extract text based on format
    if extension == ".pdf":
        extracted_text, meta = extract_text_from_pdf(content)
        mime_type = "application/pdf"
    else:
        extracted_text, meta = extract_text_from_docx(content)
        mime_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

    # Store outside public directory with isolated path
    user_upload_dir = Path(settings.UPLOAD_DIR) / "resumes" / user_id
    user_upload_dir.mkdir(parents=True, exist_ok=True)
    
    unique_name = f"{uuid.uuid4().hex[:12]}_{sanitize_filename(filename)}"
    safe_path = user_upload_dir / unique_name

    with open(safe_path, "wb") as f:
        f.write(content)

    return extracted_text, meta, str(safe_path), file_size, mime_type
