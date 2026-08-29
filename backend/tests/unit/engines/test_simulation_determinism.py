import pytest
from backend.app.engines.simulation.simulation_engine import SimulationEngine
from backend.app.schemas.simulation import SimulationCreateRequest
from backend.app.schemas.policy import PolicyResponse, PolicyCategory, PolicyVersionSchema, PolicyRuleSchema, PolicyRuleType, PolicyStatus, RuleAction
from backend.app.schemas.attack import AttackAgentType


@pytest.fixture
def sample_policy() -> PolicyResponse:
    rule1 = PolicyRuleSchema(
        id="rule-test-1",
        name="Account Velocity Limit",
        rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
        category=PolicyCategory.VELOCITY,
        parameters={"max_txns": 3, "window_minutes": 10},
        action=RuleAction.BLOCK,
        is_enabled=True,
        sequence_order=1
    )
    v1 = PolicyVersionSchema(
        id="pv-test-1",
        policy_id="pol-test-1",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=[rule1],
        created_at="2026-08-20T10:00:00Z",
        created_by="Test Runner"
    )
    return PolicyResponse(
        id="pol-test-1",
        merchant_id="m-dev-01",
        name="Test Velocity Policy",
        description="Policy for determinism testing",
        category=PolicyCategory.VELOCITY,
        current_version_id="pv-test-1",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=1,
        coverage_rate=80.0,
        effectiveness_rate=85.0,
        created_at="2026-08-20T10:00:00Z",
        updated_at="2026-08-20T10:00:00Z",
        versions=[v1]
    )


def test_simulation_canonical_semantic_determinism(sample_policy: PolicyResponse):
    """
    Verifies that running two independent simulations with the exact same seed (49201)
    produces identical canonical semantic results:
    - Same total transaction count
    - Same bypass count
    - Same simulated exposure
    - Same detection recall
    - Same sequence of transaction amounts and adversarial flags
    - Same decision outcomes
    """
    engine = SimulationEngine()
    req = SimulationCreateRequest(
        policy_id=sample_policy.id,
        seed=49201,
        attack_types=[AttackAgentType.VELOCITY_ATTACKER],
        legitimate_transaction_count=200,
        attack_transaction_count=50,
        sim_duration_hours=12
    )

    run1 = engine.run_simulation(req, sample_policy, seed=49201, simulation_id_override="sim-det-01")
    run2 = engine.run_simulation(req, sample_policy, seed=49201, simulation_id_override="sim-det-02")

    # Canonical semantic comparisons
    assert run1.simulation.seed == run2.simulation.seed == 49201
    assert run1.simulation.total_transactions == run2.simulation.total_transactions == 250
    assert run1.simulation.bypasses_found == run2.simulation.bypasses_found
    assert run1.simulation.simulated_exposure == run2.simulation.simulated_exposure
    assert run1.simulation.detection_recall == run2.simulation.detection_recall
    assert run1.simulation.false_positive_rate == run2.simulation.false_positive_rate

    # Transaction stream semantic equality
    for t1, t2 in zip(run1.transactions, run2.transactions):
        assert t1["amount"] == t2["amount"]
        assert t1["is_adversarial"] == t2["is_adversarial"]
        assert t1["outcome"] == t2["outcome"]
        assert t1["dataset_split"] == t2["dataset_split"]
        assert t1["created_at_sim"] == t2["created_at_sim"]


def test_simulation_seed_divergence(sample_policy: PolicyResponse):
    """
    Verifies that changing the simulation seed (49201 vs 54321)
    produces divergent transaction amounts and simulated events.
    """
    engine = SimulationEngine()
    req1 = SimulationCreateRequest(
        policy_id=sample_policy.id,
        seed=49201,
        attack_types=[AttackAgentType.VELOCITY_ATTACKER],
        legitimate_transaction_count=100,
        attack_transaction_count=30
    )
    req2 = SimulationCreateRequest(
        policy_id=sample_policy.id,
        seed=54321,
        attack_types=[AttackAgentType.VELOCITY_ATTACKER],
        legitimate_transaction_count=100,
        attack_transaction_count=30
    )

    run1 = engine.run_simulation(req1, sample_policy, seed=49201)
    run2 = engine.run_simulation(req2, sample_policy, seed=54321)

    assert run1.simulation.seed != run2.simulation.seed
    # Verify entity or transaction divergence
    txn1_amounts = [t["amount"] for t in run1.transactions[:10]]
    txn2_amounts = [t["amount"] for t in run2.transactions[:10]]
    assert txn1_amounts != txn2_amounts
