import asyncio
from typing import List
from datetime import datetime, timezone
from backend.app.database.repositories.interfaces.audit_repository import AuditRepository
from backend.app.schemas.audit import AuditLogResponse, AuditLogCreate
from backend.app.schemas.common import AuditActorType


class InMemoryAuditRepository(AuditRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._logs: List[AuditLogResponse] = []
        self._seed_default_audit_logs()

    def _seed_default_audit_logs(self):
        entries = [
            AuditLogResponse(
                id="aud-001",
                timestamp="2026-08-20T10:15:00Z",
                action="SIMULATION_EXECUTION_TRIGGERED",
                actor_type=AuditActorType.USER,
                actor_name="Arjun Mehta",
                entity_type="SimulationRun",
                entity_id="sim-run-8921",
                entity_name="Fire Drill: Velocity & Hardware Stress Test",
                status="SUCCESS",
                details={"seed": 49201, "txns": 3200, "policy": "pol-vel-01"},
                ip_address="192.168.1.45"
            ),
            AuditLogResponse(
                id="aud-002",
                timestamp="2026-08-20T10:15:45Z",
                action="VULNERABILITY_DISCOVERED",
                actor_type=AuditActorType.SYSTEM,
                actor_name="VulnerabilityEngine",
                entity_type="Vulnerability",
                entity_id="vuln-001",
                entity_name="Multi-Account Device Fingerprint Collusion Bypass",
                status="WARNING",
                details={"bypass_count": 84, "exposure": 403200.0, "severity": "CRITICAL"},
                ip_address="127.0.0.1"
            ),
            AuditLogResponse(
                id="aud-003",
                timestamp="2026-08-20T10:16:00Z",
                action="AI_DEFENSIVE_PATCH_PROPOSED",
                actor_type=AuditActorType.AI_AGENT,
                actor_name="MockAIProvider (openai/gpt-oss-120b)",
                entity_type="PolicyPatch",
                entity_id="patch-991",
                entity_name="Device Rate Limiter (4 txns/60m)",
                status="SUCCESS",
                details={"target_policy": "pol-vel-01", "rule_type": "VELOCITY_DEVICE"},
                ip_address="127.0.0.1"
            ),
            AuditLogResponse(
                id="aud-004",
                timestamp="2026-08-20T10:16:30Z",
                action="HELD_OUT_BENCHMARK_EVALUATED",
                actor_type=AuditActorType.SYSTEM,
                actor_name="BenchmarkEngine",
                entity_type="BenchmarkRun",
                entity_id="bm-run-002",
                entity_name="15% Sealed Held-Out Test Evaluation",
                status="SUCCESS",
                details={"split": "held_out", "delta_recall": 23.3, "delta_exposure": -134400.0},
                ip_address="127.0.0.1"
            ),
        ]
        self._logs.extend(entries)

    async def list_audit_logs(self, limit: int = 100, offset: int = 0) -> List[AuditLogResponse]:
        async with self._lock:
            sorted_logs = sorted(self._logs, key=lambda l: l.timestamp, reverse=True)
            return sorted_logs[offset : offset + limit]

    async def create_audit_log(self, data: AuditLogCreate) -> AuditLogResponse:
        async with self._lock:
            now_iso = datetime.now(timezone.utc).isoformat()
            new_id = f"aud-{len(self._logs) + 1:03d}"
            
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
                ip_address=data.ip_address
            )
            self._logs.append(entry)
            return entry
