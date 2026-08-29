from typing import List, Optional
from datetime import datetime, timezone
from pymongo.database import Database
from backend.app.database.repositories.interfaces.incident_repository import IncidentRepository
from backend.app.schemas.incident import (
    IncidentResponse,
    IncidentCreate,
    IncidentUpdate,
    IncidentTimelineEventSchema,
    IncidentStatus,
)


class MongoIncidentRepository(IncidentRepository):
    def __init__(self, db: Database):
        self.collection = db.incidents

    async def list_incidents(self, status: Optional[str] = None) -> List[IncidentResponse]:
        query = {}
        if status and status != "ALL":
            query["status"] = status
        cursor = self.collection.find(query, {"_id": 0})
        docs = list(cursor)
        return [IncidentResponse.model_validate(doc) for doc in docs]

    async def get_incident_by_id(self, incident_id: str) -> Optional[IncidentResponse]:
        doc = self.collection.find_one({"id": incident_id}, {"_id": 0})
        if not doc:
            return None
        return IncidentResponse.model_validate(doc)

    async def create_incident(self, data: IncidentCreate) -> IncidentResponse:
        now_iso = datetime.now(timezone.utc).isoformat()
        count = self.collection.count_documents({})
        new_id = f"inc-2026-{count + 100:03d}"

        init_event = IncidentTimelineEventSchema(
            id=f"evt-{new_id}-1",
            timestamp=now_iso,
            title="Incident Created",
            description=f"Incident recorded: {data.title}",
            actor=data.owner,
            type="DETECTION",
        )

        inc = IncidentResponse(
            id=new_id,
            incident_number=new_id.upper(),
            title=data.title,
            severity=data.severity,
            status=IncidentStatus.OPEN,
            affected_policy_id=data.affected_policy_id,
            affected_policy_name=data.affected_policy_name,
            vulnerability_id=data.vulnerability_id,
            vulnerability_title=data.vulnerability_title,
            simulation_id=data.simulation_id,
            simulated_exposure=data.simulated_exposure,
            bypasses_count=data.bypasses_count,
            detected_at=now_iso,
            owner=data.owner,
            summary=data.summary,
            timeline=[init_event],
        )

        self.collection.insert_one(inc.model_dump())
        return inc

    async def update_incident(self, incident_id: str, data: IncidentUpdate) -> Optional[IncidentResponse]:
        doc = self.collection.find_one({"id": incident_id}, {"_id": 0})
        if not doc:
            return None

        inc = IncidentResponse.model_validate(doc)
        updated_status = data.status if data.status is not None else inc.status
        updated_owner = data.owner if data.owner is not None else inc.owner
        updated_summary = data.summary if data.summary is not None else inc.summary

        new_timeline = list(inc.timeline)
        if data.status and data.status != inc.status:
            now_iso = datetime.now(timezone.utc).isoformat()
            new_timeline.append(
                IncidentTimelineEventSchema(
                    id=f"evt-{incident_id}-{len(new_timeline)+1}",
                    timestamp=now_iso,
                    title=f"Status Changed to {data.status.value}",
                    description=f"Incident status updated from {inc.status.value} to {data.status.value}",
                    actor=updated_owner,
                    type="STATUS_CHANGE",
                )
            )

        updated_inc = inc.model_copy(update={
            "status": updated_status,
            "owner": updated_owner,
            "summary": updated_summary,
            "timeline": new_timeline,
        })

        self.collection.update_one(
            {"id": incident_id},
            {"$set": updated_inc.model_dump()}
        )
        return updated_inc
