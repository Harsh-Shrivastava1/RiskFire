from typing import Any, Dict, Optional


class RiskFireException(Exception):
    """Base exception for all RiskFire domain errors."""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class ResourceNotFoundError(RiskFireException):
    """Raised when an entity or resource is not found."""
    def __init__(self, resource_type: str, resource_id: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{resource_type} with ID '{resource_id}' was not found.",
            code="RESOURCE_NOT_FOUND",
            details=details or {"resource_type": resource_type, "resource_id": resource_id}
        )


class PolicyValidationError(RiskFireException):
    """Raised when policy rules or thresholds are invalid."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="INVALID_POLICY", details=details)


class SimulationExecutionError(RiskFireException):
    """Raised when simulation parameters or execution fails."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="SIMULATION_EXECUTION_ERROR", details=details)


class BenchmarkIntegrityError(RiskFireException):
    """Raised when benchmark rules or held-out dataset isolation is violated."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="BENCHMARK_INTEGRITY_VIOLATION", details=details)


class DatasetIntegrityError(RiskFireException):
    """Raised when dataset files, manifests, or SHA-256 hashes are corrupted or modified."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="DATASET_INTEGRITY_VIOLATION", details=details)


class IsolationError(RiskFireException):
    """Raised when held-out data boundary is breached during training or tuning."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="HELD_OUT_ISOLATION_VIOLATION", details=details)


class InvalidAIOutputError(RiskFireException):
    """Raised when AI-generated output fails Pydantic schema or domain trust boundary validation."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="INVALID_AI_OUTPUT", details=details)


class AIProviderUnavailableError(RiskFireException):
    """Raised when the AI provider (e.g. Groq) cannot be reached or returns 5xx/429."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="AI_PROVIDER_UNAVAILABLE", details=details)


class AIProviderTimeoutError(RiskFireException):
    """Raised when an AI provider request times out."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="AI_PROVIDER_TIMEOUT", details=details)


class ConfigurationError(RiskFireException):
    """Raised when application configuration or credentials are missing or invalid."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="CONFIGURATION_ERROR", details=details)


class ConflictError(RiskFireException):
    """Raised when a resource state conflict occurs (e.g. duplicate key, immutable state)."""
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, code="RESOURCE_CONFLICT", details=details)


class RateLimitExceededError(RiskFireException):
    """Raised when an API client exceeds the request rate limit."""
    def __init__(self, retry_after: int, limit: int, window: int = 60):
        super().__init__(
            message=f"Rate limit of {limit} requests exceeded. Try again in {retry_after} seconds.",
            code="RATE_LIMIT_EXCEEDED",
            details={"retry_after_seconds": retry_after, "limit": limit, "window_seconds": window}
        )
        self.retry_after = retry_after
        self.limit = limit
        self.window = window
