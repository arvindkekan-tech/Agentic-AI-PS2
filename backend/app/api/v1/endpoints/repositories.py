import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.repository import Repository
from app.schemas.repository import (
    RepositoryInspectRequest,
    RepositoryResponse,
    InspectedFileItem,
    ExcludedFileItem,
    SnapshotCoverage
)
from app.services.auth_service import get_current_user
from app.services.github_service import fetch_repository_snapshot

router = APIRouter(prefix="/repositories", tags=["Repositories"])


def format_repo_response(repo: Repository) -> RepositoryResponse:
    try:
        meta = json.loads(repo.snapshot_metadata_json)
    except Exception:
        meta = {}

    inspected_files = [InspectedFileItem(**f) for f in meta.get("inspected_files", [])]
    excluded_files = [ExcludedFileItem(**f) for f in meta.get("excluded_files", [])]
    
    cov_dict = meta.get("coverage", {})
    coverage = SnapshotCoverage(
        inspected_files_count=cov_dict.get("inspected_files_count", repo.inspected_files_count),
        excluded_files_count=cov_dict.get("excluded_files_count", 0),
        total_files_count=cov_dict.get("total_files_count", repo.total_files_count),
        inspected_lines_total=cov_dict.get("inspected_lines_total", 0),
        languages_detected=cov_dict.get("languages_detected", []),
        limitations=cov_dict.get("limitations", [])
    )

    return RepositoryResponse(
        id=repo.id,
        user_id=repo.user_id,
        repo_url=repo.repo_url,
        owner=repo.owner,
        name=repo.name,
        branch=repo.branch,
        analyzed_sha=repo.analyzed_sha,
        inspected_files_count=repo.inspected_files_count,
        total_files_count=repo.total_files_count,
        inspected_files=inspected_files,
        excluded_files=excluded_files,
        coverage=coverage,
        created_at=repo.created_at
    )


@router.post("", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED, summary="Inspect GitHub repository")
def inspect_repository(
    repo_in: RepositoryInspectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch repository snapshot, branch SHA, and source files.
    Excludes binaries, dependencies, and oversized files.
    """
    snapshot = fetch_repository_snapshot(repo_in.repo_url, repo_in.branch)

    meta_json = json.dumps({
        "inspected_files": [f.model_dump() for f in snapshot["inspected_files"]],
        "excluded_files": [f.model_dump() for f in snapshot["excluded_files"]],
        "coverage": snapshot["coverage"].model_dump()
    })

    repo = Repository(
        user_id=current_user.id,
        repo_url=snapshot["repo_url"],
        owner=snapshot["owner"],
        name=snapshot["name"],
        branch=snapshot["branch"],
        analyzed_sha=snapshot["analyzed_sha"],
        inspected_files_count=snapshot["coverage"].inspected_files_count,
        total_files_count=snapshot["coverage"].total_files_count,
        snapshot_metadata_json=meta_json
    )
    db.add(repo)
    db.commit()
    db.refresh(repo)

    return format_repo_response(repo)


@router.get("", response_model=List[RepositoryResponse], summary="List all inspected repositories for current user")
def list_repositories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repos = db.query(Repository).filter(Repository.user_id == current_user.id).order_by(Repository.created_at.desc()).all()
    return [format_repo_response(r) for r in repos]


@router.get("/{repo_id}", response_model=RepositoryResponse, summary="Get repository snapshot details")
def get_repository(
    repo_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = db.query(Repository).filter(Repository.id == repo_id, Repository.user_id == current_user.id).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found.")
    return format_repo_response(repo)
