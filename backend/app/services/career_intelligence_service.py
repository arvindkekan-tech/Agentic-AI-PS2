from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class AlignmentMatrixItem(BaseModel):
    requirement_id: str
    normalized_skill: str
    priority_type: str
    resume_status: str
    repo_status: str
    combined_status: str
    alignment_category: str  # "full_match", "unverified_resume_claim", "hidden_repo_strength", "complete_gap", "partial_both", "scope_limitation"
    category_label: str
    discrepancy_explanation: str
    resume_action_suggestion: Optional[str] = None
    repo_action_suggestion: Optional[str] = None


class VerificationChecklistItem(BaseModel):
    step_number: int
    action: str
    expected_artifact: str
    verification_criterion: str


class ActionableRecommendation(BaseModel):
    requirement_id: str
    normalized_skill: str
    priority_type: str
    effort_category: str  # "quick_win", "targeted_project", "deep_skill_build"
    effort_label: str
    estimated_timeframe: str
    title: str
    description: str
    why_it_matters: str
    suggested_implementation: str
    verification_checklist: List[VerificationChecklistItem]


class FileEvidenceFinding(BaseModel):
    file_path: str
    finding_type: str  # "positive_evidence", "partial_evidence", "inconclusive"
    associated_requirements: List[str]
    citations_count: int
    lines_referenced: List[str]
    summary_excerpt: str


def build_3way_alignment_matrix(requirements: List[Dict[str, Any]]) -> List[AlignmentMatrixItem]:
    """
    Constructs a 3-way alignment matrix between Job Requirements, Résumé Claims, and Repository Evidence.
    Identifies full matches, unverified claims, hidden repo strengths, and complete gaps.
    """
    matrix: List[AlignmentMatrixItem] = []

    for req in requirements:
        req_id = req.get("requirement_id", "REQ")
        skill = req.get("normalized_skill", "")
        priority = req.get("priority_type", "required")
        resume_status = req.get("resume_status", "not_demonstrated_in_analyzed_scope")
        repo_status = req.get("repo_status", "not_demonstrated_in_analyzed_scope")
        comb_status = req.get("combined_status", "not_demonstrated_in_analyzed_scope")
        citations = req.get("citations", [])

        # Categorize alignment
        if resume_status == "demonstrated" and repo_status == "demonstrated":
            cat = "full_match"
            label = "Full Multi-Source Match"
            explanation = (
                f"Both your résumé claims and repository code solidly verify {skill}. "
                "This is a high-confidence match for hiring managers."
            )
            resume_action = None
            repo_action = "Maintain code documentation and keep test coverage active."

        elif resume_status in ["demonstrated", "partial_or_needs_review"] and repo_status in [
            "not_demonstrated_in_analyzed_scope"
        ]:
            cat = "unverified_resume_claim"
            label = "Unverified Résumé Claim"
            explanation = (
                f"Your résumé highlights {skill}, but the connected repository does not contain matching code or tests. "
                "In technical screens, interviewers may press for code artifacts."
            )
            resume_action = (
                f"Clarify scope on your résumé (e.g., mention if {skill} was used in proprietary work), "
                "or link a public repo demonstrating it."
            )
            repo_action = f"Add a sample module, utility, or test case demonstrating {skill} to your public portfolio repository."

        elif repo_status in ["demonstrated", "partial_or_needs_review"] and resume_status in [
            "not_demonstrated_in_analyzed_scope",
            "unable_to_assess",
        ]:
            cat = "hidden_repo_strength"
            label = "Hidden Repository Strength"
            explanation = (
                f"Your repository code proves practical experience with {skill}, but this was not emphasized on your résumé. "
                "You are under-representing a proven strength!"
            )
            valid_cits = [c for c in citations if c.get("is_valid")]
            sample_file = valid_cits[0].get("file_path", "source code") if valid_cits else "your repo"
            resume_action = (
                f"Add a bullet point to your résumé highlighting {skill}, referencing concrete implementation details "
                f"(e.g., as implemented in {sample_file})."
            )
            repo_action = "Document this module in your repository README to make it discoverable to recruiters."

        elif repo_status == "not_demonstrated_in_analyzed_scope" and resume_status == "not_demonstrated_in_analyzed_scope":
            cat = "complete_gap"
            label = "Identified Skill Gap"
            explanation = (
                f"Neither your résumé nor your repository demonstrates {skill}. "
                f"For a '{priority}' requirement, this represents a qualification risk."
            )
            resume_action = f"Do not add unverified claims for {skill}; prepare to address how you learn adjacent technologies."
            repo_action = f"Build a targeted proof-of-concept demonstrating {skill} to eliminate this gap."

        elif comb_status == "unable_to_assess" or repo_status == "unable_to_assess":
            cat = "scope_limitation"
            label = "Evaluation Scope Limitation"
            explanation = (
                f"{skill} involves factors outside static code analysis (e.g., soft skills, team leadership, or proprietary infrastructure)."
            )
            resume_action = f"Highlight impact metrics, team outcomes, or architectural decisions regarding {skill} on your résumé."
            repo_action = None

        else:
            cat = "partial_both"
            label = "Partial Multi-Source Alignment"
            explanation = f"Partial signals found across sources for {skill}. Further evidence or clarity recommended."
            resume_action = f"Make bullet points for {skill} more quantitative and specific."
            repo_action = f"Expand test coverage or add production-grade error handling for {skill} implementations."

        matrix.append(
            AlignmentMatrixItem(
                requirement_id=req_id,
                normalized_skill=skill,
                priority_type=priority,
                resume_status=resume_status,
                repo_status=repo_status,
                combined_status=comb_status,
                alignment_category=cat,
                category_label=label,
                discrepancy_explanation=explanation,
                resume_action_suggestion=resume_action,
                repo_action_suggestion=repo_action,
            )
        )

    return matrix


def generate_actionable_recommendations(
    requirements: List[Dict[str, Any]]
) -> List[ActionableRecommendation]:
    """
    Generates actionable, prioritized recommendations categorized by effort:
    - Quick Win: < 1 day
    - Targeted Project: 1-3 days
    - Deep Skill Build: 1+ weeks
    Includes a concrete verification checklist with expected artifacts and test criteria.
    """
    recommendations: List[ActionableRecommendation] = []

    for req in requirements:
        comb_status = req.get("combined_status", "")
        repo_status = req.get("repo_status", "")
        resume_status = req.get("resume_status", "")
        priority = req.get("priority_type", "required")
        skill = req.get("normalized_skill", "")
        req_id = req.get("requirement_id", "REQ")
        action_note = req.get("improvement_action") or ""

        # Skip requirements that are already fully demonstrated across both sources
        if resume_status == "demonstrated" and repo_status == "demonstrated":
            continue

        # If it's a hidden repo strength or simple documentation gap -> Quick Win
        if repo_status == "demonstrated" and resume_status != "demonstrated":
            recommendations.append(
                ActionableRecommendation(
                    requirement_id=req_id,
                    normalized_skill=skill,
                    priority_type=priority,
                    effort_category="quick_win",
                    effort_label="Quick Win (< 1 Day)",
                    estimated_timeframe="2 - 4 hours",
                    title=f"Highlight Proven {skill} on Résumé",
                    description=(
                        f"Your repository demonstrates practical proficiency with {skill}, but your résumé does not showcase it. "
                        "Update your résumé bullet points to describe this concrete implementation."
                    ),
                    why_it_matters="Recruiter ATS filters search résumé keywords before engineers review repository code.",
                    suggested_implementation=(
                        f"Add a bullet under your most recent project: 'Architected and implemented {skill} functionality "
                        f"ensuring modularity, error resilience, and automated verification.'"
                    ),
                    verification_checklist=[
                        VerificationChecklistItem(
                            step_number=1,
                            action="Add targeted keyword and metric to experience section",
                            expected_artifact="Updated Résumé PDF/DOCX",
                            verification_criterion=f"Text search verifies '{skill}' appears alongside quantifiable project context."
                        ),
                        VerificationChecklistItem(
                            step_number=2,
                            action="Cross-link GitHub repository in résumé header or project section",
                            expected_artifact="Clickable hyperlink in résumé",
                            verification_criterion="Hyperlink resolves directly to the repository containing the verified source code."
                        )
                    ]
                )
            )
        elif comb_status == "partial_or_needs_review":
            # Partial evidence -> Targeted Project (1-3 days)
            recommendations.append(
                ActionableRecommendation(
                    requirement_id=req_id,
                    normalized_skill=skill,
                    priority_type=priority,
                    effort_category="targeted_project",
                    effort_label="Targeted Project (1 - 3 Days)",
                    estimated_timeframe="1 - 3 days",
                    title=f"Strengthen Automated Tests & Error Handling for {skill}",
                    description=(
                        f"Partial evidence exists for {skill}, but test coverage, edge-case validation, or architectural depth is missing. "
                        f"{action_note}"
                    ),
                    why_it_matters=f"Demonstrates production readiness rather than prototype-level familiarity for {skill}.",
                    suggested_implementation=(
                        f"Create a dedicated test suite (e.g. `tests/test_{skill.lower().replace(' ', '_')}.py`) and add structured logging, "
                        "boundary condition assertions, and type annotations."
                    ),
                    verification_checklist=[
                        VerificationChecklistItem(
                            step_number=1,
                            action=f"Write automated unit and integration tests covering {skill} workflows",
                            expected_artifact=f"New test file `tests/test_{skill.lower().replace(' ', '_')}.py`",
                            verification_criterion="All tests pass cleanly in local CI or pytest/vitest runner."
                        ),
                        VerificationChecklistItem(
                            step_number=2,
                            action="Implement explicit error handling for boundary and network failures",
                            expected_artifact="Source code with typed exception handling",
                            verification_criterion="Negative test cases verify expected exception handling and graceful error responses."
                        ),
                        VerificationChecklistItem(
                            step_number=3,
                            action="Document design rationale in repository README or architecture doc",
                            expected_artifact="`docs/architecture.md` or updated `README.md`",
                            verification_criterion="Clear code snippet and setup instructions reproducible in < 5 minutes."
                        )
                    ]
                )
            )
        elif priority == "required":
            # Missing required skill -> Deep Skill Build (1+ weeks)
            recommendations.append(
                ActionableRecommendation(
                    requirement_id=req_id,
                    normalized_skill=skill,
                    priority_type=priority,
                    effort_category="deep_skill_build",
                    effort_label="Deep Skill Build (1+ Weeks)",
                    estimated_timeframe="1 - 2 weeks",
                    title=f"Build End-to-End Reference Implementation for {skill}",
                    description=(
                        f"As a core requirement for this role, {skill} is not demonstrated in your analyzed repositories. "
                        "Building an end-to-end vertical slice will directly neutralize this gap."
                    ),
                    why_it_matters=f"Required skills represent threshold criteria in hiring loops; demonstrating {skill} unlocks interviews.",
                    suggested_implementation=(
                        f"Develop a standalone microservice or portfolio module integrating {skill}. Include real data persistence, "
                        "API contract tests, and a CI/CD workflow."
                    ),
                    verification_checklist=[
                        VerificationChecklistItem(
                            step_number=1,
                            action=f"Scaffold project architecture incorporating {skill}",
                            expected_artifact="New repository or dedicated package directory",
                            verification_criterion="Clean directory structure adhering to idiomatic community conventions."
                        ),
                        VerificationChecklistItem(
                            step_number=2,
                            action="Implement core business logic with automated tests",
                            expected_artifact="Source modules and test files with >80% coverage",
                            verification_criterion="Tests execute and pass in automated test runner."
                        ),
                        VerificationChecklistItem(
                            step_number=3,
                            action="Commit code with descriptive commit messages and push to GitHub",
                            expected_artifact="Public GitHub commit history",
                            verification_criterion="ProofPath re-assessment recognizes and validates code citations."
                        )
                    ]
                )
            )

    # Sort: quick_win first, then targeted_project, then deep_skill_build
    priority_order = {"quick_win": 0, "targeted_project": 1, "deep_skill_build": 2}
    recommendations.sort(key=lambda r: priority_order.get(r.effort_category, 99))
    return recommendations


def map_file_evidence_findings(
    requirements: List[Dict[str, Any]],
    inspected_files: List[Dict[str, Any]]
) -> List[FileEvidenceFinding]:
    """
    Maps inspected repository files to requirement findings:
    - Positive evidence: valid citations exist in the file
    - Partial evidence: invalid or incomplete citations found
    - Inconclusive: inspected by scanner but no relevant citations matched
    """
    file_map: Dict[str, Dict[str, Any]] = {}

    for f in inspected_files:
        path = f.get("path", "")
        if path:
            file_map[path] = {
                "file_path": path,
                "finding_type": "inconclusive",
                "associated_requirements": [],
                "citations_count": 0,
                "lines_referenced": [],
                "summary_excerpt": ""
            }

    for req in requirements:
        skill = req.get("normalized_skill", "")
        req_id = req.get("requirement_id", "REQ")
        label = f"{req_id} ({skill})"

        for cit in req.get("citations", []):
            fpath = cit.get("file_path")
            if not fpath:
                continue

            if fpath not in file_map:
                file_map[fpath] = {
                    "file_path": fpath,
                    "finding_type": "inconclusive",
                    "associated_requirements": [],
                    "citations_count": 0,
                    "lines_referenced": [],
                    "summary_excerpt": ""
                }

            entry = file_map[fpath]
            if label not in entry["associated_requirements"]:
                entry["associated_requirements"].append(label)

            entry["citations_count"] += 1
            start = cit.get("start_line")
            end = cit.get("end_line")
            if start and end:
                entry["lines_referenced"].append(f"L{start}-L{end}")
            elif start:
                entry["lines_referenced"].append(f"L{start}")

            if not entry["summary_excerpt"] and cit.get("excerpt"):
                entry["summary_excerpt"] = cit.get("excerpt", "")[:120]

            is_valid = cit.get("is_valid", False)
            if is_valid:
                entry["finding_type"] = "positive_evidence"
            elif entry["finding_type"] != "positive_evidence":
                entry["finding_type"] = "partial_evidence"

    # Return list sorted so positive evidence files appear first
    sort_order = {"positive_evidence": 0, "partial_evidence": 1, "inconclusive": 2}
    result = [FileEvidenceFinding(**data) for data in file_map.values()]
    result.sort(key=lambda x: (sort_order.get(x.finding_type, 9), -x.citations_count, x.file_path))
    return result
