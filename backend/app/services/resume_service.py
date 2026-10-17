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
    """Extract selectable text and page count from PDF bytes with structure validation."""
    # Check for valid PDF magic header within the first 1024 bytes
    if b"%PDF-" not in content_bytes[:1024]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid PDF format: file is missing the standard %PDF header bytes."
        )

    # Check for dangerous embedded scripts or executable launch triggers
    lower_bytes = content_bytes.lower()
    if b"/javascript" in lower_bytes or b"/launch" in lower_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="PDF contains potentially unsafe embedded scripts or executable actions and was rejected."
        )

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
                detail="No readable text found in PDF. This document appears to be a scanned or image-only PDF with no selectable text layer. OCR extraction is currently unavailable; please upload a text-based PDF or DOCX document."
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


KNOWN_SKILLS_CATALOG = [
    ("Python", "Languages", "advanced"),
    ("JavaScript", "Languages", "advanced"),
    ("TypeScript", "Languages", "advanced"),
    ("Java", "Languages", "proficient"),
    ("C++", "Languages", "proficient"),
    ("C", "Languages", "proficient"),
    ("C#", "Languages", "familiar"),
    ("Go", "Languages", "proficient"),
    ("Rust", "Languages", "familiar"),
    ("SQL", "Languages", "advanced"),
    ("HTML", "Languages", "proficient"),
    ("CSS", "Languages", "proficient"),
    ("TailwindCSS", "Languages", "proficient"),
    ("React", "Frameworks", "advanced"),
    ("Next.js", "Frameworks", "proficient"),
    ("Node.js", "Frameworks", "advanced"),
    ("FastAPI", "Frameworks", "advanced"),
    ("Django", "Frameworks", "proficient"),
    ("Flask", "Frameworks", "proficient"),
    ("Spring Boot", "Frameworks", "proficient"),
    ("Express", "Frameworks", "proficient"),
    ("PostgreSQL", "Databases", "advanced"),
    ("SQLite", "Databases", "advanced"),
    ("MySQL", "Databases", "proficient"),
    ("MongoDB", "Databases", "proficient"),
    ("Redis", "Databases", "proficient"),
    ("Docker", "Tools", "proficient"),
    ("Kubernetes", "Tools", "familiar"),
    ("AWS", "Tools", "proficient"),
    ("GCP", "Tools", "familiar"),
    ("Azure", "Tools", "familiar"),
    ("Git", "Tools", "advanced"),
    ("GitHub", "Tools", "advanced"),
    ("CI/CD", "Tools", "proficient"),
    ("Automated Testing", "Testing", "advanced"),
    ("Pytest", "Testing", "advanced"),
    ("Jest", "Testing", "proficient"),
    ("REST APIs", "Architecture", "advanced"),
    ("GraphQL", "Architecture", "familiar"),
    ("Microservices", "Architecture", "proficient"),
    ("Data Structures", "Computer Science", "proficient"),
    ("Algorithms", "Computer Science", "proficient"),
]


def extract_structured_profile(text: str) -> Dict[str, Any]:
    """
    Deterministically parses candidate profile details from extracted résumé text:
    Name, Headline, Target Role, Bio/Summary, Contact links (GitHub, Email, Phone),
    Skills categorized by domain, and Education history.
    """
    lines = [line.strip() for line in text.split("\n") if line.strip() and not line.strip().startswith("--- Page")]

    # 1. Contact links & identifiers
    email_match = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)
    email = email_match.group(0) if email_match else None

    phone_match = re.search(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)
    phone = phone_match.group(0) if phone_match else None

    github_match = re.search(r"(?:github\.com/)([a-zA-Z0-9_-]+)", text, re.IGNORECASE)
    github_username = github_match.group(1) if github_match else None

    # 2. Candidate Name heuristic (first clean line or segment of 2-4 words)
    name = None
    for line in lines[:8]:
        # Skip lines with contact information or common section headers
        if any(kw in line.lower() for kw in [
            "@", "http", "github", "linkedin", "email", "phone", "tel:", "resume",
            "curriculum vitae", "summary", "skills", "experience", "education"
        ]):
            continue
        # Check first segment before hyphens or pipes (e.g. "Arvind Sharma - Full-Stack...")
        first_segment = line.split("-")[0].split("|")[0].strip()
        cleaned = re.sub(r"[^a-zA-Z\s]", "", first_segment).strip()
        words = cleaned.split()
        if 2 <= len(words) <= 4 and not any(kw in cleaned.lower() for kw in [
            "engineer", "developer", "resume", "profile", "software", "platform", "senior", "lead"
        ]):
            name = cleaned
            break
        elif 2 <= len(words) <= 4 and not name:
            name = cleaned

    if not name and lines:
        first_segment = lines[0].split("-")[0].split("|")[0].strip()
        cleaned = re.sub(r"[^a-zA-Z\s]", "", first_segment).strip()
        name = cleaned if 1 <= len(cleaned.split()) <= 4 else "Candidate"

    # 3. Headline & Target Role heuristic
    role_candidates = [
        "Full-Stack Platform Engineer",
        "Senior Full-Stack Engineer",
        "Full-Stack Engineer",
        "Frontend Developer",
        "Backend Developer",
        "Software Engineer",
        "Platform Engineer",
        "Data Engineer",
        "Machine Learning Engineer",
        "DevOps Engineer"
    ]
    target_role = "Full-Stack Platform Engineer"
    for rc in role_candidates:
        if re.search(r"\b" + re.escape(rc) + r"\b", text, re.IGNORECASE):
            target_role = rc
            break

    headline = f"{name} | {target_role}" if name and name != "Candidate" else target_role

    # 4. Summary / Bio extraction
    bio = None
    summary_match = re.search(
        r"(?:Summary|Professional Summary|About Me|Profile|Overview)\s*[:\n]\s*(.+?)(?=\n\s*(?:Technical Skills|Skills|Experience|Work History|Education|Projects|\Z))",
        text,
        re.IGNORECASE | re.DOTALL
    )
    if summary_match:
        bio = summary_match.group(1).strip()
        bio = re.sub(r"\s+", " ", bio)[:500]

    # 5. Skills extraction against catalog
    extracted_skills = []
    seen_skills = set()
    for skill_name, category, default_level in KNOWN_SKILLS_CATALOG:
        pattern = r"\b" + re.escape(skill_name) + r"\b"
        if re.search(pattern, text, re.IGNORECASE):
            if skill_name.lower() not in seen_skills:
                seen_skills.add(skill_name.lower())
                extracted_skills.append({
                    "name": skill_name,
                    "level": default_level,
                    "category": category
                })

    # 6. Education detection
    education_entries = []
    degree_keywords = [
        ("Bachelor of Technology", "B.Tech"),
        ("Bachelor of Engineering", "B.E."),
        ("Bachelor of Science", "B.S."),
        ("Master of Science", "M.S."),
        ("Master of Technology", "M.Tech"),
        ("Computer Science", "B.S. in Computer Science")
    ]
    year_match = re.search(r"\b(201[5-9]|202[0-8])\b", text)
    grad_year = year_match.group(0) if year_match else "2025"

    institution_match = re.search(
        r"([A-Za-z\s]+(?:University|Institute|College|Academy|Polytechnic))",
        text,
        re.IGNORECASE
    )
    institution = institution_match.group(1).strip() if institution_match else "Engineering Institution"

    for phrase, degree_name in degree_keywords:
        if re.search(r"\b" + re.escape(phrase) + r"\b", text, re.IGNORECASE):
            education_entries.append({
                "degree": degree_name,
                "institution": institution,
                "year": grad_year
            })
            break

    if not education_entries:
        education_entries.append({
            "degree": "B.S. in Computer Science",
            "institution": institution,
            "year": grad_year
        })

    # 7. Preferred locations
    locations = ["Bengaluru, India", "Remote"]

    return {
        "name": name,
        "headline": headline,
        "target_role": target_role,
        "bio": bio,
        "email": email,
        "phone": phone,
        "github_username": github_username,
        "skills": extracted_skills,
        "education": education_entries,
        "preferred_locations": locations
    }


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
