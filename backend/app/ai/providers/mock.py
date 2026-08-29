from typing import Any, Type, TypeVar
from pydantic import BaseModel
from backend.app.ai.base import AIProvider
from backend.app.ai.schemas.attack_plan import AttackPlan
from backend.app.ai.schemas.explanation import VulnerabilityExplanation
from backend.app.ai.schemas.patch_proposal import PatchProposal
from backend.app.ai.schemas.report_narrative import ReportNarrative
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.patch import PolicyRuleModificationSchema

T = TypeVar("T", bound=BaseModel)


class MockAIProvider(AIProvider):
    """
    Deterministic Mock AI Provider for Phase 2.
    Produces structured, schema-compliant synthetic AI outputs offline.
    """

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "openai/gpt-oss-120b"

    async def health_check(self) -> bool:
        return True

    async def complete(
        self,
        prompt: str,
        system_prompt: str,
        response_schema: Type[T],
        temperature: float = 0.3,
        max_tokens: int = 2048,
    ) -> T:
        if response_schema == AttackPlan:
            return AttackPlan(
                attack_type=AttackAgentType.IDENTITY_FRAGMENTER,
                objective="Bypass account velocity limits by cycling 8 synthetic accounts across a single hardware device.",
                target_policy_name="Core Merchant Velocity & High-Value Guard",
                actors_count=8,
                shared_device=True,
                shared_address=True,
                shared_ip=False,
                transaction_count=120,
                duration_minutes=60,
                attack_steps=[],
                reasoning="Account-scoped rate limits can be evaded by distributing purchases across distinct accounts while maintaining shared physical hardware."
            ) # type: ignore

        elif response_schema == VulnerabilityExplanation:
            return VulnerabilityExplanation(
                summary="Account-scoped rate limits were evaded via hardware device reuse across multiple synthetic identities.",
                why_the_policy_failed="The policy evaluated rate limits exclusively per account_id, missing the shared hardware device fingerprint link DEV-9102-FP89.",
                attack_mechanism="Adversary distributed 84 purchases across 8 synthetic accounts on one hardware fingerprint.",
                key_signal_missed="Cross-account sliding-window device transaction frequency.",
                contributing_factors=[
                    "Lack of device fingerprint rate limits",
                    "Single-dimension account velocity rule",
                    "Sliding window timing gap"
                ],
                confidence="HIGH"
            ) # type: ignore

        elif response_schema == PatchProposal:
            mod = PolicyRuleModificationSchema(
                rule_type="VELOCITY_DEVICE",
                operation="ADD",
                current_rule_text="None (Device rate limit was unconstrained)",
                proposed_rule_text="BLOCK if device transaction count > 4 in 60-minute sliding window across all merchant accounts.",
                rationale="Directly closes the multi-account device collusion vector by rate limiting hardware fingerprints."
            )
            return PatchProposal(
                target_policy_id="pol-vel-01",
                identified_weakness="Cross-account device fingerprint linkage was missing from policy evaluation rules.",
                proposed_changes=[mod],
                reasoning="Adding a cross-account device rate limit of 4 txns/60m eliminates device collusion with minimal customer friction.",
                expected_benefit="Reduces simulated exposure by over 70% and boosts detection recall.",
                expected_fpr_impact="FPR expected to remain under 2.0% based on single-device buyer habits.",
                expected_customer_friction="Low",
                confidence="HIGH"
            ) # type: ignore

        elif response_schema == ReportNarrative:
            return ReportNarrative(
                executive_summary="RiskFire executed a comprehensive adversarial red-team stress test across 3,200 synthetic transactions, identifying 2 high-severity policy vulnerabilities causing ₹11.8L in simulated exposure. An AI-proposed patch demonstrated +22.8% held-out recall gain upon empirical replay.",
                risk_posture_assessment="Risk posture is currently MODERATE (74/100) due to unconstrained cross-account device velocity.",
                key_findings_summary=[
                    "Multi-account device collusion allowed 84 unflagged transactions.",
                    "Sliding-window skimming bypassed 10-minute rate limits."
                ],
                recommended_actions=[
                    "Deploy validated device velocity patch to merchant rules.",
                    "Introduce 24-hour aggregate transaction caps.",
                    "Conduct automated weekly fire drills."
                ],
                methodology_note="Evaluated inside a controlled synthetic payment sandbox with deterministic replay.",
                disclaimer="All financial exposure figures represent simulated estimates based on synthetic data."
            ) # type: ignore

        # Fallback to creating a blank instance if schema has default values
        return response_schema.model_validate({})
