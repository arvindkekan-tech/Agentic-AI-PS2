from typing import Dict, Any, Tuple, Optional, List


def validate_repository_citation(
    citation_data: Dict[str, Any],
    snapshot: Dict[str, Any]
) -> Tuple[bool, str, Optional[str]]:
    """
    Deterministically validate a repository citation against the analyzed snapshot.
    Checks:
    1. SHA matches analyzed commit SHA
    2. Path exists in snapshot
    3. Start and end line numbers are within bounds
    4. Excerpt matches the snapshot line content
    5. Generates commit-pinned GitHub URL
    """
    commit_sha = citation_data.get("commit_sha", "")
    analyzed_sha = snapshot.get("analyzed_sha", "")

    if not commit_sha or commit_sha != analyzed_sha:
        return (
            False,
            f"Citation SHA mismatch. Expected analyzed SHA {analyzed_sha[:7]}, got {commit_sha[:7] if commit_sha else 'empty'}.",
            None
        )

    file_path = citation_data.get("file_path", "")
    files = snapshot.get("files", {})
    if not file_path or file_path not in files:
        return (
            False,
            f"File '{file_path}' does not exist in the analyzed repository snapshot.",
            None
        )

    file_entry = files[file_path]
    lines: List[str] = file_entry.get("lines", [])
    total_lines = len(lines)

    start_line = citation_data.get("start_line")
    end_line = citation_data.get("end_line")

    if start_line is None or end_line is None:
        return (
            False,
            "Citation missing line numbers.",
            None
        )

    if start_line < 1 or end_line < start_line or end_line > total_lines:
        return (
            False,
            f"Line range {start_line}-{end_line} is out of bounds for file with {total_lines} lines.",
            None
        )

    # Extract actual lines (1-indexed)
    actual_lines = lines[start_line - 1 : end_line]
    expected_block = "\n".join(actual_lines).strip()
    provided_excerpt = citation_data.get("excerpt", "").strip()

    # Normalize whitespace for comparison
    def normalize_ws(s: str) -> str:
        return "\n".join(line.strip() for line in s.splitlines() if line.strip())

    if normalize_ws(expected_block) != normalize_ws(provided_excerpt):
        return (
            False,
            f"Citation excerpt does not match lines {start_line}-{end_line} in '{file_path}'.",
            None
        )

    owner = snapshot.get("owner", "")
    repo_name = snapshot.get("name", "")
    commit_url = f"https://github.com/{owner}/{repo_name}/blob/{analyzed_sha}/{file_path}#L{start_line}-L{end_line}"

    return (True, "Citation successfully verified against repository snapshot.", commit_url)


def validate_resume_citation(excerpt: str, full_resume_text: str) -> Tuple[bool, str]:
    """Validate that a résumé quote exists in the extracted text."""
    if not excerpt or len(excerpt.strip()) < 5:
        return (False, "Résumé citation excerpt is empty or too brief.")

    clean_excerpt = excerpt.strip().lower()
    clean_full = full_resume_text.lower()

    if clean_excerpt in clean_full:
        return (True, "Verified excerpt matches applicant résumé text.")

    # Try word set match if whitespace/wrapping differs
    words = [w for w in clean_excerpt.split() if len(w) > 3]
    if len(words) >= 4 and all(w in clean_full for w in words):
        return (True, "Verified key terms matched in applicant résumé text.")

    return (False, "Citation excerpt could not be verified in extracted résumé text.")


def validate_and_adjust_finding(
    finding: Dict[str, Any],
    snapshot: Dict[str, Any],
    resume_text: str
) -> Dict[str, Any]:
    """
    Deterministically validate all citations in a finding and adjust statuses if needed.
    Enforces that 'demonstrated' repository status requires at least one valid supporting citation.
    """
    validated_citations = []
    valid_repo_citations_count = 0

    for cit in finding.get("citations", []):
        evidence_type = cit.get("evidence_type", "implementation")
        
        if evidence_type in ("implementation", "test_code", "configuration", "documentation"):
            # Repo citation
            is_valid, note, commit_url = validate_repository_citation(cit, snapshot)
            cit["is_valid"] = is_valid
            cit["validation_note"] = note
            if commit_url:
                cit["commit_url"] = commit_url
            if is_valid:
                valid_repo_citations_count += 1
        elif evidence_type == "resume_claim":
            # Resume citation
            is_valid, note = validate_resume_citation(cit.get("excerpt", ""), resume_text)
            cit["is_valid"] = is_valid
            cit["validation_note"] = note
        else:
            cit["is_valid"] = False
            cit["validation_note"] = f"Unknown evidence type '{evidence_type}'."

        validated_citations.append(cit)

    finding["citations"] = validated_citations

    # Enforce requirement: A demonstrated repository status requires at least one validated supporting citation
    repo_status = finding.get("repo_status", "not_demonstrated_in_analyzed_scope")
    if repo_status == "demonstrated" and valid_repo_citations_count == 0:
        finding["repo_status"] = "partial_or_needs_review"
        limitation_add = " [Verification Note: Repository finding was downgraded from 'demonstrated' to 'partial_or_needs_review' because no valid verifiable code citations could be confirmed.]"
        finding["limitations_note"] = (finding.get("limitations_note") or "") + limitation_add
        finding["repo_explanation"] = (finding.get("repo_explanation") or "") + " (Lacks validated code citation in snapshot)."

    # Recalculate combined status honestly
    resume_status = finding.get("resume_status", "not_demonstrated_in_analyzed_scope")
    repo_status = finding["repo_status"]

    if repo_status == "demonstrated" and resume_status == "demonstrated":
        finding["combined_status"] = "demonstrated"
    elif repo_status == "demonstrated" and resume_status != "demonstrated":
        finding["combined_status"] = "partial_or_needs_review"
        finding["combined_interpretation"] += " (Demonstrated in repository code, but not explicitly articulated in résumé)."
    elif resume_status == "demonstrated" and repo_status != "demonstrated":
        finding["combined_status"] = "partial_or_needs_review"
        finding["combined_interpretation"] += " (Claimed on résumé, but not demonstrated within analyzed repository scope)."
    elif repo_status == "partial_or_needs_review" or resume_status == "partial_or_needs_review":
        finding["combined_status"] = "partial_or_needs_review"
    else:
        finding["combined_status"] = "not_demonstrated_in_analyzed_scope"

    return finding
