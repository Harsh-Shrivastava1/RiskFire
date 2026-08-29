from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.audit import AuditLogResponse, AuditLogCreate


class AuditRepository(ABC):
    @abstractmethod
    async def list_audit_logs(self, limit: int = 100, offset: int = 0) -> List[AuditLogResponse]:
        pass

    @abstractmethod
    async def create_audit_log(self, data: AuditLogCreate) -> AuditLogResponse:
        pass
