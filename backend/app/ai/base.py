from abc import ABC, abstractmethod
from typing import Any, Type, TypeVar
from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)


class AIProvider(ABC):
    """
    Abstract AI Provider Interface.
    Business services interact strictly through this abstraction.
    """

    @abstractmethod
    async def complete(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: Type[T],
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> T:
        """
        Generates structured completion validated against response_schema.
        """
        pass

    @abstractmethod
    async def health_check(self) -> bool:
        """Returns True if provider is operational."""
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        pass
