from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.models.knowledge import KnowledgeDocument
from app.services.auth_service import get_current_user
from app.schemas.knowledge import IngestKnowledgeRequest, KnowledgeDocumentResponse, KnowledgeSearchResponse
from app.services.knowledge_service import ingest_knowledge, search_knowledge_chunks

router = APIRouter(prefix="/knowledge", tags=["Knowledge & Local RAG"])


@router.post("/ingest", response_model=KnowledgeDocumentResponse, status_code=status.HTTP_201_CREATED, summary="Ingest learning resource or document safely")
def ingest_knowledge_document(
    req: IngestKnowledgeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingest public documentation or technical article for Local RAG.
    Enforces SSRF prevention, timeouts, content-type checks, and chunk deduplication.
    """
    return ingest_knowledge(db=db, request=req, user=current_user)


@router.get("/search", response_model=KnowledgeSearchResponse, summary="Query local RAG knowledge base")
def search_knowledge(
    q: str = Query(..., min_length=2, description="Search terms e.g. 'FastAPI testing' or 'PostgreSQL FTS'"),
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Full-Text search across indexed knowledge chunks using PostgreSQL FTS.
    Returns ranked passages for grounding recommendations and technical learning.
    """
    return search_knowledge_chunks(db=db, query=q, limit=limit)


@router.get("/documents", response_model=List[KnowledgeDocumentResponse], summary="List indexed knowledge documents")
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    docs = db.query(KnowledgeDocument).order_by(KnowledgeDocument.created_at.desc()).limit(50).all()
    return [
        KnowledgeDocumentResponse(
            id=d.id,
            title=d.title,
            source_url=d.source_url,
            source_type=d.source_type,
            content_hash=d.content_hash,
            chunks_count=d.chunks_count,
            created_at=d.created_at
        ) for d in docs
    ]
