import asyncio
from typing import Dict, List, Optional
from datetime import datetime, timezone
from backend.app.database.repositories.interfaces.incident_repository import IncidentRepository
from backend.app.schemas.incident import (
    IncidentResponse,
    IncidentCreate,
    IncidentUpdate,
    IncidentTimelineEventSchema,
    IncidentStatus,
    SeverityLevel,
)


class InMemoryIncidentRepository(IncidentRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._incidents: Dict[str, IncidentResponse] = {}
        self._seed_default_incidents()

    def _seed_default_incidents(self):
        t1 = IncidentTimelineEventSchema(
            id="evt-inc-01",
            timestamp="2026-08-20T10:15:22Z",
            title="Adversarial Bypass Detected",
            description="Autonomous Red-Team Agent executed 84 unflagged transactions across 8 synthetic accounts.",
            actor="Simulation Engine",
            type="DETECTION"
        )
        t2 = IncidentTimelineEventSchema(
            id="evt-inc-02",
            timestamp="2026-08-20T10:15:45Z",
            title="Vulnerability Logged",
            description="Weakness logged as 'Multi-Account Device Fingerprint Collusion Bypass' with ₹4.03L simulated exposure.",
            actor="Vulnerability Engine",
            type="SIMULATION"
        )
        t3 = IncidentTimelineEventSchema(
            id="evt-inc-03",
            timestamp="2026-08-20T10:16:00Z",
            title="AI Defensive Patch Generated",
            description="PatchProposal patch-991 generated proposing device velocity ceiling rule.",
            actor="AI Agent (Patch Generator)",
            type="PATCH"
        )

        inc1 = IncidentResponse(
            id="inc-2026-089",
            incident_number="INC-2026-089",
            title="Cross-Account Hardware Rate Limit Evasion",
            severity=SeverityLevel.CRITICAL,
            status=IncidentStatus.OPEN,
            affected_policy_id="pol-vel-01",
            affected_policy_name="Core Merchant Velocity & High-Value Guard",
            vulnerability_id="vuln-001",
            vulnerability_title="Multi-Account Device Fingerprint Collusion Bypass",
            simulation_id="sim-run-8921",
            simulated_exposure=403200.0,
            bypasses_count=84,
            detected_at="2026-08-20T10:15:22Z",
            owner="Harsh Shrivastava",
            summary="Red-team simulation identified critical weakness in account-scoped rate limits. An attacker cycling 8 synthetic accounts through a single hardware fingerprint bypassed all merchant velocity constraints.",
            timeline=[t1, t2, t3]
        )

        inc2 = IncidentResponse(
            id="inc-2026-088",
            incident_number="INC-2026-088",
            title="Sub-Ceiling Micro-Payment Burst",
            severity=SeverityLevel.HIGH,
            status=IncidentStatus.INVESTIGATING,
            affected_policy_id="pol-vel-01",
            affected_policy_name="Core Merchant Velocity & High-Value Guard",
            vulnerability_id="vuln-002",
            vulnerability_title="Sliding Window Boundary Skimming",
            simulation_id="sim-run-8921",
            simulated_exposure=312000.0,
            bypasses_count=52,
            detected_at="2026-08-20T10:15:10Z",
            owner="Priya Sharma",
            summary="Timed micro-bursts of ₹6,000 transactions spaced 610 seconds apart evaded 10-minute sliding window controls.",
            timeline=[]
        )

        self._incidents[inc1.id] = inc1
        self._incidents[inc2.id] = inc2

    async def list_incidents(self, status: Optional[str] = None) -> List[IncidentResponse]:
        async with self._lock:
            inc_list = list(self._incidents.values())
            if status and status != "ALL":
                inc_list = [i for i in inc_list if i.status == status]
            return inc_list

    async def get_incident_by_id(self, incident_id: str) -> Optional[IncidentResponse]:
        async with self._lock:
            return self._incidents.get(incident_id)

    async def create_incident(self, data: IncidentCreate) -> IncidentResponse:
        async with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            new_id = f"inc-2026-{len(self._incidents) + 100:03d}"
            
            init_event = IncidentTimelineEventSchema(
                id=f"evt-{new_id}-1",
                timestamp=now_iso,
                title="Incident Created",
                description=f"Incident recorded: {data.title}",
                actor=data.owner,
                type="DETECTION"
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
                timeline=[init_event]
            )
            self._incidents[new_id] = inc
            return inc

    async def update_incident(self, incident_id: str, data: IncidentUpdate) -> Optional[IncidentResponse]:
        async with self._lock:
            inc = self._incidents.get(incident_id)
            if not inc:
                return None
            
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
                        type="STATUS_CHANGE"
                    )
                )
            
            updated_inc = inc.model_copy(update={
                "status": updated_status,
                "owner": updated_owner,
                "summary": updated_summary,
                "timeline": new_timeline
            })
            self._incidents[incident_id] = updated_inc
            return updated_inc
