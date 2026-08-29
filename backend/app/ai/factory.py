from typing import Optional
from backend.app.ai.base import AIProvider
from backend.app.ai.providers.mock import MockAIProvider
from backend.app.ai.providers.groq import GroqProvider
from backend.app.core.config import settings
from backend.app.core.exceptions import ConfigurationError
from backend.app.core.logging import logger

_provider_instance: Optional[AIProvider] = None


def get_ai_provider(force_reload: bool = False) -> AIProvider:
    """
    Factory function resolving the active AIProvider.
    Enforces strict explicit provider selection:
      - AI_PROVIDER=groq -> GroqProvider (requires GROQ_API_KEY; fails fast if missing)
      - AI_PROVIDER=mock -> MockAIProvider (test/development offline mode)
    
    NO SILENT FALLBACK: If groq is selected and credentials/service fail,
    the application fails clearly rather than silently substituting fake data.
    """
    global _provider_instance
    if _provider_instance is None or force_reload:
        provider_name = settings.AI_PROVIDER.lower().strip()
        logger.info(f"[AIFactory] Resolving AI provider: '{provider_name}'...")

        if provider_name == "groq":
            if not settings.GROQ_API_KEY:
                raise ConfigurationError(
                    "GROQ_API_KEY is not configured in backend/.env. "
                    "Phase 4 requires a valid Groq API key when AI_PROVIDER=groq. "
                    "Silent fallback to mock is strictly prohibited."
                )
            _provider_instance = GroqProvider()
            logger.info(f"[AIFactory] Initialized GroqProvider (model: '{_provider_instance.model_name}')")

        elif provider_name == "mock":
            _provider_instance = MockAIProvider()
            logger.info("[AIFactory] Initialized MockAIProvider (offline test/dev mode)")

        else:
            raise ConfigurationError(
                f"Unsupported AI_PROVIDER '{settings.AI_PROVIDER}'. "
                f"Supported options are 'groq' or 'mock'."
            )

    return _provider_instance
