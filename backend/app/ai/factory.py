from app.core.config import settings
from app.ai.base import BaseAIProvider
from app.ai.gemini_provider import GeminiProvider
from app.ai.deterministic_provider import DeterministicProvider


def get_ai_provider(force_deterministic: bool = False) -> BaseAIProvider:
    """
    Factory to return configured AI assessment provider.
    Defaults to Gemini if GEMINI_API_KEY is configured and force_deterministic is False,
    otherwise uses DeterministicProvider.
    """
    if not force_deterministic and settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY.strip()) > 10:
        return GeminiProvider(api_key=settings.GEMINI_API_KEY, model=settings.GEMINI_MODEL)
    return DeterministicProvider()
