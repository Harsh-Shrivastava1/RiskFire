import pytest
from backend.app.schemas.common import RiskDecisionOutcome, SeverityLevel
from backend.app.schemas.attack import AttackAgentType
from backend.app.schemas.benchmark import (
    CandidatePolicySnapshot,
    BenchmarkMetricsSchema,
    DatasetSplitType,
)
from backend.app.schemas.policy import PolicyResponse, PolicyCategory, PolicyStatus, PolicyRuleSchema, PolicyRuleType, RuleAction
from backend.app.engines.vulnerability.vulnerability_engine import VulnerabilityEngine
from backend.app.engines.decision.patch_decision_engine import PatchDecisionEngine
from backend.app.engines.graph.graph_engine import AttackGraphEngine
from backend.app.engines.benchmark.benchmark_engine import BenchmarkEngine


@pytest.fixture
def mock_evaluated_transactions():
    """Generates synthetic transactions with adversarial bypasses and legitimate traffic."""
    txns = []
    # 10 Legitimate transactions
    for i in range(10):
        txns.append({
            "id": f"txn-legit-{i}",
            "account_id": f"acc-{i % 3}",
            "device_id": f"dev-{i % 2}",
            "ip_id": f"192.168.1.{i % 2}",
            "address_id": f"addr-{i % 2}",
            "payment_instrument_id": f"card-{i % 2}",
            "amount": 2500.0,
            "is_adversarial": False,
            "attack_type": None,
            "outcome": RiskDecisionOutcome.ALLOWED,
            "rules_triggered": ["Core Velocity Guard"],
            "created_at_sim": "2026-08-29T10:00:00Z"
        })

    # 10 Adversarial transactions (6 bypassed, 4 blocked)
    for i in range(10):
        outcome = RiskDecisionOutcome.ALLOWED if i < 6 else RiskDecisionOutcome.BLOCKED
        txns.append({
            "id": f"txn-adv-{i}",
            "account_id": f"acc-adv-{i % 2}",
            "device_id": f"dev-adv-{i % 3}",
            "ip_id": f"10.0.0.{i % 4}",
            "address_id": f"addr-adv-{i % 2}",
            "payment_instrument_id": f"card-adv-{i % 2}",
            "amount": 45000.0,
            "is_adversarial": True,
            "attack_type": AttackAgentType.VELOCITY_ATTACKER.value,
            "outcome": outcome,
            "rules_triggered": [] if outcome == RiskDecisionOutcome.ALLOWED else ["High Value Guard"],
            "created_at_sim": f"2026-08-29T10:{i:02d}:00Z"
        })

    return txns


def test_vulnerability_engine_rich_weakness_analysis(mock_evaluated_transactions):
    """Verifies that VulnerabilityEngine outputs rich plain-English summaries, entity extraction, and rule trigger coverage."""
    engine = VulnerabilityEngine()
    active_rules = [
        PolicyRuleSchema(
            id="r1",
            name="High Value Guard",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 50000.0},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1
        ),
        PolicyRuleSchema(
            id="r2",
            name="Device Burst Limiter",
            rule_type=PolicyRuleType.VELOCITY_DEVICE,
            category=PolicyCategory.IDENTITY,
            parameters={"max_txns_per_device": 2, "window_minutes": 10},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=2
        )
    ]

    vulns = engine.analyze_simulation_results(
        simulation_id="sim-test-01",
        policy_id="pol-01",
        policy_name="Core Merchant Policy",
        policy_version_number="v1.0.0",
        evaluated_transactions=mock_evaluated_transactions,
        active_rules=active_rules,
        dataset_split="HELD_OUT",
        seed=49201
    )

    assert len(vulns) >= 1
    v = vulns[0]
    assert v.bypass_count == 6
    assert v.total_attack_count == 10
    assert v.bypass_rate == 60.0
    assert v.simulated_exposure == 6 * 45000.0
    assert v.plain_english_summary is not None
    assert "Your policy caught 4 attacks" in v.plain_english_summary
    assert len(v.affected_accounts) > 0
    assert len(v.affected_devices) > 0
    assert len(v.affected_ips) > 0
    assert v.dataset_split == "HELD_OUT"
    assert v.seed == 49201


def test_patch_decision_engine_deterministic_rules():
    """Verifies mathematical deterministic decision logic and plain-English reasons in PatchDecisionEngine."""
    engine = PatchDecisionEngine()

    # Baseline metrics
    base_m = BenchmarkMetricsSchema(
        total_transactions=1000,
        total_adversarial=200,
        total_legitimate=800,
        true_positives=120,
        false_positives=16,
        true_negatives=784,
        false_negatives=80,
        precision=88.2,
        recall=60.0,
        f1_score=71.4,
        false_positive_rate=2.0,
        attack_success_rate=40.0,
        successful_bypasses=80,
        simulated_exposure=400000.0,
        customer_friction_score=2.0,
        policy_coverage=95.0,
        simulation_throughput=250.0
    )

    # Case 1: Significant improvement (Recall 60% -> 90%, FPR 2.0% -> 2.2%)
    cand_good = base_m.model_copy(update={
        "recall": 90.0,
        "false_positive_rate": 2.2,
        "simulated_exposure": 100000.0
    })
    eval_approve = engine.evaluate_decision(
        baseline_metrics=base_m,
        candidate_metrics=cand_good,
        comparison=None,
        candidate_snapshot=None,
        dataset_split=DatasetSplitType.HELD_OUT
    )
    assert eval_approve.decision == "APPROVE_PATCH"
    assert "APPROVING" in eval_approve.recommendation_summary
    assert len(eval_approve.security_improvements) > 0

    # Case 2: Severe FPR regression (Recall 60% -> 95%, FPR 2.0% -> 7.0%)
    cand_regress = base_m.model_copy(update={
        "recall": 95.0,
        "false_positive_rate": 7.0,
        "simulated_exposure": 50000.0
    })
    eval_reject = engine.evaluate_decision(
        baseline_metrics=base_m,
        candidate_metrics=cand_regress,
        comparison=None,
        candidate_snapshot=None,
        dataset_split=DatasetSplitType.HELD_OUT
    )
    assert eval_reject.decision == "REJECT_PATCH"
    assert "REJECTING" in eval_reject.recommendation_summary
    assert len(eval_reject.operational_regressions) > 0

    # Case 3: Marginal improvement (Recall 60% -> 61%, FPR 2.0% -> 2.0%)
    cand_marginal = base_m.model_copy(update={
        "recall": 61.0,
        "false_positive_rate": 2.0,
        "simulated_exposure": 390000.0
    })
    eval_manual = engine.evaluate_decision(
        baseline_metrics=base_m,
        candidate_metrics=cand_marginal,
        comparison=None,
        candidate_snapshot=None,
        dataset_split=DatasetSplitType.HELD_OUT
    )
    assert eval_manual.decision == "MANUAL_REVIEW_REQUIRED"
    assert "Manual Review" in eval_manual.recommendation_title


def test_attack_graph_engine_full_synthesis(mock_evaluated_transactions):
    """Verifies that AttackGraphEngine synthesizes accounts, devices, IPs, addresses, payment instruments, and edges."""
    engine = AttackGraphEngine()
    graph = engine.build_attack_graph(mock_evaluated_transactions)

    assert len(graph.nodes) > 0
    assert len(graph.edges) > 0

    node_types = set(n.data.entity_type.value for n in graph.nodes)
    assert "ACCOUNT" in node_types
    assert "DEVICE" in node_types
    assert "IP" in node_types
    assert "ADDRESS" in node_types
    assert "PAYMENT_INSTRUMENT" in node_types


def test_candidate_freezing_sha256_lineage():
    """Verifies that CandidatePolicySnapshot hashes rules and baseline into an immutable SHA-256 checksum."""
    benchmark_engine = BenchmarkEngine()
    baseline = PolicyResponse(
        id="pol-test-01",
        merchant_id="merch-01",
        name="Baseline Policy",
        description="Core velocity policy",
        category=PolicyCategory.VELOCITY,
        current_version_id="pv-1",
        current_version_number="v1.0.0",
        rule_count=1,
        coverage_rate=95.0,
        effectiveness_rate=88.0,
        is_active=True,
        versions=[],
        created_at="2026-08-29T10:00:00Z",
        updated_at="2026-08-29T10:00:00Z"
    )
    candidate_rules = [
        PolicyRuleSchema(
            id="r-cand-1",
            name="IP Burst Limit",
            rule_type=PolicyRuleType.VELOCITY_IP,
            category=PolicyCategory.VELOCITY,
            parameters={"max_txns_per_ip": 3, "window_minutes": 15},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1
        )
    ]

    snapshot1 = benchmark_engine.freeze_candidate(
        candidate_id="cand-001",
        baseline_policy=baseline,
        candidate_rules=candidate_rules,
        candidate_version="v1.1.0-cand1",
        source_vulnerability_id="vuln-001"
    )

    snapshot2 = benchmark_engine.freeze_candidate(
        candidate_id="cand-001",
        baseline_policy=baseline,
        candidate_rules=candidate_rules,
        candidate_version="v1.1.0-cand1",
        source_vulnerability_id="vuln-001"
    )

    assert snapshot1.candidate_checksum == snapshot2.candidate_checksum
    assert len(snapshot1.candidate_checksum) == 64  # SHA-256 hex length
    assert snapshot1.baseline_version == "v1.0.0"
    assert snapshot1.candidate_version == "v1.1.0-cand1"
