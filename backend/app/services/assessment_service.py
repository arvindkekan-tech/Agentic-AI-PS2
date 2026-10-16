import json
from typing import Dict, Any, List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.job import Job
from app.models.resume import Resume
from app.models.repository import Repository
from app.models.assessment import Assessment
from app.models.requirement import RequirementAssessment
from app.models.citation import Citation
from app.ai.factory import get_ai_provider
from app.services.citation_validator import validate_and_adjust_finding
from app.services.github_service import fetch_repository_snapshot


def create_and_run_assessment(
    db: Session,
    user: User,
    job_id: str,
    resume_id: str,
    repository_id: str,
    force_deterministic: bool = False
) -> Assessment:
    """
    Orchestrate full Phase 1 assessment:
    1. Verify resource ownership
    2. Extract requirements, résumé text, and repository snapshot
    3. Execute AI provider evaluation
    4. Deterministically validate all citations
    5. Persist assessment, requirements, citations, and summary counts
    Preserves prior successful assessments upon any pipeline error.
    """
    # 1. Ownership & existence verification
    job = db.query(Job).filter(Job.id == job_id, Job.user_id == user.id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job posting not found or not owned by authenticated user."
        )

    resume = db.query(Resume).filter(Resume.id == resume_id, Resume.user_id == user.id).first()
    if not resume:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Résumé not found or not owned by authenticated user."
        )

    repo_record = db.query(Repository).filter(Repository.id == repository_id, Repository.user_id == user.id).first()
    if not repo_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found or not owned by authenticated user."
        )

    # 2. Extract inputs
    try:
        raw_reqs = json.loads(job.extracted_requirements_json)
    except Exception:
        raw_reqs = []

    if not raw_reqs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job posting contains no extracted requirements to assess."
        )

    # Fetch live snapshot matching the analyzed SHA or branch
    try:
        snapshot = fetch_repository_snapshot(repo_record.repo_url, repo_record.branch)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"GitHub repository snapshot error: {str(e)}"
        )

    # 3. Choose provider and execute
    provider = get_ai_provider(force_deterministic=force_deterministic)
    provider_name = "gemini" if "Gemini" in provider.__class__.__name__ else "deterministic"
    model_name = getattr(provider, "model", "rule-engine-v1")

    try:
        raw_findings = provider.assess_requirements(
            requirements=raw_reqs,
            resume_text=resume.extracted_text,
            repository_snapshot=snapshot
        )
    except Exception as e:
        # If provider fails, we raise an assessment error without corrupting or overwriting earlier assessments
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Assessment engine error: {str(e)}"
        )

    # 4. Deterministic Citation Validation & Status Adjustment
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

    # Overall status
    total_reqs = len(validated_findings)
    if status_counts["demonstrated"] == total_reqs and total_reqs > 0:
        overall_status = "demonstrated"
    elif status_counts["demonstrated"] > 0 or status_counts["partial_or_needs_review"] > 0:
        overall_status = "partial_or_needs_review"
    else:
        overall_status = "not_demonstrated_in_analyzed_scope"

    # 5. Phase 2 Advanced Career Intelligence Calculations
    from app.services.scoring_service import calculate_assessment_scores
    from app.services.career_intelligence_service import (
        build_3way_alignment_matrix,
        generate_actionable_recommendations,
        map_file_evidence_findings
    )

    scores = calculate_assessment_scores(validated_findings)
    alignment_matrix = build_3way_alignment_matrix(validated_findings)
    recommendations = generate_actionable_recommendations(validated_findings)
    file_findings = map_file_evidence_findings(validated_findings, snapshot.get("inspected_files", []))

    # 6. Persist Assessment
    assessment = Assessment(
        user_id=user.id,
        job_id=job.id,
        resume_id=resume.id,
        repository_id=repo_record.id,
        status=overall_status,
        processing_status="completed",
        error_message=None,
        provider_name=provider_name,
        model_name=model_name,
        summary_counts_json=json.dumps(status_counts),
        compatibility_score=scores.compatibility_score,
        evidence_coverage=scores.evidence_coverage,
        evidence_match_score=scores.evidence_match_score,
        resume_alignment_score=scores.resume_alignment_score,
        scoring_metadata_json=scores.model_dump_json(),
        recommendations_json=json.dumps([r.model_dump() for r in recommendations]),
        alignment_matrix_json=json.dumps([m.model_dump() for m in alignment_matrix]),
        file_findings_json=json.dumps([f.model_dump() for f in file_findings])
    )
    db.add(assessment)
    db.flush()

    # Persist requirement findings & citations
    for finding in validated_findings:
        req_item = RequirementAssessment(
            assessment_id=assessment.id,
            requirement_id=finding.get("requirement_id", "REQ-1"),
            original_wording=finding.get("original_wording", ""),
            normalized_skill=finding.get("normalized_skill", ""),
            priority_type=finding.get("priority_type", "required"),
            weight=2 if finding.get("priority_type", "required") == "required" else 1,
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

    db.commit()
    db.refresh(assessment)
    return assessment
