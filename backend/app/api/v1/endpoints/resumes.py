import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.resume import Resume
from app.schemas.resume import ResumeResponse, ResumeDetailResponse, ResumeUploadParseResponse, ParsedResumeProfile
from app.services.auth_service import get_current_user
from app.services.resume_service import process_resume_upload, extract_structured_profile

router = APIRouter(prefix="/resumes", tags=["Résumés"])


def format_resume_response(resume: Resume) -> ResumeResponse:
    try:
        meta = json.loads(resume.metadata_json)
    except Exception:
        meta = {}

    preview = (resume.extracted_text[:300] + "...") if len(resume.extracted_text) > 300 else resume.extracted_text

    return ResumeResponse(
        id=resume.id,
        user_id=resume.user_id,
        filename=resume.filename,
        file_size=resume.file_size,
        mime_type=resume.mime_type,
        word_count=meta.get("word_count", 0),
        char_count=meta.get("char_count", len(resume.extracted_text)),
        preview_text=preview,
        metadata=meta,
        created_at=resume.created_at
    )


@router.post("", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED, summary="Upload a résumé (PDF/DOCX)")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload and parse a résumé document.
    Extracts text, calculates document metadata, and saves outside static directory.
    """
    extracted_text, metadata, safe_path, file_size, mime_type = process_resume_upload(
        user_id=current_user.id,
        file=file
    )

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename or "resume.pdf",
        safe_path=safe_path,
        file_size=file_size,
        mime_type=mime_type,
        extracted_text=extracted_text,
        metadata_json=json.dumps(metadata)
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    return format_resume_response(resume)


@router.post("/upload-and-parse", response_model=ResumeUploadParseResponse, status_code=status.HTTP_201_CREATED, summary="Upload résumé and parse candidate profile for confirmation")
async def upload_and_parse_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload real PDF/DOCX résumé, validate bytes and structure, extract text safely,
    parse candidate name, skills, target role, education, and links for student confirmation.
    """
    extracted_text, metadata, safe_path, file_size, mime_type = process_resume_upload(
        user_id=current_user.id,
        file=file
    )

    resume = Resume(
        user_id=current_user.id,
        filename=file.filename or "resume.pdf",
        safe_path=safe_path,
        file_size=file_size,
        mime_type=mime_type,
        extracted_text=extracted_text,
        metadata_json=json.dumps(metadata)
    )
    db.add(resume)
    db.commit()
    db.refresh(resume)

    parsed_data = extract_structured_profile(extracted_text)
    parsed_profile = ParsedResumeProfile(**parsed_data)

    return ResumeUploadParseResponse(
        resume=format_resume_response(resume),
        parsed_profile=parsed_profile
    )


@router.get("", response_model=List[ResumeResponse], summary="List all résumés for current user")
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resumes = db.query(Resume).filter(Resume.user_id == current_user.id).order_by(Resume.created_at.desc()).all()
    return [format_resume_response(r) for r in resumes]


@router.get("/{resume_id}", response_model=ResumeDetailResponse, summary="Get résumé details with full extracted text")
def get_resume(
    resume_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == current_user.id).first()
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Résumé not found.")
    
    base_res = format_resume_response(resume)
    return ResumeDetailResponse(
        **base_res.model_dump(),
        extracted_text=resume.extracted_text
    )
