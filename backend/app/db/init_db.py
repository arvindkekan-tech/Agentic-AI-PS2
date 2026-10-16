import hashlib
import json
from sqlalchemy import text
from app.db.session import engine, Base, SessionLocal
import app.models  # noqa: F401
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk

CURATED_KNOWLEDGE_DOCS = [
    {
        "title": "FastAPI & Python Backend Architecture Best Practices",
        "source_url": "https://fastapi.tiangolo.com/tutorial/bigger-applications/",
        "source_type": "system_curated",
        "text": """FastAPI Enterprise Architecture:
1. Routing and Endpoints: Structure APIs into modular APIRouters under /api/v1/endpoints. Each domain should have dedicated request and response Pydantic schemas.
2. Dependency Injection: Use FastAPI's Depends() for database sessions, authentication, and authorization.
3. Database Operations: Use SQLAlchemy 2.0 with SessionLocal, pool_pre_ping enabled, and strict transaction management.
4. Testing: Utilize pytest with httpx.AsyncClient or TestClient, isolating test databases.
5. Error Handling: Return structured HTTPException with meaningful detail messages and proper HTTP status codes (400, 401, 403, 404, 422, 500)."""
    },
    {
        "title": "Modern PostgreSQL and Supabase Database Design",
        "source_url": "https://supabase.com/docs/guides/database/overview",
        "source_type": "system_curated",
        "text": """PostgreSQL Production Guidelines:
1. Schema & Keys: Every table should have a UUID primary key, explicit foreign key constraints with ondelete actions (CASCADE or SET NULL), and indexes on foreign keys.
2. Full-Text Search: PostgreSQL provides native full-text search using tsvector, tsquery, and GIN indexes for fast text retrieval.
3. Row-Level Security: When using Supabase, enable RLS on sensitive tables and define policies based on auth.uid().
4. Migrations: Never manually alter production schemas without version-controlled migrations (Alembic)."""
    },
    {
        "title": "Automated Testing and Code Evidence Verification",
        "source_url": "https://docs.pytest.org/en/stable/explanation/goodpractices.html",
        "source_type": "system_curated",
        "text": """Software Evidence and Verification Engineering:
1. Deterministic Verification: Claims made in documentation or resumes must be backed by concrete code artifacts, line numbers, and passing test suites.
2. Unit and Integration Tests: High test coverage with pytest, mock external APIs (e.g., GitHub, Gemini AI), and verify deterministic scoring rules.
3. Git Hygiene: Meaningful commit messages, branch naming conventions (e.g. feat/, fix/), and pinned commit SHAs for auditable evidence."""
    },
    {
        "title": "React 19 & TypeScript Frontend Engineering",
        "source_url": "https://react.dev/learn",
        "source_type": "system_curated",
        "text": """Modern React Frontend Standards:
1. Component Architecture: Modular, typed components using TypeScript interfaces for props and API responses.
2. State & Data Fetching: Use controlled states, handle loading/error/empty states explicitly without synthetic delays.
3. Design Systems: Tailwind CSS with consistent color tokens, frosted glassmorphic cards, clear visual hierarchy, and full accessibility (ARIA, keyboard navigation, reduced motion).
4. Error Boundaries & Fallbacks: Gracefully handle network timeouts and API errors with retry mechanisms."""
    }
]


def seed_curated_knowledge(db) -> None:
    """Seed foundational knowledge documents for Local RAG if not already present."""
    try:
        for doc in CURATED_KNOWLEDGE_DOCS:
            content_hash = hashlib.sha256(doc["text"].encode("utf-8")).hexdigest()
            existing = db.query(KnowledgeDocument).filter(KnowledgeDocument.content_hash == content_hash).first()
            if existing:
                continue

            lines = [line.strip() for line in doc["text"].split("\n") if line.strip()]
            chunks = []
            current_chunk = []
            current_len = 0
            for line in lines:
                current_chunk.append(line)
                current_len += len(line)
                if current_len >= 300:
                    chunks.append("\n".join(current_chunk))
                    current_chunk = []
                    current_len = 0
            if current_chunk:
                chunks.append("\n".join(current_chunk))

            kdoc = KnowledgeDocument(
                title=doc["title"],
                source_url=doc["source_url"],
                source_type=doc["source_type"],
                content_hash=content_hash,
                raw_text=doc["text"],
                chunks_count=len(chunks)
            )
            db.add(kdoc)
            db.flush()

            for idx, ctext in enumerate(chunks):
                chunk = KnowledgeChunk(
                    document_id=kdoc.id,
                    chunk_index=idx,
                    chunk_text=ctext,
                    metadata_json=json.dumps({"title": doc["title"], "source_url": doc["source_url"]})
                )
                db.add(chunk)

        db.commit()
    except Exception:
        db.rollback()


def init_db() -> None:
    """Create all tables in the database if they do not exist and seed initial knowledge."""
    Base.metadata.create_all(bind=engine)
    
    with SessionLocal() as db:
        seed_curated_knowledge(db)
