from typing import Any, Dict, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import AuditActorType


class AuditLogCreate(BaseModel):
    action: str
    actor_type: AuditActorType
    actor_name: str
    entity_type: str
    entity_id: str
    entity_name: str
    status: str = "SUCCESS"
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = "127.0.0.1"


class AuditLogResponse(BaseModel):
    id: str
    timestamp: str
    action: str
    actor_type: AuditActorType
    actor_name: str
    entity_type: str
    entity_id: str
    entity_name: str
    status: str
    details: Dict[str, Any] = Field(default_factory=dict)
    ip_address: Optional[str] = None
