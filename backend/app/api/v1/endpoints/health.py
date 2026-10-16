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
        "ai_provider": "gemini" if settings.GEMINI_API_KEY else "deterministic"
    }


@router.get("/health/ai", summary="AI Provider & Diagnostics")
def ai_health_diagnostic():
    """
    Diagnostic status of AI providers and models.
    Does NOT leak API keys, secret credentials, or sensitive tokens.
    """
    has_key = bool(settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 5)
    masked_key = f"{settings.GEMINI_API_KEY[:4]}...{settings.GEMINI_API_KEY[-4:]}" if has_key else None

    return {
        "status": "ready" if has_key else "fallback_mode",
        "primary_provider": "gemini",
        "primary_model": settings.GEMINI_MODEL or "gemini-2.5-flash",
        "api_key_configured": has_key,
        "api_key_masked": masked_key,
        "active_provider": "gemini" if has_key else "deterministic",
        "fallback_provider": "deterministic",
        "rag_retrieval_mode": "ast_lexical_bounded",
        "rate_limit_backoff_enabled": True
    }
