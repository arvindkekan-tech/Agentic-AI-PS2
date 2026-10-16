from typing import List, Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field


class IngestKnowledgeRequest(BaseModel):
    source_type: str = Field(..., description="'url' or 'pasted'")
    url: Optional[str] = None
    title: Optional[str] = None
    text: Optional[str] = None


class KnowledgeChunkItem(BaseModel):
    id: str
    document_id: str
    chunk_index: int
    chunk_text: str
    metadata: Dict[str, Any] = {}
    relevance_score: Optional[float] = None


class KnowledgeDocumentResponse(BaseModel):
    id: str
    title: str
    source_url: Optional[str] = None
    source_type: str
    content_hash: str
    chunks_count: int
    created_at: datetime


class KnowledgeSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[KnowledgeChunkItem]
