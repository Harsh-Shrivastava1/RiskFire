import pytest
from backend.app.engines.decision.patch_decision_engine import (
    PatchDecisionEngine,
    PatchDecisionPolicy,
)
from backend.app.schemas.benchmark import (
    BenchmarkMetricsSchema,
    BenchmarkComparisonResponse,
    CandidatePolicySnapshot,
    ScenarioMetricResult,
)
from backend.app.schemas.common import DatasetSplitType


def _make_metrics(
    recall: float,
    fpr: float,
    precision: float = 85.0,
    bypasses: int = 20,
    exposure: float = 100000.0,
) -> BenchmarkMetricsSchema:
    return BenchmarkMetricsSchema(
        total_transactions=100,
        total_adversarial=50,
        total_legitimate=50,
        true_positives=int(50 * (recall / 100.0)),
        true_negatives=int(50 * (1 - fpr / 100.0)),
        false_positives=int(50 * (fpr / 100.0)),
        false_negatives=int(50 * (1 - recall / 100.0)),
        precision=precision,
        recall=recall,
        f1_score=round(2 * precision * recall / max(0.1, precision + recall), 1),
        false_positive_rate=fpr,
        attack_success_rate=round(100.0 - recall, 1),
        successful_bypasses=bypasses,
        simulated_exposure=exposure,
        customer_friction_score=1.2,
        policy_coverage=90.0,
        simulation_throughput=1000.0,
        total_evaluations=100,
    )


def test_patch_decision_engine_approval():
    policy = PatchDecisionPolicy(
        max_acceptable_fpr_increase=1.0,
        min_required_recall_gain=10.0,
        max_acceptable_recall_loss=-1.0,
    )
    engine = PatchDecisionEngine(policy=policy)

    baseline = _make_metrics(recall=70.0, fpr=2.0, precision=85.0, bypasses=30, exposure=150000.0)
    candidate = _make_metrics(recall=85.0, fpr=2.5, precision=90.0, bypasses=15, exposure=75000.0)

    snapshot = CandidatePolicySnapshot(
        candidate_id="cand-001",
        baseline_policy_id="pol-001",
        baseline_policy_name="Core Merchant Policy",
        baseline_version="v1.0.0",
        candidate_version="v1.1.0-cand1",
        frozen_at="2026-08-21T00:00:00Z",
        candidate_checksum="abc123canonicalhash",
        rules=[]
    )

    decision = engine.evaluate_decision(
        baseline_metrics=baseline,
        candidate_metrics=candidate,
        comparison=None,
        candidate_snapshot=snapshot,
        dataset_split=DatasetSplitType.HELD_OUT,
    )

    assert decision.decision == "APPROVE_PATCH"
    assert decision.is_held_out_evaluated is True
    assert decision.candidate_checksum == "abc123canonicalhash"
    assert len(decision.security_improvements) > 0
    assert "85.0%" in decision.recommendation_summary or "recall" in decision.recommendation_summary.lower()


def test_patch_decision_engine_rejection_due_to_fpr():
    policy = PatchDecisionPolicy(
        max_acceptable_fpr_increase=1.0,
        min_required_recall_gain=10.0,
        max_acceptable_recall_loss=-1.0,
    )
    engine = PatchDecisionEngine(policy=policy)

    baseline = _make_metrics(recall=70.0, fpr=2.0, precision=85.0, bypasses=30, exposure=150000.0)
    # Candidate has great recall (+25%) but excessive FPR (+9.0%)
    candidate = _make_metrics(recall=95.0, fpr=11.0, precision=60.0, bypasses=5, exposure=25000.0)

    decision = engine.evaluate_decision(
        baseline_metrics=baseline,
        candidate_metrics=candidate,
        comparison=None,
        candidate_snapshot=None,
        dataset_split=DatasetSplitType.HELD_OUT,
    )

    assert decision.decision == "REJECT_PATCH"
    assert any("FPR" in r or "False positive" in r or "friction" in r.lower() for r in decision.reasons)
    assert any("exceeding" in reg or "increased" in reg for reg in decision.operational_regressions)


def test_patch_decision_engine_manual_review():
    policy = PatchDecisionPolicy(
        max_acceptable_fpr_increase=1.0,
        min_required_recall_gain=10.0,
        max_acceptable_recall_loss=-1.0,
    )
    engine = PatchDecisionEngine(policy=policy)

    baseline = _make_metrics(recall=70.0, fpr=2.0, precision=85.0, bypasses=30, exposure=150000.0)
    # Candidate has marginal recall gain (+4%) and negligible FPR change (+0.2%)
    candidate = _make_metrics(recall=74.0, fpr=2.2, precision=86.0, bypasses=26, exposure=130000.0)

    decision = engine.evaluate_decision(
        baseline_metrics=baseline,
        candidate_metrics=candidate,
        comparison=None,
        candidate_snapshot=None,
        dataset_split=DatasetSplitType.VALIDATION,
    )

    assert decision.decision == "MANUAL_REVIEW_REQUIRED"
    assert decision.is_held_out_evaluated is False


def test_ai_cannot_override_deterministic_decision():
    """
    Law of Authority: AI may predict 'high confidence' or 'zero friction',
    but the deterministic metrics dictate the outcome without exception.
    """
    engine = PatchDecisionEngine()

    baseline = _make_metrics(recall=70.0, fpr=1.0)
    # Even if an AI module claimed 100% confidence, empirical data shows FPR regression (+4.0%)
    candidate = _make_metrics(recall=90.0, fpr=5.0)

    decision = engine.evaluate_decision(
        baseline_metrics=baseline,
        candidate_metrics=candidate,
        comparison=None,
        candidate_snapshot=None,
        dataset_split=DatasetSplitType.HELD_OUT,
    )

    assert decision.decision == "REJECT_PATCH"
    assert "REJECT_PATCH" in decision.decision
    assert any("FPR" in r for r in decision.reasons)


def test_metric_anomaly_and_contradiction_defense():
    """
    Defense against malformed or contradictory metrics:
    Invalid metrics (e.g. recall > 100% or negative counts) must never produce APPROVE_PATCH.
    """
    engine = PatchDecisionEngine()

    baseline = _make_metrics(recall=70.0, fpr=2.0)
    # Malformed candidate metric: recall = 150.0%
    candidate = _make_metrics(recall=70.0, fpr=2.0)
    candidate.recall = 150.0

    decision = engine.evaluate_decision(
        baseline_metrics=baseline,
        candidate_metrics=candidate,
        comparison=None,
        candidate_snapshot=None,
    )

    assert decision.decision == "REJECT_PATCH"
    assert "Metric Integrity Error" in decision.recommendation_title
    assert any("outside valid 0-100%" in r for r in decision.reasons)
