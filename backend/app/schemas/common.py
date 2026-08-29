from enum import Enum
from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class SeverityLevel(str, Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"


class PolicyStatus(str, Enum):
    ACTIVE = "ACTIVE"
    DRAFT = "DRAFT"
    SUPERSEDED = "SUPERSEDED"
    ARCHIVED = "ARCHIVED"


class SimulationStatus(str, Enum):
    PENDING = "PENDING"
    RUNNING = "RUNNING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


class RiskDecisionOutcome(str, Enum):
    BLOCKED = "BLOCKED"
    FLAGGED = "FLAGGED"
    ALLOWED = "ALLOWED"
    PARTIALLY_DETECTED = "PARTIALLY_DETECTED"


class PatchStatus(str, Enum):
    PENDING_SIMULATION = "PENDING_SIMULATION"
    SIMULATED = "SIMULATED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class IncidentStatus(str, Enum):
    OPEN = "OPEN"
    INVESTIGATING = "INVESTIGATING"
    MITIGATED = "MITIGATED"
    RESOLVED = "RESOLVED"
    DISMISSED = "DISMISSED"


class DatasetSplitType(str, Enum):
    DEVELOPMENT = "development"
    VALIDATION = "validation"
    HELD_OUT = "held_out"


class AuditActorType(str, Enum):
    USER = "USER"
    SYSTEM = "SYSTEM"
    AI_AGENT = "AI_AGENT"


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: Optional[dict] = None


class APIErrorResponse(BaseModel):
    error: ErrorDetail
