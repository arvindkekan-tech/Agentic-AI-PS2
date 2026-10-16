from app.core.config import settings


def test_health_check(client):
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == settings.PROJECT_NAME
    assert data["database"] == "sqlite"


def test_ai_health_diagnostic(client):
    res = client.get("/api/v1/health/ai")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ("ready", "fallback_mode")
    assert data["primary_provider"] == "gemini"
    assert "api_key_configured" in data
    assert data["fallback_provider"] == "deterministic"
    assert data["rag_retrieval_mode"] == "ast_lexical_bounded"
    assert data["rate_limit_backoff_enabled"] is True

    # Critical security check: Never leak full raw API key in diagnostic response
    if settings.GEMINI_API_KEY:
        assert settings.GEMINI_API_KEY not in str(data)
