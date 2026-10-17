import pytest
from app.services.job_service import validate_url_for_ssrf
from app.services.knowledge_service import (
    chunk_text,
    ingest_knowledge,
    search_knowledge_chunks
)
from app.schemas.knowledge import IngestKnowledgeRequest


def test_ssrf_blocking_loopback_and_private_ips():
    """Verify SSRF firewall blocks loopback, link-local, and RFC1918 subnets."""
    forbidden_urls = [
        "http://127.0.0.1:8000/internal",
        "http://localhost:5432",
        "http://10.0.0.1/admin",
        "http://192.168.1.1/router",
        "http://172.16.0.1/secrets",
        "http://169.254.169.254/latest/meta-data/",
        "file:///etc/passwd",
        "ftp://private.corp/data"
    ]
    for url in forbidden_urls:
        with pytest.raises(Exception) as excinfo:
            validate_url_for_ssrf(url)
        assert hasattr(excinfo.value, "status_code") and excinfo.value.status_code == 400


def test_chunking_with_overlap():
    """Test text chunking splits text sensibly into structured chunks."""
    sample_text = (
        "PostgreSQL connection pooling is essential for high-concurrency microservices.\n"
        "Using connection pool pre-ping avoids stale connection drops across idle intervals.\n"
        "Alembic migrations provide deterministic schema versioning for relational databases.\n"
        "Each migration script records revision and down_revision hashes.\n"
        "FastAPI integrates seamlessly with SQLAlchemy async and sync engines.\n"
        "Dependency injection simplifies session lifecycle and transaction boundaries."
    )
    chunks = chunk_text(sample_text, chunk_size=120, overlap=30)
    assert len(chunks) >= 2
    assert len(chunks[0]) > 0


def test_ingest_text_and_deduplication(db_session, test_user):
    """Test text document ingestion, SHA-256 deduplication, and chunk persistence."""
    title = "PostgreSQL Concurrency & Indexing Guide"
    content = (
        "PostgreSQL handles high write workloads using MVCC (Multi-Version Concurrency Control).\n"
        "B-tree indexes speed up equality and range queries, while GIN indexes power full-text search.\n"
        "Vacuuming removes dead tuples created during updates and deletes."
    )
    req = IngestKnowledgeRequest(
        source_type="pasted",
        title=title,
        text=content
    )

    # First ingestion
    doc1 = ingest_knowledge(db_session, req, test_user)
    assert doc1.id is not None
    assert doc1.content_hash is not None
    assert doc1.chunks_count >= 1

    # Ingest identical content -> should deduplicate and return same document
    doc2 = ingest_knowledge(db_session, req, test_user)
    assert doc2.id == doc1.id
    assert doc2.content_hash == doc1.content_hash


def test_search_knowledge_retrieval(db_session, test_user):
    """Test full-text retrieval returns matching passages and handles empty queries gracefully."""
    req = IngestKnowledgeRequest(
        source_type="pasted",
        title="FastAPI & Async Architecture",
        text="FastAPI builds upon Starlette and Pydantic for high throughput asynchronous Python APIs. Dependency injection provides clean scoped database sessions."
    )
    ingest_knowledge(db_session, req, test_user)

    # Search for relevant keyword
    results = search_knowledge_chunks(db_session, query="FastAPI Starlette", limit=5)
    assert results.total_results >= 1
    assert len(results.results) >= 1
    assert "FastAPI" in results.results[0].chunk_text
    assert results.results[0].relevance_score > 0

    # Search for query with no matches
    empty_res = search_knowledge_chunks(db_session, query="quantum bioinformatics xyz999", limit=5)
    assert empty_res.total_results == 0
    assert len(empty_res.results) == 0


def test_knowledge_api_endpoints(db_session, client, auth_headers):
    """Test knowledge ingestion and search REST endpoints."""
    # 1. Ingest via API
    ingest_payload = {
        "source_type": "pasted",
        "title": "Docker Container Best Practices",
        "text": "Multi-stage Docker builds reduce container image footprint and eliminate unnecessary compiler toolchains from production images."
    }
    res_ingest = client.post("/api/v1/knowledge/ingest", json=ingest_payload, headers=auth_headers)
    assert res_ingest.status_code == 201
    doc_data = res_ingest.json()
    assert doc_data["title"] == "Docker Container Best Practices"
    assert doc_data["chunks_count"] >= 1

    # 2. Search via API with 'q='
    res_search = client.get("/api/v1/knowledge/search?q=Docker", headers=auth_headers)
    assert res_search.status_code == 200
    search_data = res_search.json()
    assert search_data["total_results"] >= 1
    assert len(search_data["results"]) >= 1
    assert "Docker" in search_data["results"][0]["chunk_text"]

    # 3. List documents
    res_list = client.get("/api/v1/knowledge/documents", headers=auth_headers)
    assert res_list.status_code == 200
    assert len(res_list.json()) >= 1
