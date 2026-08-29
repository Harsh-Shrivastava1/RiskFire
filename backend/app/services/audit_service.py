from typing import Any, Dict, List, Optional
from backend.app.database.repositories.interfaces.audit_repository import AuditRepository
from backend.app.schemas.audit import AuditLogResponse, AuditLogCreate
from backend.app.schemas.common import AuditActorType


class AuditService:
    def __init__(self, audit_repo: AuditRepository):
        self.audit_repo = audit_repo

    async def list_audit_logs(self, limit: int = 100, offset: int = 0) -> List[AuditLogResponse]:
        return await self.audit_repo.list_audit_logs(limit=limit, offset=offset)

    async def record_event(
        self,
        action: str,
        entity_type: str,
        entity_id: str,
        entity_name: str,
        actor_name: str = "SYSTEM",
        actor_type: AuditActorType = AuditActorType.SYSTEM,
        status: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = "127.0.0.1"
    ) -> AuditLogResponse:
        create_data = AuditLogCreate(
            action=action,
            actor_type=actor_type,
            actor_name=actor_name,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            status=status,
            details=details or {},
            ip_address=ip_address
        )
        return await self.audit_repo.create_audit_log(create_data)
