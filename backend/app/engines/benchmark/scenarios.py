from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.attack import AttackAgentType


class BenchmarkScenarioDefinition(BaseModel):
    scenario_id: str
    name: str
    description: str
    attack_type: AttackAgentType
    adversarial_count: int
    legitimate_count: int
    target_policy_category: str
    seed_offset: int
    difficulty: str = "HIGH"


# 10 Canonical Deterministic Benchmark Scenarios using existing supported engine primitives
CANONICAL_BENCHMARK_SCENARIOS: List[BenchmarkScenarioDefinition] = [
    BenchmarkScenarioDefinition(
        scenario_id="SCN-01",
        name="Multi-Account Identity Fragmentation",
        description="8 coordinated synthetic accounts cycling below account velocity thresholds while sharing 1 device and 1 address.",
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER,
        adversarial_count=80,
        legitimate_count=240,
        target_policy_category="VELOCITY",
        seed_offset=1,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-02",
        name="Account Velocity Micro-Pulsing",
        description="Adversarial transaction bursts spaced precisely at 610s (10.1 min) to evade 10-minute sliding lookback windows.",
        attack_type=AttackAgentType.VELOCITY_ATTACKER,
        adversarial_count=60,
        legitimate_count=200,
        target_policy_category="VELOCITY",
        seed_offset=2,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-03",
        name="Device Spoofing Velocity Burst",
        description="Rapid checkout sequence cycling synthetic device fingerprints to bypass device velocity caps.",
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER,
        adversarial_count=70,
        legitimate_count=210,
        target_policy_category="IDENTITY",
        seed_offset=3,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-04",
        name="Coordinated Syndicate Ring",
        description="Distributed syndicate sharing payment instruments across multiple distinct user profiles.",
        attack_type=AttackAgentType.COORDINATED_CLUSTER,
        adversarial_count=100,
        legitimate_count=300,
        target_policy_category="BEHAVIORAL",
        seed_offset=4,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-05",
        name="High-Value Amount Ceiling Bypass",
        description="Targeted transaction amounts positioned right below maximum single transaction thresholds.",
        attack_type=AttackAgentType.VELOCITY_ATTACKER,
        adversarial_count=50,
        legitimate_count=180,
        target_policy_category="AMOUNT",
        seed_offset=5,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-06",
        name="Payment Instrument Rotation",
        description="Cycling synthetic card tokens across rapid checkout sessions to evade instrument-level limits.",
        attack_type=AttackAgentType.PAYMENT_ROTATOR,
        adversarial_count=75,
        legitimate_count=225,
        target_policy_category="PAYMENT_INSTRUMENT",
        seed_offset=6,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-07",
        name="Refund-to-Order Ratio Abuse",
        description="Simulated order placement followed by high-frequency partial refund requests to exploit refund windows.",
        attack_type=AttackAgentType.REFUND_ABUSER,
        adversarial_count=65,
        legitimate_count=200,
        target_policy_category="REFUNDS",
        seed_offset=7,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-08",
        name="Promotion & Coupon Stacking",
        description="Exploiting new-user welcome discounts and first-order vouchers across synthetic identities.",
        attack_type=AttackAgentType.PROMOTION_ABUSER,
        adversarial_count=85,
        legitimate_count=250,
        target_policy_category="PROMOTIONS",
        seed_offset=8,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-09",
        name="Rapid Account-Switching Bursts",
        description="Sub-minute account login and transaction sequences originating from identical IP subnets.",
        attack_type=AttackAgentType.IDENTITY_FRAGMENTER,
        adversarial_count=70,
        legitimate_count=220,
        target_policy_category="BEHAVIORAL",
        seed_offset=9,
    ),
    BenchmarkScenarioDefinition(
        scenario_id="SCN-10",
        name="Address Cluster Re-use",
        description="Distributed orders from disparate synthetic customer accounts delivering to a single physical hub address.",
        attack_type=AttackAgentType.COORDINATED_CLUSTER,
        adversarial_count=90,
        legitimate_count=270,
        target_policy_category="IDENTITY",
        seed_offset=10,
    ),
]


def get_canonical_scenarios() -> List[BenchmarkScenarioDefinition]:
    """Returns the immutable 10-scenario canonical benchmark suite."""
    return list(CANONICAL_BENCHMARK_SCENARIOS)
