import hashlib
import re
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, Tuple
from pydantic import BaseModel, Field


class CodeChunk(BaseModel):
    chunk_id: str
    file_path: str
    start_line: int
    end_line: int
    content: str
    content_hash: str
    language: str
    file_type: str  # "implementation", "test", "config", "documentation", "other"
    symbols: List[str] = Field(default_factory=list)
    is_excluded: bool = False


class RAGRetrievalResult(BaseModel):
    requirement_id: str
    normalized_skill: str
    retrieved_chunks: List[CodeChunk]
    retrieval_score: float
    retrieval_quality: str  # "high", "moderate", "poor", "none"


def classify_file_type(file_path: str) -> str:
    lower = file_path.lower()
    if any(k in lower for k in ["test", "tests/", "_test.", ".spec.", ".test.", "_spec."]):
        return "test"
    if any(lower.endswith(ext) for ext in [".md", ".rst", ".txt", ".adoc"]):
        return "documentation"
    if any(lower.endswith(ext) or lower == "dockerfile" for ext in [".json", ".yaml", ".yml", ".toml", ".ini", ".env.example"]):
        return "config"
    return "implementation"


def extract_symbols(lines: List[str], language: str) -> List[str]:
    """Detect functions, classes, and interfaces from code lines using regex."""
    symbols = []
    py_func = re.compile(r"^\s*def\s+([a-zA-Z0-9_]+)\s*\(")
    py_class = re.compile(r"^\s*class\s+([a-zA-Z0-9_]+)")
    js_func = re.compile(r"^\s*(?:export\s+)?(?:async\s+)?function\s+([a-zA-Z0-9_]+)")
    js_const_fn = re.compile(r"^\s*(?:export\s+)?const\s+([a-zA-Z0-9_]+)\s*=\s*(?:async\s*)?\(")
    js_class = re.compile(r"^\s*(?:export\s+)?class\s+([a-zA-Z0-9_]+)")

    for line in lines:
        if language in ("Python", "python"):
            m = py_func.search(line)
            if m:
                symbols.append(m.group(1))
            m = py_class.search(line)
            if m:
                symbols.append(m.group(1))
        elif language in ("TypeScript", "JavaScript", "TypeScript (React)", "JavaScript (React)"):
            m = js_func.search(line)
            if m:
                symbols.append(m.group(1))
            m = js_const_fn.search(line)
            if m:
                symbols.append(m.group(1))
            m = js_class.search(line)
            if m:
                symbols.append(m.group(1))

    return list(dict.fromkeys(symbols))  # deduplicate preserving order


def chunk_repository_snapshot(
    snapshot: Dict[str, Any],
    chunk_size: int = 40,
    chunk_overlap: int = 10
) -> List[CodeChunk]:
    """
    Chunk all bounded files in repository snapshot into discrete CodeChunks
    with exact 1-based start and end line numbers and SHA-256 content hashes.
    """
    chunks: List[CodeChunk] = []
    files = snapshot.get("files", {})

    for file_path, finfo in files.items():
        lines = finfo.get("lines", [])
        if not lines:
            continue

        language = finfo.get("language", "Code")
        file_type = classify_file_type(file_path)
        total_lines = len(lines)

        if total_lines <= chunk_size:
            chunk_content = "\n".join(lines)
            content_hash = hashlib.sha256(chunk_content.encode("utf-8")).hexdigest()
            symbols = extract_symbols(lines, language)
            chunks.append(CodeChunk(
                chunk_id=f"{file_path}:1-{total_lines}",
                file_path=file_path,
                start_line=1,
                end_line=total_lines,
                content=chunk_content,
                content_hash=content_hash,
                language=language,
                file_type=file_type,
                symbols=symbols,
                is_excluded=False
            ))
        else:
            step = chunk_size - chunk_overlap
            start_idx = 0
            while start_idx < total_lines:
                end_idx = min(start_idx + chunk_size, total_lines)
                window_lines = lines[start_idx:end_idx]
                chunk_content = "\n".join(window_lines)
                content_hash = hashlib.sha256(chunk_content.encode("utf-8")).hexdigest()
                symbols = extract_symbols(window_lines, language)
                start_line = start_idx + 1
                end_line = end_idx

                chunks.append(CodeChunk(
                    chunk_id=f"{file_path}:{start_line}-{end_line}",
                    file_path=file_path,
                    start_line=start_line,
                    end_line=end_line,
                    content=chunk_content,
                    content_hash=content_hash,
                    language=language,
                    file_type=file_type,
                    symbols=symbols,
                    is_excluded=False
                ))

                if end_idx >= total_lines:
                    break
                start_idx += step

    return chunks


class BaseRetrievalProvider(ABC):
    """Abstract provider interface for Evidence RAG retrieval."""

    @abstractmethod
    def retrieve_chunks_for_requirement(
        self,
        requirement: Dict[str, Any],
        chunks: List[CodeChunk],
        top_k: int = 4
    ) -> RAGRetrievalResult:
        pass


class DeterministicLexicalRetrievalProvider(BaseRetrievalProvider):
    """
    Deterministic Lexical & Symbol RAG Retrieval Provider.
    Scores chunks based on keyword presence, symbol matching, file type alignment,
    and path relevance.
    """

    SKILL_SYNONYMS: Dict[str, List[str]] = {
        "fastapi": ["fastapi", "apirouter", "pydantic"],
        "react": ["react", "usestate", "useeffect", "jsx", "tsx"],
        "typescript": ["typescript", "interface", "type"],
        "python": ["python", "def ", "class ", "self"],
        "sql": ["sql", "select ", "insert ", "sqlalchemy", "create_engine"],
        "pytest": ["pytest", "assert "],
        "docker": ["dockerfile", "docker-compose", "container"],
        "kubernetes": ["kubernetes", "k8s", "kubectl", "minikube"],
        "git": ["git", "commit", "branch"],
    }

    def retrieve_chunks_for_requirement(
        self,
        requirement: Dict[str, Any],
        chunks: List[CodeChunk],
        top_k: int = 4
    ) -> RAGRetrievalResult:
        req_id = requirement.get("id") or requirement.get("requirement_id", "REQ-1")
        skill = requirement.get("normalized_skill", "")
        wording = requirement.get("original_wording", "")
        req_type = requirement.get("requirement_type", "technical_skill")

        clean_skill = skill.lower().strip()
        skill_tokens = [t for t in re.split(r"[\s/,&]+", clean_skill) if len(t) > 2]
        if not skill_tokens:
            skill_tokens = [clean_skill]

        # Gather core synonyms
        synonyms = set()
        for key, syns in self.SKILL_SYNONYMS.items():
            if key in clean_skill or any(t == key for t in skill_tokens):
                synonyms.update(syns)

        core_terms = set(skill_tokens) | synonyms

        # Auxiliary wording terms for boosting
        stop_words = {
            "and", "the", "for", "with", "using", "from", "experience", "ability",
            "knowledge", "understanding", "proficient", "responsible", "build",
            "develop", "design", "skills", "skill", "management", "cluster",
            "schemas", "resolvers", "data", "pipeline", "pipelines", "production",
            "background", "senior", "engineer", "software", "system", "systems",
            "programming", "project", "code", "application", "applications", "api"
        }
        aux_words = [w for w in re.findall(r"[a-zA-Z0-9_+#\.-]+", wording.lower()) if len(w) >= 3 and w not in stop_words]

        scored_chunks: List[Tuple[float, CodeChunk]] = []

        for chunk in chunks:
            if chunk.is_excluded:
                continue

            content_lower = chunk.content.lower()
            path_lower = chunk.file_path.lower()

            # Must have at least one CORE term match with word boundary in content, path, or symbols
            matched_core_terms = []
            for term in core_terms:
                pat = re.compile(r"\b" + re.escape(term) + r"\b")
                if pat.search(content_lower) or pat.search(path_lower) or any(pat.search(sym.lower()) for sym in chunk.symbols):
                    matched_core_terms.append(term)

            if not matched_core_terms:
                continue

            score = 5.0 * len(matched_core_terms)

            # Boost with auxiliary wording words if present
            for aux in aux_words:
                pat = re.compile(r"\b" + re.escape(aux) + r"\b")
                if pat.search(content_lower):
                    score += 1.0

            # Symbol match bonus
            for sym in chunk.symbols:
                for term in core_terms:
                    if term in sym.lower():
                        score += 3.0

            # File type alignment
            if req_type == "testing":
                if chunk.file_type == "test":
                    score += 5.0
                elif chunk.file_type == "documentation":
                    score *= 0.4
            else:
                if chunk.file_type == "implementation":
                    score += 4.0
                elif chunk.file_type == "test":
                    score *= 0.6
                elif chunk.file_type == "config":
                    score *= 0.7
                elif chunk.file_type == "documentation":
                    score *= 0.4

            scored_chunks.append((score, chunk))

        # Sort descending by score
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        top_scored = scored_chunks[:top_k]

        retrieved = [c for _, c in top_scored]
        max_score = top_scored[0][0] if top_scored else 0.0

        if max_score >= 8.0:
            quality = "high"
        elif max_score >= 3.0:
            quality = "moderate"
        elif max_score > 0.0:
            quality = "poor"
        else:
            quality = "none"

        return RAGRetrievalResult(
            requirement_id=req_id,
            normalized_skill=skill,
            retrieved_chunks=retrieved,
            retrieval_score=max_score,
            retrieval_quality=quality
        )


def format_bounded_rag_context(retrieval_results: List[RAGRetrievalResult]) -> str:
    """
    Format retrieved bounded chunks into security-hardened, untrusted evidence blocks
    for injection into AI provider prompts.
    """
    blocks = []
    for res in retrieval_results:
        blocks.append(f"### Requirement {res.requirement_id} ({res.normalized_skill}) [Retrieval Quality: {res.retrieval_quality}]")
        if not res.retrieved_chunks:
            blocks.append("  (No relevant repository evidence retrieved for this requirement.)")
        else:
            for c in res.retrieved_chunks:
                blocks.append(
                    f"  File: {c.file_path} (Lines {c.start_line}-{c.end_line}, Type: {c.file_type}, Language: {c.language})\n"
                    f"  Symbols: {', '.join(c.symbols) if c.symbols else 'None detected'}\n"
                    f"  Content:\n{c.content}\n"
                )
    return "\n".join(blocks)
