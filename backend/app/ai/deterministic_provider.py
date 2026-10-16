import re
from typing import List, Dict, Any
from app.ai.base import BaseAIProvider


from app.services.rag_service import chunk_repository_snapshot, DeterministicLexicalRetrievalProvider


class DeterministicProvider(BaseAIProvider):
    """
    Deterministic rule-based assessment engine with Evidence RAG.
    Performs deterministic evidence extraction against exact repository chunks and résumé text.
    Ensures 100% stable, zero-hallucination citations during tests and when external AI key is absent.
    """

    def __init__(self):
        self.retrieval_provider = DeterministicLexicalRetrievalProvider()

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

        # Chunk all repository snapshot files
        all_chunks = chunk_repository_snapshot(repository_snapshot)

        resume_lower = resume_text.lower()

        for req in requirements:
            req_id = req.get("id") or req.get("requirement_id", "REQ-1")
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

            # 2. Inspect repository evidence via Evidence RAG
            rag_result = self.retrieval_provider.retrieve_chunks_for_requirement(req, all_chunks, top_k=3)
            repo_citations = []
            
            if rag_result.retrieved_chunks and rag_result.retrieval_quality in ("high", "moderate"):
                top_chunk = rag_result.retrieved_chunks[0]
                chunk_lines = top_chunk.content.split("\n")
                
                # Locate most relevant line inside chunk
                best_line_offset = 0
                for idx, line in enumerate(chunk_lines):
                    if any(t in line.lower() for t in skill_tokens):
                        best_line_offset = idx
                        break

                start_l = top_chunk.start_line + best_line_offset
                end_l = min(top_chunk.end_line, start_l + 3)
                
                slice_start = best_line_offset
                slice_end = min(len(chunk_lines), best_line_offset + 4)
                excerpt_lines = chunk_lines[slice_start:slice_end]
                raw_excerpt = "\n".join(excerpt_lines)

                if top_chunk.file_type == "implementation":
                    evidence_type = "implementation"
                    repo_status = "demonstrated"
                    repo_explanation = f"Found substantive implementation evidence of {skill} in '{top_chunk.file_path}' (lines {start_l}-{end_l})."
                elif top_chunk.file_type == "test":
                    evidence_type = "test_code"
                    repo_status = "partial_or_needs_review"
                    repo_explanation = f"Found test suite code exercising {skill} in '{top_chunk.file_path}' (lines {start_l}-{end_l})."
                elif top_chunk.file_type == "documentation":
                    evidence_type = "documentation"
                    repo_status = "partial_or_needs_review"
                    repo_explanation = f"Found documentation mentioning {skill} in '{top_chunk.file_path}'."
                else:
                    evidence_type = "configuration"
                    repo_status = "partial_or_needs_review"
                    repo_explanation = f"Found configuration/dependency declaring {skill} in '{top_chunk.file_path}', but no deeper runtime logic in inspected files."

                repo_citations.append({
                    "evidence_type": evidence_type,
                    "repo_url": repo_url,
                    "branch": branch,
                    "commit_sha": commit_sha,
                    "file_path": top_chunk.file_path,
                    "start_line": start_l,
                    "end_line": end_l,
                    "excerpt": raw_excerpt,
                    "commit_url": None  # Will be generated and validated by citation validator
                })
            else:
                repo_status = "not_demonstrated_in_analyzed_scope"
                repo_explanation = f"No source code demonstrating {skill} was found across the {len(files)} files analyzed in commit {commit_sha[:7] if commit_sha else 'HEAD'}."

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
