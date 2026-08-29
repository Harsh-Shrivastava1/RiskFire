from typing import List
from datetime import datetime, timezone
from pymongo import DESCENDING
from pymongo.database import Database
from backend.app.database.repositories.interfaces.audit_repository import AuditRepository
from backend.app.schemas.audit import AuditLogResponse, AuditLogCreate


class MongoAuditRepository(AuditRepository):
    def __init__(self, db: Database):
        self.collection = db.audit_logs

    async def list_audit_logs(self, limit: int = 100, offset: int = 0) -> List[AuditLogResponse]:
        cursor = (
            self.collection.find({}, {"_id": 0})
            .sort("timestamp", DESCENDING)
            .skip(offset)
            .limit(limit)
        )
        docs = list(cursor)
        return [AuditLogResponse.model_validate(doc) for doc in docs]

    async def create_audit_log(self, data: AuditLogCreate) -> AuditLogResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        count = self.collection.count_documents({})
        new_id = f"aud-{count + 1:03d}"

        entry = AuditLogResponse(
            id=new_id,
            timestamp=now_iso,
            action=data.action,
            actor_type=data.actor_type,
            actor_name=data.actor_name,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            entity_name=data.entity_name,
            status=data.status,
            details=data.details,
            ip_address=data.ip_address,
        )

        self.collection.insert_one(entry.model_dump())
        return entry
