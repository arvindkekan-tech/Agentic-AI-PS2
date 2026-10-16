from typing import Dict, Any, List, Optional
from app.models.assessment import Assessment
from app.schemas.assessment import (
    TrustReportResponse,
    EvidenceCoverageSchema,
    CitationValiditySchema,
    AssessmentConfidenceSchema,
    RepositoryProvenanceSchema,
    IntegritySignalSchema
)


def generate_trust_and_evidence_report(
    assessment: Assessment,
    snapshot: Optional[Dict[str, Any]] = None
) -> TrustReportResponse:
    """
    Generate an explainable, decoupled 5-dimensional Evidence Integrity report.
    Guarantees no arbitrary black-box 'fraud score' is used.
    Dimensions:
    1. Evidence Coverage
    2. Citation Validity
    3. Assessment Confidence
    4. Repository Provenance
    5. Integrity Signals
    """
    snapshot = snapshot or {}
    files = snapshot.get("files", {})
    excluded = snapshot.get("excluded_files", [])
    coverage_info = snapshot.get("coverage", {})

    repo = assessment.repository
    if not files and repo:
        inspected_count = repo.inspected_files_count or 0
        total_discovered = repo.total_files_count or inspected_count
        excluded_count = max(0, total_discovered - inspected_count)
    else:
        inspected_count = len(files)
        excluded_count = len(excluded)
        total_discovered = inspected_count + excluded_count

    # 1. Evidence Coverage
    coverage_ratio = (inspected_count / total_discovered) if total_discovered > 0 else 1.0
    excluded_disclosures = []
    if excluded_count > 0:
        sample_excluded = [ex.get("path", "") if isinstance(ex, dict) else str(ex) for ex in excluded[:5]] if excluded else ["Non-code binaries and vendor lockfiles"]
        excluded_disclosures.append(f"Excluded {excluded_count} files/directories matching security or binary filters: {', '.join(sample_excluded)}")
    else:
        excluded_disclosures.append("All discovered text files were within size bounds and inspected.")

    coverage = EvidenceCoverageSchema(
        inspected_files_count=inspected_count,
        excluded_files_count=excluded_count,
        total_files_discovered=total_discovered,
        coverage_ratio=round(coverage_ratio, 3),
        excluded_disclosures=excluded_disclosures,
        scope_limitations=f"Static snapshot analysis bounded to {inspected_count} inspected files at current commit SHA. Runtime network dependencies and uncommitted changes not inspected."
    )

    # 2. Citation Validity
    all_citations = []
    for req in assessment.requirements:
        all_citations.extend(req.citations)

    total_citations = len(all_citations)
    verified_citations = [c for c in all_citations if getattr(c, "is_valid", False)]
    verified_count = len(verified_citations)

    citation_validity_ratio = (verified_count / total_citations) if total_citations > 0 else 1.0

    # Verify citation health and positive claims support
    all_positive_cited = True
    citation_audit_notes = []

    if total_citations == 0:
        citation_audit_notes.append("No citations were extracted from the inspected repository snapshot.")
    else:
        unverified_count = total_citations - verified_count
        if unverified_count > 0:
            citation_audit_notes.append(f"{unverified_count} of {total_citations} citation(s) could not be verified against the commit snapshot.")

    for req in assessment.requirements:
        if req.repo_status == "demonstrated":
            valid_cits = [c for c in req.citations if getattr(c, "is_valid", False) and c.evidence_type in ("implementation", "test_code")]
            if not valid_cits:
                all_positive_cited = False
                citation_audit_notes.append(f"Requirement '{req.normalized_skill}' marked demonstrated but lacked verified code citation.")

    if not citation_audit_notes:
        citation_audit_notes.append("All positive skill claims are backed by validated commit line citations.")

    citation_validity = CitationValiditySchema(
        total_citations_count=total_citations,
        verified_citations_count=verified_count,
        citation_validity_ratio=round(citation_validity_ratio, 3),
        all_positive_claims_cited=all_positive_cited,
        citation_audit_notes=citation_audit_notes
    )

    # 3. Assessment Confidence
    total_reqs = len(assessment.requirements)
    demonstrated_count = sum(1 for r in assessment.requirements if r.combined_status == "demonstrated")
    partial_count = sum(1 for r in assessment.requirements if r.combined_status == "partial_or_needs_review")
    missing_count = sum(1 for r in assessment.requirements if r.combined_status in ("not_demonstrated_in_analyzed_scope", "unable_to_assess"))

    # Confidence score: demonstrated = 1.0, partial = 0.6, missing with honest abstention = 0.8
    if total_reqs > 0:
        confidence_points = (demonstrated_count * 1.0) + (partial_count * 0.7) + (missing_count * 0.85)
        avg_confidence = confidence_points / total_reqs
    else:
        avg_confidence = 0.0

    confidence = AssessmentConfidenceSchema(
        demonstrated_count=demonstrated_count,
        partial_or_needs_review_count=partial_count,
        unassessed_or_missing_count=missing_count,
        average_confidence=round(avg_confidence, 2),
        uncertainty_disclosure="Missing evidence in this specific repository does NOT imply candidate lacks the skill; it only confirms absence within this inspected codebase snapshot."
    )

    # 4. Repository Provenance
    repo = assessment.repository
    commit_sha = (
        snapshot.get("analyzed_sha")
        or (repo.analyzed_sha if repo and repo.analyzed_sha else None)
        or (repo.last_observed_head_sha if repo and repo.last_observed_head_sha else None)
        or "unknown"
    )
    branch = snapshot.get("branch") or (repo.branch if repo and repo.branch else "main")
    repo_url = snapshot.get("repo_url") or (repo.repo_url if repo and repo.repo_url else "")
    commit_meta = snapshot.get("commit_metadata") or {}

    provenance = RepositoryProvenanceSchema(
        pinned_commit_sha=commit_sha,
        branch=branch,
        repo_url=repo_url,
        commit_timestamp=commit_meta.get("timestamp"),
        commit_author=commit_meta.get("author"),
        provenance_verified=bool(commit_sha and commit_sha != "unknown")
    )

    # 5. Integrity Signals
    signals: List[IntegritySignalSchema] = []
    signal_idx = 1

    for req in assessment.requirements:
        # Check unverified resume claim
        if req.resume_status == "demonstrated" and req.repo_status == "not_demonstrated_in_analyzed_scope":
            signals.append(IntegritySignalSchema(
                signal_id=f"SIG-{signal_idx}",
                signal_type="unverified_resume_claim",
                severity="low",
                reason=f"Skill '{req.normalized_skill}' is claimed on candidate résumé, but no supporting implementation was found in the analyzed repository scope.",
                observed_evidence=f"Résumé claim: \"{req.resume_explanation}\". Repository status: {req.repo_status}.",
                limitation="Skill may be practiced in private, proprietary, or academic repositories not connected to this public assessment."
            ))
            signal_idx += 1

        # Check documentation-only claim
        if req.repo_status == "partial_or_needs_review" and any(c.evidence_type == "documentation" for c in req.citations):
            signals.append(IntegritySignalSchema(
                signal_id=f"SIG-{signal_idx}",
                signal_type="documentation_without_implementation",
                severity="low",
                reason=f"Skill '{req.normalized_skill}' is referenced in project documentation or README, but executable code logic was not found.",
                observed_evidence="Citation references repository Markdown or text documentation.",
                limitation="README may document planned architecture or upcoming features."
            ))
            signal_idx += 1

        # Check test-only evidence
        if req.repo_status == "partial_or_needs_review" and any(c.evidence_type == "test_code" for c in req.citations) and not any(c.evidence_type == "implementation" for c in req.citations):
            signals.append(IntegritySignalSchema(
                signal_id=f"SIG-{signal_idx}",
                signal_type="test_without_standalone_implementation",
                severity="low",
                reason=f"Skill '{req.normalized_skill}' is exercised in test suite, but core business logic was not verified in inspected source files.",
                observed_evidence="Found test files exercising the skill without verified production module.",
                limitation="Implementation may be handled by an external imported package."
            ))
            signal_idx += 1

    # Transparent Internal Evidence Index
    # Formula: 30% Coverage + 40% Citation Verification + 30% Demonstrated Alignment
    demonstrated_ratio = (demonstrated_count / total_reqs) if total_reqs > 0 else 0.0
    evidence_index = round(
        (coverage_ratio * 30.0) + (citation_validity_ratio * 40.0) + (demonstrated_ratio * 30.0),
        1
    )

    return TrustReportResponse(
        assessment_id=assessment.id,
        evidence_coverage=coverage,
        citation_validity=citation_validity,
        assessment_confidence=confidence,
        provenance=provenance,
        integrity_signals=signals,
        internal_evidence_index=evidence_index,
        formula_explanation="Internal Evidence Quality Index = (Coverage x 30%) + (Citation Verification x 40%) + (Verified Alignment x 30%).",
        disclaimer="IMPORTANT: This index measures repository evidence completeness and citation verification within the inspected scope. It is NOT an applicant honesty score or hiring prediction."
    )
