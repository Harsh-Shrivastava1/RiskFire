from typing import List, Optional
from backend.app.database.repositories.interfaces.incident_repository import IncidentRepository
from backend.app.services.audit_service import AuditService
from backend.app.schemas.incident import IncidentResponse, IncidentCreate, IncidentUpdate
from backend.app.schemas.common import AuditActorType
from backend.app.core.exceptions import ResourceNotFoundError


class IncidentService:
    def __init__(self, incident_repo: IncidentRepository, audit_service: AuditService):
        self.incident_repo = incident_repo
        self.audit_service = audit_service

    async def list_incidents(self, status: Optional[str] = None) -> List[IncidentResponse]:
        return await self.incident_repo.list_incidents(status=status)

    async def get_incident(self, incident_id: str) -> IncidentResponse:
        inc = await self.incident_repo.get_incident_by_id(incident_id)
        if not inc:
            raise ResourceNotFoundError("Incident", incident_id)
        return inc

    async def create_incident(self, data: IncidentCreate, actor_name: str = "Arjun Mehta") -> IncidentResponse:
        inc = await self.incident_repo.create_incident(data)
        await self.audit_service.record_event(
            action="INCIDENT_RECORDED",
            entity_type="Incident",
            entity_id=inc.id,
            entity_name=inc.title,
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={"severity": inc.severity.value, "policy": inc.affected_policy_name}
        )
        return inc

    async def update_incident(self, incident_id: str, data: IncidentUpdate, actor_name: str = "Arjun Mehta") -> IncidentResponse:
        inc = await self.incident_repo.update_incident(incident_id, data)
        if not inc:
            raise ResourceNotFoundError("Incident", incident_id)
        
        await self.audit_service.record_event(
            action="INCIDENT_UPDATED",
            entity_type="Incident",
            entity_id=inc.id,
            entity_name=inc.title,
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={"status": inc.status.value, "owner": inc.owner}
        )
        return inc
