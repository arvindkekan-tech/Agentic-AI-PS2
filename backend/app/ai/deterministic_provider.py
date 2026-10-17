import re
from typing import List, Dict, Any
from app.ai.base import BaseAIProvider


class DeterministicProvider(BaseAIProvider):
    """
    Deterministic rule-based assessment engine.
    Performs deterministic evidence extraction against the exact repository lines and résumé text.
    Ensures 100% stable, zero-hallucination citations during tests and when external AI key is absent.
    """

    def assess_requirements(
        self,
        requirements: List[Dict[str, Any]],
        resume_text: str,
        repository_snapshot: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        findings = []
        files = repository_snapshot.get("files", {})
        repo_url = repository_snapshot.get("repo_url", "")
        branch = repository_snapshot.get("branch", "main")
        commit_sha = repository_snapshot.get("analyzed_sha", "")

        resume_lower = resume_text.lower()

        for req in requirements:
            req_id = req.get("id", "REQ-1")
            skill = req.get("normalized_skill", "")
            wording = req.get("original_wording", "")
            priority = req.get("priority_type", "required")

            skill_tokens = [t.lower() for t in re.split(r"[\s/,&]+", skill) if len(t) > 2]
            if not skill_tokens:
                skill_tokens = [skill.lower()]

            # 1. Inspect résumé evidence
            resume_sentences = [s.strip() for s in re.split(r"[\n\.\u2022\*\-]", resume_text) if len(s.strip()) > 15]
            matched_resume_sentence = None
            for s in resume_sentences:
                s_lower = s.lower()
                if any(token in s_lower for token in skill_tokens):
                    matched_resume_sentence = s
                    break

            resume_citations = []
            if matched_resume_sentence:
                resume_status = "demonstrated"
                resume_explanation = f"Applicant explicitly documents experience with {skill} on résumé."
                resume_citations.append({
                    "evidence_type": "resume_claim",
                    "repo_url": None,
                    "branch": None,
                    "commit_sha": None,
                    "file_path": None,
                    "start_line": None,
                    "end_line": None,
                    "excerpt": matched_resume_sentence[:200],
                    "commit_url": None
                })
            else:
                resume_status = "not_demonstrated_in_analyzed_scope"
                resume_explanation = f"No explicit statement or documentation of {skill} was identified in the parsed résumé text."

            # 2. Inspect repository evidence
            repo_citations = []
            matched_file_path = None
            start_l = 1
            end_l = 1
            excerpt_lines = []
            evidence_type = "implementation"

            for path, file_info in files.items():
                lines = file_info.get("lines", [])
                for i, line in enumerate(lines):
                    line_lower = line.lower()
                    if any(token in line_lower for token in skill_tokens):
                        # Found a match! Extract a bounded 1 to 5 line window
                        matched_file_path = path
                        start_l = max(1, i + 1)
                        end_l = min(len(lines), i + 3)
                        excerpt_lines = lines[start_l - 1 : end_l]
                        
                        # Determine evidence type
                        if "test" in path.lower() or "spec" in path.lower():
                            evidence_type = "test_code"
                        elif any(cfg in path.lower() for cfg in ["config", "package.json", "requirements", "docker", ".yaml"]):
                            evidence_type = "configuration"
                        elif path.endswith(".md"):
                            evidence_type = "documentation"
                        else:
                            evidence_type = "implementation"
                        break
                if matched_file_path:
                    break

            if matched_file_path and excerpt_lines:
                raw_excerpt = "\n".join(excerpt_lines)
                if evidence_type == "implementation":
                    repo_status = "demonstrated"
                    repo_explanation = f"Found substantive implementation evidence of {skill} in '{matched_file_path}' (lines {start_l}-{end_l})."
                elif evidence_type == "test_code":
                    repo_status = "partial_or_needs_review"
                    repo_explanation = f"Found test suite code exercising {skill} in '{matched_file_path}' (lines {start_l}-{end_l})."
                elif evidence_type == "configuration":
                    repo_status = "partial_or_needs_review"
                    repo_explanation = f"Found configuration/dependency declaring {skill} in '{matched_file_path}', but no deeper runtime logic in inspected files."
                else:
                    repo_status = "partial_or_needs_review"
                    repo_explanation = f"Found documentation mentioning {skill} in '{matched_file_path}'."

                repo_citations.append({
                    "evidence_type": evidence_type,
                    "repo_url": repo_url,
                    "branch": branch,
                    "commit_sha": commit_sha,
                    "file_path": matched_file_path,
                    "start_line": start_l,
                    "end_line": end_l,
                    "excerpt": raw_excerpt,
                    "commit_url": None  # Will be generated and validated by citation validator
                })
            else:
                repo_status = "not_demonstrated_in_analyzed_scope"
                repo_explanation = f"No source code demonstrating {skill} was found across the {len(files)} files analyzed in commit {commit_sha[:7]}."

            # 3. Combined interpretation
            all_citations = resume_citations + repo_citations
            if resume_status == "demonstrated" and repo_status == "demonstrated":
                combined_status = "demonstrated"
                combined_interpretation = f"Strong multi-source alignment: Applicant explicitly claims {skill} on résumé and provides verified implementation in repository code."
                limitations_note = "Evaluation is bounded by the static scope of the inspected branch snapshot. Production scalability not tested."
                improvement_action = f"Add integration tests covering boundary conditions for the {skill} module."
            elif repo_status == "demonstrated" and resume_status != "demonstrated":
                combined_status = "partial_or_needs_review"
                combined_interpretation = f"Code evidence exists for {skill}, but applicant omitted it from their résumé. Visible code demonstrates capability."
                limitations_note = "Skill is active in source code but unreferenced in professional experience summary."
                improvement_action = f"Update résumé bullet points to explicitly highlight your hands-on implementation of {skill}."
            elif resume_status == "demonstrated" and repo_status != "demonstrated":
                combined_status = "partial_or_needs_review"
                combined_interpretation = f"Applicant documents {skill} on résumé, but no supporting code was found in the analyzed repository scope."
                limitations_note = "The skill may be implemented in other private repositories, prior company codebases, or uninspected files."
                improvement_action = f"Add a sample project or module in this repository demonstrating your {skill} expertise with unit tests."
            else:
                combined_status = "not_demonstrated_in_analyzed_scope"
                combined_interpretation = f"Neither the parsed résumé nor the analyzed repository files contain demonstrable evidence of {skill}."
                limitations_note = f"Analysis limited to {len(files)} files in branch '{branch}'. Absence in this snapshot does not prove the applicant lacks this skill."
                improvement_action = f"Build and commit an end-to-end example project highlighting core {skill} architecture."

            findings.append({
                "requirement_id": req_id,
                "original_wording": wording,
                "normalized_skill": skill,
                "priority_type": priority,
                "resume_status": resume_status,
                "resume_explanation": resume_explanation,
                "repo_status": repo_status,
                "repo_explanation": repo_explanation,
                "combined_status": combined_status,
                "combined_interpretation": combined_interpretation,
                "limitations_note": limitations_note,
                "improvement_action": improvement_action,
                "citations": all_citations
            })

        return findings
