import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.job import Job
from app.schemas.job import JobImportRequest, JobResponse, ExtractedRequirementItem, JobRequirementsUpdateRequest
from app.services.auth_service import get_current_user
from app.services.job_service import fetch_job_url_safely, extract_grounded_requirements

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def format_job_response(job: Job) -> JobResponse:
    try:
        reqs_raw = json.loads(job.extracted_requirements_json)
        reqs = [ExtractedRequirementItem(**r) for r in reqs_raw]
    except Exception:
        reqs = []

    return JobResponse(
        id=job.id,
        user_id=job.user_id,
        title=job.title,
        company=job.company,
        source_type=job.source_type,
        source_url=job.source_url,
        raw_text=job.raw_text,
        extracted_requirements=reqs,
        created_at=job.created_at
    )


@router.post("/import", response_model=JobResponse, status_code=status.HTTP_201_CREATED, summary="Import job from URL or pasted text")
def import_job(
    job_in: JobImportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Import a job posting.
    Supports either pasted raw text or a validated public URL (protected against SSRF).
    Extracts 4 to 6 grounded technical requirements with source excerpts and types.
    """
    json_ld_data = None
    extracted_company = None
    if job_in.source_type == "url":
        if not job_in.url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL is required when source_type is 'url'."
            )
        raw_text, extracted_title, extracted_company, json_ld_data = fetch_job_url_safely(job_in.url)
        title = job_in.title or extracted_title or "Software Engineer"
        company = job_in.company or extracted_company
        source_url = job_in.url
    elif job_in.source_type == "pasted":
        if not job_in.text or len(job_in.text.strip()) < 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Pasted job description must be at least 30 characters long."
            )
        raw_text = job_in.text.strip()
        title = job_in.title or "Software Engineer Position"
        company = job_in.company
        source_url = None
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported source_type '{job_in.source_type}'. Must be 'url' or 'pasted'."
        )

    # Extract 4-6 grounded requirements
    extracted_reqs = extract_grounded_requirements(
        raw_text,
        source_type=job_in.source_type,
        json_ld_data=json_ld_data
    )
    reqs_json = json.dumps([r.model_dump() for r in extracted_reqs])

    job = Job(
        user_id=current_user.id,
        title=title,
        company=company,
        source_type=job_in.source_type,
        source_url=source_url,
        raw_text=raw_text,
        extracted_requirements_json=reqs_json
    )
    db.add(job)
    db.commit()
    db.refresh(job)

    return format_job_response(job)


@router.put("/{job_id}/requirements", response_model=JobResponse, summary="Update/review job requirements")
def update_job_requirements(
    job_id: str,
    update_in: JobRequirementsUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allow candidate to review, reorder, edit, or adjust priorities of extracted requirements
    before launching code repository assessment.
    """
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")

    if update_in.title:
        job.title = update_in.title
    if update_in.company:
        job.company = update_in.company

    reqs_json = json.dumps([r.model_dump() for r in update_in.extracted_requirements])
    job.extracted_requirements_json = reqs_json

    db.add(job)
    db.commit()
    db.refresh(job)

    return format_job_response(job)


@router.get("", response_model=List[JobResponse], summary="List all jobs for current user")
def list_jobs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    jobs = db.query(Job).filter(Job.user_id == current_user.id).order_by(Job.created_at.desc()).all()
    return [format_job_response(j) for j in jobs]


@router.get("/{job_id}", response_model=JobResponse, summary="Get single job details")
def get_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == current_user.id).first()
    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job posting not found.")
    return format_job_response(job)
