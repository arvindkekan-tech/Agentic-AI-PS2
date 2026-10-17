import hashlib
import json
import re
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional, Tuple
import httpx
from bs4 import BeautifulSoup
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.core.config import settings
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk
from app.models.user import User
from app.schemas.knowledge import IngestKnowledgeRequest, KnowledgeDocumentResponse, KnowledgeSearchResponse, KnowledgeChunkItem
from app.services.job_service import validate_url_for_ssrf


def clean_html_content(raw_html: str) -> Tuple[str, str]:
    """Clean HTML and extract title and plain text."""
    soup = BeautifulSoup(raw_html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "noscript", "header"]):
        tag.decompose()

    title = "Learning Resource"
    if soup.title and soup.title.string:
        title = soup.title.string.strip()
    elif soup.find("h1"):
        title = soup.find("h1").get_text(strip=True)

    lines = (line.strip() for line in soup.get_text().splitlines())
    chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
    cleaned_text = "\n".join(chunk for chunk in chunks if chunk)
    return cleaned_text, title


def fetch_url_safely(url: str) -> Tuple[str, str]:
    """Safely fetch URL content enforcing SSRF protections and size limits."""
    current_url = url
    max_redirects = 3
    redirect_count = 0

    with httpx.Client(
        timeout=settings.SSRF_TIMEOUT_SECONDS,
        headers={"User-Agent": "ProofPath-KnowledgeIngester/1.0 (+https://proofpath.dev)"},
        follow_redirects=False
    ) as client:
        while redirect_count <= max_redirects:
            validate_url_for_ssrf(current_url)
            try:
                resp = client.get(current_url)
            except httpx.TimeoutException:
                raise HTTPException(
                    status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                    detail=f"Timed out fetching URL within {settings.SSRF_TIMEOUT_SECONDS}s limit."
                )
            except Exception as e:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Network error while connecting to source URL: {str(e)}"
                )

            if resp.is_redirect or resp.status_code in (301, 302, 303, 307, 308):
                location = resp.headers.get("location")
                if not location:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Redirect missing location header."
                    )
                current_url = httpx.URL(current_url).join(location).__str__()
                redirect_count += 1
                continue

            if resp.status_code != 200:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Source server returned HTTP status {resp.status_code}."
                )

            content = resp.content
            if len(content) > settings.SSRF_MAX_RESPONSE_BYTES:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"Response exceeded maximum allowed size of {settings.SSRF_MAX_RESPONSE_BYTES} bytes."
                )

            content_type = resp.headers.get("content-type", "").lower()
            if "html" in content_type:
                return clean_html_content(resp.text)
            else:
                return resp.text.strip(), "Learning Document"

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Exceeded maximum allowed redirects."
        )


def chunk_text(text_content: str, chunk_size: int = 500, overlap: int = 80) -> List[str]:
    """Split text into overlapping chunks respecting line or sentence boundaries."""
    if not text_content:
        return []

    lines = [l.strip() for l in text_content.splitlines() if l.strip()]
    if not lines:
        return []

    chunks: List[str] = []
    current_chunk: List[str] = []
    current_length = 0

    for line in lines:
        current_chunk.append(line)
        current_length += len(line)
        if current_length >= chunk_size:
            chunk_str = "\n".join(current_chunk)
            chunks.append(chunk_str)
            # Retain overlap lines if possible
            if len(current_chunk) > 1:
                current_chunk = current_chunk[-1:]
                current_length = len(current_chunk[0])
            else:
                current_chunk = []
                current_length = 0

    if current_chunk:
        chunks.append("\n".join(current_chunk))

    return chunks


def ingest_knowledge(
    db: Session,
    request: IngestKnowledgeRequest,
    user: Optional[User] = None
) -> KnowledgeDocumentResponse:
    """Ingest document from URL or text, deduplicate via SHA-256, chunk and store."""
    if request.source_type == "url":
        if not request.url:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="URL is required for 'url' source type.")
        text_content, extracted_title = fetch_url_safely(request.url)
        title = request.title or extracted_title
        source_url = request.url
    elif request.source_type == "pasted":
        if not request.text or len(request.text.strip()) < 20:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Text must be at least 20 characters.")
        text_content = request.text.strip()
        title = request.title or "Pasted Knowledge Reference"
        source_url = None
    else:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid source_type. Use 'url' or 'pasted'.")

    # Content hash for duplicate detection
    content_hash = hashlib.sha256(text_content.encode("utf-8")).hexdigest()
    existing = db.query(KnowledgeDocument).filter(KnowledgeDocument.content_hash == content_hash).first()
    if existing:
        return KnowledgeDocumentResponse(
            id=existing.id,
            title=existing.title,
            source_url=existing.source_url,
            source_type=existing.source_type,
            content_hash=existing.content_hash,
            chunks_count=existing.chunks_count,
            created_at=existing.created_at
        )

    chunks = chunk_text(text_content)
    kdoc = KnowledgeDocument(
        user_id=user.id if user else None,
        title=title,
        source_url=source_url,
        source_type=request.source_type,
        content_hash=content_hash,
        raw_text=text_content,
        chunks_count=len(chunks)
    )
    db.add(kdoc)
    db.flush()

    for idx, ctext in enumerate(chunks):
        chunk = KnowledgeChunk(
            document_id=kdoc.id,
            chunk_index=idx,
            chunk_text=ctext,
            metadata_json=json.dumps({"title": title, "source_url": source_url})
        )
        db.add(chunk)

    db.commit()
    db.refresh(kdoc)

    return KnowledgeDocumentResponse(
        id=kdoc.id,
        title=kdoc.title,
        source_url=kdoc.source_url,
        source_type=kdoc.source_type,
        content_hash=kdoc.content_hash,
        chunks_count=kdoc.chunks_count,
        created_at=kdoc.created_at
    )


def search_knowledge_chunks(
    db: Session,
    query: str,
    limit: int = 5
) -> KnowledgeSearchResponse:
    """
    Search indexed knowledge chunks using PostgreSQL Full-Text Search (or SQLite keyword ranking fallback).
    """
    clean_query = query.strip()
    if not clean_query:
        return KnowledgeSearchResponse(query=query, total_results=0, results=[])

    bind = db.get_bind()
    dialect = bind.dialect.name

    results: List[KnowledgeChunkItem] = []

    if dialect == "postgresql":
        # Native PostgreSQL Full-Text Search with ts_rank
        sql = text("""
            SELECT c.id, c.document_id, c.chunk_index, c.chunk_text, c.metadata_json,
                   ts_rank(to_tsvector('english', c.chunk_text), plainto_tsquery('english', :q)) AS rank
            FROM knowledge_chunks c
            WHERE to_tsvector('english', c.chunk_text) @@ plainto_tsquery('english', :q)
            ORDER BY rank DESC
            LIMIT :lim
        """)
        try:
            rows = db.execute(sql, {"q": clean_query, "lim": limit}).fetchall()
            for r in rows:
                meta = {}
                try:
                    meta = json.loads(r[4])
                except Exception:
                    pass
                results.append(
                    KnowledgeChunkItem(
                        id=str(r[0]),
                        document_id=str(r[1]),
                        chunk_index=int(r[2]),
                        chunk_text=str(r[3]),
                        metadata=meta,
                        relevance_score=round(float(r[5]), 3)
                    )
                )
        except Exception:
            # Fallback if PostgreSQL tsquery parsing encounters unusual punctuation
            pass

    # If PostgreSQL returned results, return them
    if results:
        return KnowledgeSearchResponse(query=query, total_results=len(results), results=results)

    # Dialect-agnostic ranked keyword search (used for SQLite test environments or fallback)
    tokens = [t.lower() for t in re.findall(r"\w+", clean_query) if len(t) > 2]
    if not tokens:
        tokens = [clean_query.lower()]

    all_chunks = db.query(KnowledgeChunk).all()
    scored = []
    for c in all_chunks:
        text_lower = c.chunk_text.lower()
        score = sum(text_lower.count(tok) for tok in tokens)
        if score > 0:
            scored.append((score, c))

    scored.sort(key=lambda x: x[0], reverse=True)

    for score, c in scored[:limit]:
        meta = {}
        try:
            meta = json.loads(c.metadata_json)
        except Exception:
            pass
        results.append(
            KnowledgeChunkItem(
                id=c.id,
                document_id=c.document_id,
                chunk_index=c.chunk_index,
                chunk_text=c.chunk_text,
                metadata=meta,
                relevance_score=round(float(score), 2)
            )
        )

    return KnowledgeSearchResponse(query=query, total_results=len(results), results=results)
