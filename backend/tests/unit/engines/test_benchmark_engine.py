import pytest
from backend.app.engines.benchmark.benchmark_engine import BenchmarkEngine
from backend.app.schemas.benchmark import DatasetSplitType
from backend.app.schemas.common import RiskDecisionOutcome
from backend.app.core.exceptions import BenchmarkIntegrityError


def test_held_out_lifecycle_isolation_enforcement():
    """
    Verifies that requesting held-out test data during non-final evaluation
    raises BenchmarkIntegrityError.
    """
    engine = BenchmarkEngine()
    dummy_txns = [
        {"id": "t1", "is_adversarial": True, "outcome": RiskDecisionOutcome.BLOCKED, "amount": 1000.0, "dataset_split": "held_out"},
        {"id": "t2", "is_adversarial": False, "outcome": RiskDecisionOutcome.ALLOWED, "amount": 500.0, "dataset_split": "held_out"},
    ]

    # Attempting to access held-out split without is_final_held_out_evaluation=True must fail
    with pytest.raises(BenchmarkIntegrityError):
        engine.compute_metrics(dummy_txns, split=DatasetSplitType.HELD_OUT, is_final_held_out_evaluation=False)

    # Calling with is_final_held_out_evaluation=True succeeds
    res = engine.compute_metrics(dummy_txns, split=DatasetSplitType.HELD_OUT, is_final_held_out_evaluation=True)
    assert res.total_transactions == 2
    assert res.true_positives == 1
    assert res.true_negatives == 1
    assert res.recall == 100.0


def test_benchmark_metric_formulas():
    engine = BenchmarkEngine()
    # 80 TP, 20 FN (100 total adversarial), 10 FP, 90 TN (100 total legitimate)
    txns = []
    for i in range(80):
        txns.append({"id": f"tp-{i}", "is_adversarial": True, "outcome": RiskDecisionOutcome.BLOCKED, "amount": 1000.0, "dataset_split": "development"})
    for i in range(20):
        txns.append({"id": f"fn-{i}", "is_adversarial": True, "outcome": RiskDecisionOutcome.ALLOWED, "amount": 2000.0, "dataset_split": "development"})
    for i in range(10):
        txns.append({"id": f"fp-{i}", "is_adversarial": False, "outcome": RiskDecisionOutcome.BLOCKED, "amount": 500.0, "dataset_split": "development"})
    for i in range(90):
        txns.append({"id": f"tn-{i}", "is_adversarial": False, "outcome": RiskDecisionOutcome.ALLOWED, "amount": 500.0, "dataset_split": "development"})

    metrics = engine.compute_metrics(txns, split=DatasetSplitType.DEVELOPMENT)

    assert metrics.total_transactions == 200
    assert metrics.true_positives == 80
    assert metrics.false_negatives == 20
    assert metrics.false_positives == 10
    assert metrics.true_negatives == 90

    # Recall = 80 / (80 + 20) = 80.0%
    assert metrics.recall == 80.0
    # Precision = 80 / (80 + 10) = 88.9%
    assert metrics.precision == 88.9
    # FPR = 10 / (10 + 90) = 10.0%
    assert metrics.false_positive_rate == 10.0
    # ASR = 20 / 100 = 20.0%
    assert metrics.attack_success_rate == 20.0
    # Exposure = 20 * 2000 = 40000.0
    assert metrics.simulated_exposure == 40000.0


def test_zero_division_protection():
    engine = BenchmarkEngine()
    empty_metrics = engine.compute_metrics([], split=DatasetSplitType.DEVELOPMENT)
    assert empty_metrics.precision == 0.0
    assert empty_metrics.recall == 0.0
    assert empty_metrics.f1_score == 0.0
    assert empty_metrics.false_positive_rate == 0.0
