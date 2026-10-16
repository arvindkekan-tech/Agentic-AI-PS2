import hmac
import hashlib
import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Header, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.user import User
from app.models.repository import Repository
from app.models.change_event import ChangeEvent
from app.schemas.change_event import (
    ChangeEventResponse,
    MonitoringStatusResponse,
    MonitoringUpdateRequest,
    ChangedFileItem,
    RequirementDiffItem
)
from app.services.auth_service import get_current_user
from app.services.watcher_service import check_repository_for_updates

router = APIRouter(prefix="/monitoring", tags=["Monitoring & Change Detection"])


def format_change_event(event: ChangeEvent) -> ChangeEventResponse:
    try:
        changed_files_raw = json.loads(event.changed_files_json)
        changed_files = [ChangedFileItem(**f) for f in changed_files_raw]
    except Exception:
        changed_files = []

    try:
        diff_raw = json.loads(event.before_after_diff_json)
        before_after_diff = [RequirementDiffItem(**d) for d in diff_raw]
    except Exception:
        before_after_diff = []

    return ChangeEventResponse(
        id=event.id,
        repository_id=event.repository_id,
        assessment_id=event.assessment_id,
        previous_assessment_id=event.previous_assessment_id,
        branch=event.branch,
        commit_sha=event.commit_sha,
        parent_sha=event.parent_sha,
        commit_message=event.commit_message,
        commit_author=event.commit_author,
        commit_url=event.commit_url,
        changed_files=changed_files,
        status=event.status,
        summary=event.summary,
        error_message=event.error_message,
        before_after_diff=before_after_diff,
        created_at=event.created_at,
        updated_at=event.updated_at
    )


@router.get("/status/{repository_id}", response_model=MonitoringStatusResponse, summary="Get repository monitoring status and latest event")
def get_monitoring_status(
    repository_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = db.query(Repository).filter(
        Repository.id == repository_id,
        Repository.user_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found.")

    latest_event = db.query(ChangeEvent).filter(
        ChangeEvent.repository_id == repo.id
    ).order_by(ChangeEvent.created_at.desc()).first()

    events_count = db.query(ChangeEvent).filter(
        ChangeEvent.repository_id == repo.id
    ).count()

    return MonitoringStatusResponse(
        repository_id=repo.id,
        repo_url=repo.repo_url,
        branch=repo.branch,
        analyzed_sha=repo.analyzed_sha,
        last_observed_head_sha=repo.last_observed_head_sha,
        last_checked_at=repo.last_checked_at,
        monitoring_enabled=repo.monitoring_enabled,
        monitoring_interval_seconds=repo.monitoring_interval_seconds,
        latest_event=format_change_event(latest_event) if latest_event else None,
        events_count=events_count
    )


@router.post("/check-now/{repository_id}", response_model=Optional[ChangeEventResponse], summary="Trigger immediate check for new commits")
def check_repository_now(
    repository_id: str,
    force: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = db.query(Repository).filter(
        Repository.id == repository_id,
        Repository.user_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found.")

    event = check_repository_for_updates(db, repo.id, force=force)
    if event:
        return format_change_event(event)
    return None


@router.get("/events", response_model=List[ChangeEventResponse], summary="List change events")
def list_change_events(
    repository_id: Optional[str] = None,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ChangeEvent).join(Repository).filter(Repository.user_id == current_user.id)
    if repository_id:
        query = query.filter(ChangeEvent.repository_id == repository_id)

    events = query.order_by(ChangeEvent.created_at.desc()).limit(limit).all()
    return [format_change_event(e) for e in events]


@router.get("/events/{event_id}", response_model=ChangeEventResponse, summary="Get single change event detail")
def get_change_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    event = db.query(ChangeEvent).join(Repository).filter(
        ChangeEvent.id == event_id,
        Repository.user_id == current_user.id
    ).first()
    if not event:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Change event not found.")

    return format_change_event(event)


@router.patch("/repositories/{repository_id}", response_model=MonitoringStatusResponse, summary="Configure monitoring preferences")
def update_monitoring_settings(
    repository_id: str,
    update_in: MonitoringUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = db.query(Repository).filter(
        Repository.id == repository_id,
        Repository.user_id == current_user.id
    ).first()
    if not repo:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repository not found.")

    if update_in.monitoring_enabled is not None:
        repo.monitoring_enabled = update_in.monitoring_enabled
    if update_in.monitoring_interval_seconds is not None:
        repo.monitoring_interval_seconds = max(10, min(3600, update_in.monitoring_interval_seconds))

    db.commit()
    db.refresh(repo)

    latest_event = db.query(ChangeEvent).filter(
        ChangeEvent.repository_id == repo.id
    ).order_by(ChangeEvent.created_at.desc()).first()

    events_count = db.query(ChangeEvent).filter(
        ChangeEvent.repository_id == repo.id
    ).count()

    return MonitoringStatusResponse(
        repository_id=repo.id,
        repo_url=repo.repo_url,
        branch=repo.branch,
        analyzed_sha=repo.analyzed_sha,
        last_observed_head_sha=repo.last_observed_head_sha,
        last_checked_at=repo.last_checked_at,
        monitoring_enabled=repo.monitoring_enabled,
        monitoring_interval_seconds=repo.monitoring_interval_seconds,
        latest_event=format_change_event(latest_event) if latest_event else None,
        events_count=events_count
    )


@router.post("/webhook/github", summary="GitHub Webhook receiver for push events")
async def github_webhook(
    request: Request,
    db: Session = Depends(get_db),
    x_github_event: Optional[str] = Header(None, alias="X-GitHub-Event"),
    x_hub_signature_256: Optional[str] = Header(None, alias="X-Hub-Signature-256")
):
    """
    Webhook endpoint for real GitHub push notifications.
    Verifies HMAC signature if GITHUB_WEBHOOK_SECRET is set.
    """
    body = await request.body()

    if settings.GITHUB_WEBHOOK_SECRET:
        if not x_hub_signature_256:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing signature header.")
        mac = hmac.new(settings.GITHUB_WEBHOOK_SECRET.encode(), msg=body, digestmod=hashlib.sha256)
        expected_sig = "sha256=" + mac.hexdigest()
        if not hmac.compare_digest(expected_sig, x_hub_signature_256):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid webhook signature.")

    if x_github_event != "push":
        return {"status": "ignored", "reason": f"Event '{x_github_event}' is not a push event."}

    try:
        payload = json.loads(body.decode("utf-8"))
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Malformed JSON payload.")

    repo_data = payload.get("repository", {})
    repo_url = repo_data.get("html_url") or repo_data.get("url")
    ref = payload.get("ref", "")  # e.g. "refs/heads/main"
    branch = ref.split("/")[-1] if "/" in ref else ref
    head_sha = payload.get("after")

    if not repo_url or not head_sha or head_sha == "0000000000000000000000000000000000000000":
        return {"status": "ignored", "reason": "No valid commit SHA in push event."}

    # Find matching monitored repositories
    owner = repo_data.get("owner", {}).get("name") or repo_data.get("owner", {}).get("login")
    name = repo_data.get("name")
    
    repos = db.query(Repository).filter(
        Repository.owner.ilike(owner),
        Repository.name.ilike(name),
        Repository.branch == branch,
        Repository.monitoring_enabled == True
    ).all()

    processed_events = []
    for r in repos:
        evt = check_repository_for_updates(db, r.id, force=True)
        if evt:
            processed_events.append(evt.id)

    return {
        "status": "processed",
        "matching_repositories": len(repos),
        "events_created": len(processed_events)
    }
