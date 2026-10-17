import pytest
from unittest.mock import patch, MagicMock
from fastapi import HTTPException

from app.core.config import settings
from app.ai.gemini_provider import GeminiProvider
from app.ai.deterministic_provider import DeterministicProvider
from app.ai.factory import get_ai_provider
from app.services.job_discovery.greenhouse_adapter import GreenhouseJobAdapter, clean_html_content
from app.services.job_discovery.discovery_service import discovery_service


def test_gemini_provider_model_aliasing():
    """Verify that deprecated model strings are automatically normalized to a supported model."""
    provider = GeminiProvider(api_key="test_dummy_key", model="gemini-2.5-flash")
    assert provider.model == "gemini-3.8-flash"
    assert "gemini-3.8-flash" in provider.endpoint

    provider_current = GeminiProvider(api_key="test_dummy_key", model="gemini-3.8-flash")
    assert provider_current.model == "gemini-3.8-flash"


def test_gemini_provider_connectivity_missing_key():
    """Verify test_connectivity reports missing_credentials when key is absent."""
    provider = GeminiProvider(api_key="", model="gemini-3.8-flash")
    res = provider.test_connectivity()
    assert res["configured"] is False
    assert res["connected"] is False
    assert res["category"] == "missing_credentials"


def test_gemini_provider_connectivity_success():
    """Verify test_connectivity reports success on HTTP 200."""
    provider = GeminiProvider(api_key="valid_dummy_key_12345", model="gemini-3.8-flash")
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("httpx.Client.post", return_value=mock_resp):
        res = provider.test_connectivity()
        assert res["configured"] is True
        assert res["connected"] is True
        assert res["category"] == "success"


def test_gemini_provider_connectivity_quota_limit():
    """Verify test_connectivity reports quota_or_rate_limit on HTTP 429."""
    provider = GeminiProvider(api_key="valid_dummy_key_12345", model="gemini-3.8-flash")
    mock_resp = MagicMock()
    mock_resp.status_code = 429

    with patch("httpx.Client.post", return_value=mock_resp):
        res = provider.test_connectivity()
        assert res["configured"] is True
        assert res["connected"] is False
        assert res["category"] == "quota_or_rate_limit"


def test_gemini_provider_connectivity_model_unavailable():
    """Verify test_connectivity reports model_unavailable on HTTP 404."""
    provider = GeminiProvider(api_key="valid_dummy_key_12345", model="non-existent-model")
    mock_resp = MagicMock()
    mock_resp.status_code = 404

    with patch("httpx.Client.post", return_value=mock_resp):
        res = provider.test_connectivity()
        assert res["configured"] is True
        assert res["connected"] is False
        assert res["category"] == "model_unavailable"


def test_greenhouse_adapter_clean_html():
    """Verify HTML stripper produces clean text without tags."""
    html = "<div class='job'><p>We need a <b>Python</b> engineer.</p></div>"
    cleaned = clean_html_content(html)
    assert "Python" in cleaned
    assert "<" not in cleaned
    assert ">" not in cleaned


def test_greenhouse_adapter_health():
    """Verify Greenhouse health check returns boolean."""
    adapter = GreenhouseJobAdapter()
    assert isinstance(adapter.health_check(), bool)


def test_greenhouse_adapter_search_mocked():
    """Verify Greenhouse adapter normalizes API response into DiscoveredJob items."""
    adapter = GreenhouseJobAdapter()
    mock_payload = {
        "jobs": [
            {
                "id": 12345,
                "title": "Senior Python Backend Engineer",
                "content": "<p>Experience with FastAPI and Docker required.</p>",
                "location": {"name": "Remote, US"},
                "absolute_url": "https://boards.greenhouse.io/gitlab/jobs/12345",
                "updated_at": "2026-10-15T12:00:00Z",
                "departments": [{"name": "Engineering"}]
            },
            {
                "id": 67890,
                "title": "Marketing Manager",
                "content": "<p>Content marketing and growth strategy.</p>",
                "location": {"name": "New York, NY"},
                "absolute_url": "https://boards.greenhouse.io/gitlab/jobs/67890",
                "updated_at": "2026-10-15T12:00:00Z",
                "departments": [{"name": "Marketing"}]
            }
        ]
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = mock_payload

    with patch("httpx.Client.get", return_value=mock_resp):
        results = adapter.search(query="Python", limit=5)
        assert len(results) >= 1
        job = results[0]
        assert job.source_id == "greenhouse"
        assert job.title == "Senior Python Backend Engineer"
        assert job.company in ["GitLab", "Cloudflare", "Canonical"]
        assert job.is_remote is True
        assert "FastAPI" in job.description
        assert "12345" in job.url


def test_discovery_service_includes_greenhouse():
    """Verify Greenhouse is present in discovery_service adapter registry."""
    assert "greenhouse" in discovery_service.adapters
    sources = discovery_service.list_sources()
    source_ids = [s.source_id for s in sources]
    assert "greenhouse" in source_ids


def test_ai_connectivity_endpoint(client, auth_headers):
    """Verify /api/v1/health/ai returns structured connectivity report."""
    res = client.get("/api/v1/health/ai")
    assert res.status_code == 200
    data = res.json()
    assert "configured" in data
    assert "connected" in data
    assert "category" in data
    assert "provider" in data
