import asyncio
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.patch_repository import PatchRepository
from backend.app.schemas.patch import (
    PatchResponse,
    PatchStatus,
    PolicyRuleModificationSchema,
    BeforeAfterMetricsSchema,
    MetricDelta,
    SeverityLevel,
)


class InMemoryPatchRepository(PatchRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._patches: Dict[str, PatchResponse] = {}
        self._seed_default_patches()

    def _seed_default_patches(self):
        rule_mod = PolicyRuleModificationSchema(
            rule_type="VELOCITY_DEVICE",
            operation="ADD",
            current_rule_text="None (Device velocity was unbounded)",
            proposed_rule_text="BLOCK if device transaction count > 4 in 60-minute sliding window across all merchant accounts.",
            rationale="Eliminates multi-account device collusion by binding rate limits directly to hardware device fingerprints."
        )

        metrics = BeforeAfterMetricsSchema(
            precision=MetricDelta(before=82.5, after=95.8, delta=13.3),
            recall=MetricDelta(before=71.4, after=94.2, delta=22.8),
            f1=MetricDelta(before=76.5, after=95.0, delta=18.5),
            false_positive_rate=MetricDelta(before=5.4, after=1.8, delta=-3.6),
            attack_success_rate=MetricDelta(before=28.6, after=5.8, delta=-22.8),
            bypasses_count=MetricDelta(before=184.0, after=28.0, delta=-156.0),
            simulated_exposure=MetricDelta(before=1180000.0, after=340000.0, delta=-840000.0),
            customer_friction_impact="LOW (-3.6% false positive rate reduction)"
        )

        patch1 = PatchResponse(
            id="patch-991",
            vulnerability_id="vuln-001",
            vulnerability_title="Multi-Account Device Fingerprint Collusion Bypass",
            vulnerability_severity=SeverityLevel.CRITICAL,
            source_policy_id="pol-vel-01",
            source_policy_name="Core Merchant Velocity & High-Value Guard",
            source_policy_version="v1.0.0",
            target_policy_version="v1.1.0",
            status=PatchStatus.SIMULATED,
            identified_weakness="Cross-account device fingerprint linkage was missing from policy evaluation rules.",
            proposed_changes=[rule_mod],
            ai_reasoning="Synthesized defensive rule adding a 4-txn/60m device constraint. Deterministic simulation replay confirms +22.8% detection recall improvement and 71.2% simulated exposure reduction with zero legitimate customer disruption.",
            expected_risk_reduction="71.2% reduction in simulated financial exposure (₹8.4L saved).",
            expected_fpr_impact="FPR reduced from 5.4% to 1.8%.",
            expected_customer_friction="Negligible impact on legitimate one-device buyers.",
            validation_status="VALIDATED",
            confidence="HIGH",
            metrics_comparison=metrics,
            created_at="2026-08-20T10:16:00Z"
        )
        self._patches[patch1.id] = patch1

    async def list_patches(self, status: Optional[PatchStatus] = None) -> List[PatchResponse]:
        async with self._lock:
            p_list = list(self._patches.values())
            if status:
                p_list = [p for p in p_list if p.status == status]
            return p_list

    async def get_patch_by_id(self, patch_id: str) -> Optional[PatchResponse]:
        async with self._lock:
            return self._patches.get(patch_id)

    async def save_patch(self, patch: PatchResponse) -> PatchResponse:
        async with self._lock:
            self._patches[patch.id] = patch
            return patch

    async def update_patch(self, patch_id: str, patch: PatchResponse) -> Optional[PatchResponse]:
        async with self._lock:
            if patch_id in self._patches:
                self._patches[patch_id] = patch
                return patch
            return None
