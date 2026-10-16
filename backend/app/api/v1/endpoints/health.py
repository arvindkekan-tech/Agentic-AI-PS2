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
