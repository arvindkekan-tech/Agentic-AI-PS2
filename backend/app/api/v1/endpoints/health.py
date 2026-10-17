from fastapi import APIRouter
from app.core.config import settings

router = APIRouter()


@router.get("/health", summary="Health check")
def health_check():
    """Verify backend API and service health."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "sqlite",
        "ai_provider": "gemini" if (settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 10) else "deterministic",
        "model": settings.GEMINI_MODEL if settings.GEMINI_API_KEY else "rule-engine-v1"
    }


@router.get("/health/ai", summary="AI Provider Connectivity Check")
def ai_connectivity_check():
    """
    Minimal backend-only connectivity check for configured AI providers.
    Makes a lightweight 1-token request and reports sanitized connection category.
    Never prints or exposes secret values.
    """
    from app.ai.factory import get_ai_provider
    from app.ai.gemini_provider import GeminiProvider

    provider = get_ai_provider()
    if isinstance(provider, GeminiProvider):
        return provider.test_connectivity()

    return {
        "configured": True,
        "connected": True,
        "category": "success",
        "detail": "Deterministic rule-based provider active.",
        "provider": "deterministic",
        "model": "rule-engine-v1"
    }
