import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.repository import Repository
from app.models.assessment import Assessment
from app.models.requirement import RequirementAssessment
from app.models.citation import Citation
from app.models.change_event import ChangeEvent
from app.services.github_service import (
    get_branch_head_sha,
    get_commit_details_or_compare,
    fetch_repository_snapshot
)
from app.ai.factory import get_ai_provider
from app.services.citation_validator import validate_and_adjust_finding

logger = logging.getLogger(__name__)

_watcher_running = False
_watcher_task: Optional[asyncio.Task] = None


def calculate_status_delta(old_status: str, new_status: str) -> str:
    """Classify status delta between previous and current assessment."""
    status_weights = {
        "demonstrated": 3,
        "partial_or_needs_review": 2,
        "not_demonstrated_in_analyzed_scope": 1,
        "unable_to_assess": 0
    }
    old_weight = status_weights.get(old_status, 1)
    new_weight = status_weights.get(new_status, 1)
    if new_weight > old_weight:
        return "improved"
    elif new_weight < old_weight:
        return "regressed"
    return "unchanged"


def check_repository_for_updates(
    db: Session,
    repository_id: str,
    force: bool = False
) -> Optional[ChangeEvent]:
    """
    Check a repository's branch head commit.
    If a new commit SHA is observed:
      1. Deduplicate check
      2. Record ChangeEvent with commit details and changed files
      3. Reassess requirements using the new commit snapshot
      4. Compute before/after diff for Evidence Change Ledger
      5. Preserve prior successful assessment
    """
    repo = db.query(Repository).filter(Repository.id == repository_id).first()
    if not repo:
        return None

    try:
        target_branch, head_sha = get_branch_head_sha(repo.repo_url, repo.branch)
    except Exception as e:
        logger.warning(f"Error querying branch head for repo {repo.owner}/{repo.name}: {e}")
        repo.last_checked_at = datetime.now(timezone.utc)
        db.commit()
        return None

    repo.last_checked_at = datetime.now(timezone.utc)

    # Deduplication check
    if not force:
        if repo.last_observed_head_sha == head_sha:
            db.commit()
            return None

        # Check if already processed for this SHA
        existing_event = db.query(ChangeEvent).filter(
            ChangeEvent.repository_id == repo.id,
            ChangeEvent.commit_sha == head_sha,
            ChangeEvent.status.in_(["completed", "running"])
        ).first()
        if existing_event:
            repo.last_observed_head_sha = head_sha
            db.commit()
            return None

    old_sha = repo.analyzed_sha or repo.last_observed_head_sha
    repo.last_observed_head_sha = head_sha

    # Fetch commit details or comparison
    commit_details = get_commit_details_or_compare(repo.repo_url, target_branch, head_sha, old_sha)

    event = ChangeEvent(
        repository_id=repo.id,
        branch=target_branch,
        commit_sha=head_sha,
        parent_sha=old_sha if old_sha != head_sha else None,
        commit_message=commit_details["commit_message"],
        commit_author=commit_details["commit_author"],
        commit_url=commit_details["commit_url"],
        changed_files_json=json.dumps(commit_details["changed_files"]),
        status="running",
        summary=f"Detected new commit {head_sha[:7]} by {commit_details['commit_author']}"
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Find the latest assessment for this repository to re-evaluate
    latest_assessment = db.query(Assessment).filter(
        Assessment.repository_id == repo.id
    ).order_by(Assessment.created_at.desc()).first()

    if not latest_assessment:
        event.status = "completed"
        event.summary = f"New commit {head_sha[:7]} detected. No baseline assessment to re-evaluate."
        repo.analyzed_sha = head_sha
        db.commit()
        return event

    # Re-evaluate with new snapshot
    try:
        job = latest_assessment.job
        resume = latest_assessment.resume
        if not job or not resume:
            raise ValueError("Job or résumé record missing for prior assessment.")

        try:
            raw_reqs = json.loads(job.extracted_requirements_json)
        except Exception:
            raw_reqs = []

        if not raw_reqs:
            raise ValueError("No extracted requirements available in job posting.")

        # Fetch snapshot at head SHA
        snapshot = fetch_repository_snapshot(repo.repo_url, target_branch)

        # Provider evaluation
        provider = get_ai_provider(force_deterministic=(latest_assessment.provider_name == "deterministic"))
        raw_findings = provider.assess_requirements(
            requirements=raw_reqs,
            resume_text=resume.extracted_text,
            repository_snapshot=snapshot
        )

        validated_findings = []
        status_counts = {
            "demonstrated": 0,
            "partial_or_needs_review": 0,
            "not_demonstrated_in_analyzed_scope": 0,
            "unable_to_assess": 0
        }

        for finding in raw_findings:
            audited = validate_and_adjust_finding(finding, snapshot, resume.extracted_text)
            validated_findings.append(audited)
            comb_status = audited.get("combined_status", "not_demonstrated_in_analyzed_scope")
            if comb_status in status_counts:
                status_counts[comb_status] += 1
            else:
                status_counts["partial_or_needs_review"] += 1

        total_reqs = len(validated_findings)
        if status_counts["demonstrated"] == total_reqs and total_reqs > 0:
            overall_status = "demonstrated"
        elif status_counts["demonstrated"] > 0 or status_counts["partial_or_needs_review"] > 0:
            overall_status = "partial_or_needs_review"
        else:
            overall_status = "not_demonstrated_in_analyzed_scope"

        # Create new assessment record
        new_assessment = Assessment(
            user_id=repo.user_id,
            job_id=job.id,
            resume_id=resume.id,
            repository_id=repo.id,
            status=overall_status,
            processing_status="completed",
            error_message=None,
            provider_name=latest_assessment.provider_name,
            model_name=latest_assessment.model_name,
            summary_counts_json=json.dumps(status_counts)
        )
        db.add(new_assessment)
        db.flush()

        for finding in validated_findings:
            req_item = RequirementAssessment(
                assessment_id=new_assessment.id,
                requirement_id=finding.get("requirement_id", "REQ-1"),
                original_wording=finding.get("original_wording", ""),
                normalized_skill=finding.get("normalized_skill", ""),
                priority_type=finding.get("priority_type", "required"),
                resume_status=finding.get("resume_status", "not_demonstrated_in_analyzed_scope"),
                resume_explanation=finding.get("resume_explanation", ""),
                repo_status=finding.get("repo_status", "not_demonstrated_in_analyzed_scope"),
                repo_explanation=finding.get("repo_explanation", ""),
                combined_status=finding.get("combined_status", "not_demonstrated_in_analyzed_scope"),
                combined_interpretation=finding.get("combined_interpretation", ""),
                limitations_note=finding.get("limitations_note", ""),
                improvement_action=finding.get("improvement_action")
            )
            db.add(req_item)
            db.flush()

            for cit in finding.get("citations", []):
                citation_obj = Citation(
                    requirement_assessment_id=req_item.id,
                    evidence_type=cit.get("evidence_type", "implementation"),
                    repo_url=cit.get("repo_url"),
                    branch=cit.get("branch"),
                    commit_sha=cit.get("commit_sha"),
                    file_path=cit.get("file_path"),
                    start_line=cit.get("start_line"),
                    end_line=cit.get("end_line"),
                    excerpt=cit.get("excerpt", ""),
                    commit_url=cit.get("commit_url"),
                    is_valid=cit.get("is_valid", False),
                    validation_note=cit.get("validation_note", "")
                )
                db.add(citation_obj)

        # Build before/after diff for Evidence Change Ledger
        old_req_map = {r.requirement_id: r for r in latest_assessment.requirements}
        diff_items = []
        for finding in validated_findings:
            req_id = finding.get("requirement_id", "")
            old_req = old_req_map.get(req_id)
            prev_status = old_req.combined_status if old_req else "not_demonstrated_in_analyzed_scope"
            curr_status = finding.get("combined_status", "not_demonstrated_in_analyzed_scope")
            prev_cits_count = len(old_req.citations) if old_req else 0
            curr_cits_count = len(finding.get("citations", []))

            delta = calculate_status_delta(prev_status, curr_status)
            diff_items.append({
                "requirement_id": req_id,
                "skill": finding.get("normalized_skill", ""),
                "previous_status": prev_status,
                "current_status": curr_status,
                "status_delta": delta,
                "previous_citations_count": prev_cits_count,
                "current_citations_count": curr_cits_count,
                "citations_diff_summary": f"Evidence citations changed from {prev_cits_count} to {curr_cits_count}."
            })

        # Update event and repo
        event.assessment_id = new_assessment.id
        event.previous_assessment_id = latest_assessment.id
        event.before_after_diff_json = json.dumps(diff_items)
        event.status = "completed"
        event.summary = f"Reassessed {len(diff_items)} requirements against commit {head_sha[:7]}."

        repo.analyzed_sha = head_sha
        repo.inspected_files_count = snapshot["coverage"].inspected_files_count
        repo.total_files_count = snapshot["coverage"].total_files_count

        db.commit()
        db.refresh(event)
        logger.info(f"Successfully reassessed repository {repo.id} against commit {head_sha[:7]}")
        return event

    except Exception as e:
        logger.error(f"Reassessment failed for commit {head_sha[:7]}: {e}")
        event.status = "failed"
        event.error_message = str(e)
        event.summary = f"Automatic reassessment failed: {str(e)}"
        db.commit()
        return event


def poll_all_monitored_repositories(db: Session) -> List[ChangeEvent]:
    """Scan all active repositories with monitoring enabled."""
    repos = db.query(Repository).filter(Repository.monitoring_enabled == True).all()
    events = []
    for repo in repos:
        evt = check_repository_for_updates(db, repo.id)
        if evt:
            events.append(evt)
    return events


async def run_watcher_background_loop():
    """Background async worker polling active repositories at interval."""
    global _watcher_running
    logger.info("ProofPath Repository Watcher background worker started.")
    while _watcher_running:
        try:
            with SessionLocal() as db:
                poll_all_monitored_repositories(db)
        except Exception as e:
            logger.error(f"Watcher background iteration error: {e}")

        # Sleep in small slices to allow clean cancellation
        for _ in range(settings.WATCHER_POLL_INTERVAL_SECONDS):
            if not _watcher_running:
                break
            await asyncio.sleep(1)


def start_watcher():
    """Start background watcher loop."""
    global _watcher_running, _watcher_task
    if settings.WATCHER_ENABLED and not _watcher_running:
        _watcher_running = True
        try:
            loop = asyncio.get_running_loop()
            _watcher_task = loop.create_task(run_watcher_background_loop())
        except RuntimeError:
            pass


def stop_watcher():
    """Stop background watcher loop."""
    global _watcher_running, _watcher_task
    _watcher_running = False
    if _watcher_task and not _watcher_task.done():
        _watcher_task.cancel()
