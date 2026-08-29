from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import IncidentStatus, SeverityLevel


class IncidentTimelineEventSchema(BaseModel):
    id: str
    timestamp: str
    title: str
    description: str
    actor: str
    type: str  # "DETECTION" | "SIMULATION" | "INVESTIGATION" | "PATCH" | "STATUS_CHANGE"


class IncidentCreate(BaseModel):
    title: str
    severity: SeverityLevel
    affected_policy_id: str
    affected_policy_name: str
    summary: str
    owner: str = "Harsh Shrivastava"
    vulnerability_id: Optional[str] = None
    vulnerability_title: Optional[str] = None
    simulation_id: Optional[str] = None
    simulated_exposure: float = 0.0
    bypasses_count: int = 0


class IncidentUpdate(BaseModel):
    status: Optional[IncidentStatus] = None
    owner: Optional[str] = None
    summary: Optional[str] = None


class IncidentResponse(BaseModel):
    id: str
    incident_number: str
    title: str
    severity: SeverityLevel
    status: IncidentStatus
    affected_policy_id: str
    affected_policy_name: str
    vulnerability_id: Optional[str] = None
    vulnerability_title: Optional[str] = None
    simulation_id: Optional[str] = None
    simulated_exposure: float
    bypasses_count: int
    detected_at: str
    owner: str
    summary: str
    timeline: List[IncidentTimelineEventSchema] = Field(default_factory=list)
