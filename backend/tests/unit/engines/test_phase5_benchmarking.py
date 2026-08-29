import json
import os
import shutil
import tempfile
from pathlib import Path
import pytest

from backend.app.core.exceptions import (
    BenchmarkIntegrityError,
    DatasetIntegrityError,
    IsolationError,
)
from backend.app.engines.benchmark.artifact_exporter import ArtifactExporter
from backend.app.engines.benchmark.batch_runner import BatchBenchmarkRunner
from backend.app.engines.benchmark.benchmark_engine import BenchmarkEngine
from backend.app.engines.benchmark.candidate_freezer import CandidateFreezer, compute_policy_checksum
from backend.app.engines.benchmark.dataset_exporter import DatasetExporter
from backend.app.engines.benchmark.scenarios import get_canonical_scenarios
from backend.app.schemas.benchmark import (
    BatchBenchmarkReportSchema,
    BenchmarkState,
    CandidatePolicySnapshot,
)
from backend.app.schemas.common import (
    DatasetSplitType,
    PolicyStatus,
)
from backend.app.schemas.policy import (
    PolicyCategory,
    PolicyResponse,
    PolicyRuleSchema,
    PolicyRuleType,
    PolicyVersionSchema,
    RuleAction,
)


@pytest.fixture
def temp_dir():
    d = tempfile.mkdtemp()
    yield Path(d)
    shutil.rmtree(d, ignore_errors=True)


@pytest.fixture
def sample_baseline_policy() -> PolicyResponse:
    rules = [
        PolicyRuleSchema(
            id="rule-vel-01",
            name="Account 10-Minute Velocity Cap",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"time_window_minutes": 10, "max_transactions": 5},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
        ),
        PolicyRuleSchema(
            id="rule-amt-01",
            name="Single Transaction High-Value Cap",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 10000.0},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
        ),
    ]
    version = PolicyVersionSchema(
        id="ver-1.0.0",
        policy_id="pol-vel-01",
        version_number="v1.0.0",
        status=PolicyStatus.ACTIVE,
        rules=rules,
        created_by="system",
        created_at="2026-08-20T10:00:00Z"
    )
    return PolicyResponse(
        id="pol-vel-01",
        merchant_id="mer-default",
        name="Core Merchant Velocity & High-Value Guard",
        description="Baseline risk policy for card velocity and amount limits.",
        category=PolicyCategory.VELOCITY,
        current_version_id="ver-1.0.0",
        current_version_number="v1.0.0",
        is_active=True,
        rule_count=len(rules),
        coverage_rate=71.7,
        effectiveness_rate=71.7,
        versions=[version],
        created_at="2026-08-20T10:00:00Z",
        updated_at="2026-08-20T10:00:00Z"
    )


@pytest.fixture
def sample_candidate_rules() -> list[PolicyRuleSchema]:
    return [
        PolicyRuleSchema(
            id="rule-vel-01",
            name="Account 10-Minute Velocity Cap",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"time_window_minutes": 10, "max_transactions": 5},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=1,
        ),
        PolicyRuleSchema(
            id="rule-amt-01",
            name="Single Transaction High-Value Cap",
            rule_type=PolicyRuleType.AMOUNT_MAX,
            category=PolicyCategory.AMOUNT,
            parameters={"max_amount": 8000.0},
            action=RuleAction.FLAG,
            is_enabled=True,
            sequence_order=2,
        ),
        PolicyRuleSchema(
            id="rule-dev-frag-01",
            name="Device Entity Linkage & Clustering Guard",
            rule_type=PolicyRuleType.IDENTITY_DEVICE_COUNT,
            category=PolicyCategory.IDENTITY,
            parameters={"shared_device_max_accounts": 2, "lookback_hours": 24},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=3,
        ),
    ]



# 1. Dataset Determinism
def test_dataset_generation_determinism(temp_dir):
    exporter = DatasetExporter(output_base_dir=str(temp_dir / "ds1"))
    manifest_1, splits_1 = exporter.generate_and_export_dataset(seed=49201, legitimate_count=100, adversarial_count=50)

    exporter2 = DatasetExporter(output_base_dir=str(temp_dir / "ds2"))
    manifest_2, splits_2 = exporter2.generate_and_export_dataset(seed=49201, legitimate_count=100, adversarial_count=50)

    assert manifest_1.total_records == manifest_2.total_records
    assert manifest_1.development_count == manifest_2.development_count
    assert manifest_1.validation_count == manifest_2.validation_count
    assert manifest_1.held_out_count == manifest_2.held_out_count

    # Verify SHA-256 hashes match bit-for-bit
    for f1, f2 in zip(manifest_1.files, manifest_2.files):
        assert f1.split == f2.split
        assert f1.sha256_hash == f2.sha256_hash
        assert f1.record_count == f2.record_count


# 2. Seed Divergence
def test_dataset_generation_divergence(temp_dir):
    exporter = DatasetExporter(output_base_dir=str(temp_dir / "ds_seeds"))
    manifest_49201, _ = exporter.generate_and_export_dataset(seed=49201, dataset_id="ds-49201", legitimate_count=100, adversarial_count=50)
    manifest_54321, _ = exporter.generate_and_export_dataset(seed=54321, dataset_id="ds-54321", legitimate_count=100, adversarial_count=50)

    # Different seeds should produce divergent cryptographic checksums
    hashes_49201 = {f.split: f.sha256_hash for f in manifest_49201.files}
    hashes_54321 = {f.split: f.sha256_hash for f in manifest_54321.files}

    assert hashes_49201["development"] != hashes_54321["development"]
    assert hashes_49201["held_out"] != hashes_54321["held_out"]


# 3. 70/15/15 Split Distribution
def test_dataset_split_proportions(temp_dir):
    exporter = DatasetExporter(output_base_dir=str(temp_dir / "ds_split"))
    manifest, _ = exporter.generate_and_export_dataset(seed=49201, legitimate_count=700, adversarial_count=300)

    total = manifest.total_records
    assert total == 1000
    # Expected approx 70% dev, 15% val, 15% test
    assert 650 <= manifest.development_count <= 750
    assert 110 <= manifest.validation_count <= 190
    assert 110 <= manifest.held_out_count <= 190
    assert manifest.development_count + manifest.validation_count + manifest.held_out_count == total


# 4. Cryptographic Integrity Check
def test_dataset_integrity_verification_success(temp_dir):
    exporter = DatasetExporter(output_base_dir=str(temp_dir / "ds_int"))
    exporter.generate_and_export_dataset(seed=49201, legitimate_count=50, adversarial_count=20)
    manifest = exporter.verify_dataset_integrity()
    assert manifest.dataset_id == "ds-synthetic-v1"
    assert manifest.seed == 49201


# 5. Tampering Detection
def test_dataset_integrity_tampering_detection(temp_dir):
    exporter = DatasetExporter(output_base_dir=str(temp_dir / "ds_tamper"))
    exporter.generate_and_export_dataset(seed=49201, legitimate_count=50, adversarial_count=20)

    # Tamper with the development transactions file
    dev_file = temp_dir / "ds_tamper" / "development" / "transactions.json"
    with open(dev_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    data[0]["amount"] = 9999999.0
    with open(dev_file, "w", encoding="utf-8") as f:
        json.dump(data, f)

    # Verification must fail loudly with DatasetIntegrityError
    with pytest.raises(DatasetIntegrityError) as exc_info:
        exporter.verify_dataset_integrity()
    assert "checksum mismatch" in str(exc_info.value).lower()


# 6. Canonical Scenarios Catalog
def test_canonical_scenarios_catalog():
    scenarios = get_canonical_scenarios()
    assert len(scenarios) == 10
    ids = [s.scenario_id for s in scenarios]
    assert len(set(ids)) == 10  # Unique IDs
    assert "SCN-01" in ids
    assert "SCN-10" in ids


# 7. Candidate Freezing & Checksum
def test_candidate_freezing_immutability(sample_baseline_policy, sample_candidate_rules):
    freezer = CandidateFreezer()
    snapshot = freezer.freeze_candidate(
        candidate_id="cand-001",
        baseline_policy=sample_baseline_policy,
        candidate_rules=sample_candidate_rules,
        candidate_version="v1.1.0-cand"
    )

    assert snapshot.is_frozen is True
    assert len(snapshot.candidate_checksum) == 64  # SHA-256 hex string

    # Verifying identical rules succeeds
    assert freezer.verify_candidate_immutability(snapshot, sample_candidate_rules) is True

    # Mutating rules and attempting verification raises BenchmarkIntegrityError
    mutated_rules = [r.model_copy(deep=True) for r in sample_candidate_rules]
    mutated_rules[0].parameters = {"time_window_minutes": 999}

    with pytest.raises(BenchmarkIntegrityError) as exc:
        freezer.verify_candidate_immutability(snapshot, mutated_rules)
    assert "mutated after freeze" in str(exc.value).lower()


# 8. Held-Out Isolation Enforcement
def test_held_out_isolation_requires_frozen_candidate(sample_baseline_policy, sample_candidate_rules):
    runner = BatchBenchmarkRunner()
    
    # Create unfrozen snapshot
    freezer = CandidateFreezer()
    snapshot = freezer.freeze_candidate(
        candidate_id="cand-unfrozen",
        baseline_policy=sample_baseline_policy,
        candidate_rules=sample_candidate_rules
    )
    # Manually toggle is_frozen to False to simulate breach
    snapshot.is_frozen = False

    with pytest.raises(IsolationError):
        runner.run_batch_benchmark(
            baseline_policy=sample_baseline_policy,
            candidate_snapshot=snapshot,
            split=DatasetSplitType.HELD_OUT
        )


# 9. Batch Benchmark Execution & No Cherry-Picking
def test_batch_benchmark_all_scenarios_evaluated(sample_baseline_policy, sample_candidate_rules):
    engine = BenchmarkEngine()
    snapshot = engine.freeze_candidate(
        candidate_id="cand-batch-test",
        baseline_policy=sample_baseline_policy,
        candidate_rules=sample_candidate_rules
    )

    report = engine.run_batch_benchmark(
        baseline_policy=sample_baseline_policy,
        candidate_snapshot=snapshot,
        seed=49201,
        split=DatasetSplitType.HELD_OUT
    )

    assert report.state == BenchmarkState.COMPLETED
    assert report.scenarios_evaluated_count == 10
    assert len(report.scenario_results) == 10

    # Ensure all scenarios have status COMPLETED and valid metrics
    for scn in report.scenario_results:
        assert scn.status == "COMPLETED"
        assert scn.total_transactions > 0
        assert 0.0 <= scn.recall <= 100.0
        assert 0.0 <= scn.false_positive_rate <= 100.0

    # Ensure aggregate metrics are calculated
    assert report.baseline_metrics.total_transactions > 0
    assert report.candidate_metrics.total_transactions > 0
    assert report.comparison is not None
    assert report.comparison.delta_recall == round(report.candidate_metrics.recall - report.baseline_metrics.recall, 1)


# 10. Reproducibility Proof
def test_reproducibility_proof(sample_baseline_policy, sample_candidate_rules):
    engine = BenchmarkEngine()
    snapshot = engine.freeze_candidate(
        candidate_id="cand-repro-test",
        baseline_policy=sample_baseline_policy,
        candidate_rules=sample_candidate_rules
    )

    run_1 = engine.run_batch_benchmark(
        baseline_policy=sample_baseline_policy,
        candidate_snapshot=snapshot,
        seed=49201,
        split=DatasetSplitType.HELD_OUT
    )

    run_2 = engine.run_batch_benchmark(
        baseline_policy=sample_baseline_policy,
        candidate_snapshot=snapshot,
        seed=49201,
        split=DatasetSplitType.HELD_OUT
    )

    assert run_1.total_transactions_evaluated == run_2.total_transactions_evaluated
    assert run_1.baseline_metrics.recall == run_2.baseline_metrics.recall
    assert run_1.candidate_metrics.recall == run_2.candidate_metrics.recall
    assert run_1.baseline_metrics.simulated_exposure == run_2.baseline_metrics.simulated_exposure
    assert run_1.candidate_metrics.simulated_exposure == run_2.candidate_metrics.simulated_exposure

    for s1, s2 in zip(run_1.scenario_results, run_2.scenario_results):
        assert s1.scenario_id == s2.scenario_id
        assert s1.recall == s2.recall
        assert s1.bypasses_count == s2.bypasses_count
        assert s1.simulated_exposure == s2.simulated_exposure


# 11. Artifact Export JSON & CSV
def test_artifact_export(temp_dir, sample_baseline_policy, sample_candidate_rules):
    engine = BenchmarkEngine()
    engine.artifact_exporter = ArtifactExporter(base_dir=str(temp_dir / "benchmarks"))

    snapshot = engine.freeze_candidate(
        candidate_id="cand-artifact-test",
        baseline_policy=sample_baseline_policy,
        candidate_rules=sample_candidate_rules
    )

    report = engine.run_batch_benchmark(
        baseline_policy=sample_baseline_policy,
        candidate_snapshot=snapshot,
        seed=49201,
        split=DatasetSplitType.HELD_OUT
    )

    json_path = engine.artifact_exporter.export_report_json(report)
    csv_path = engine.artifact_exporter.export_report_csv(report)

    assert json_path.exists()
    assert csv_path.exists()

    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    assert data["benchmark_id"] == report.benchmark_id
    assert len(data["scenario_results"]) == 10

    with open(csv_path, "r", encoding="utf-8") as f:
        content = f.read()
    assert "=== RISKFIRE BENCHMARK REPORT ===" in content
    assert "=== AGGREGATE METRICS COMPARISON ===" in content
    assert "=== PER-SCENARIO BREAKDOWN ===" in content
    assert "SCN-01" in content
    assert "SCN-10" in content


# 12. Honest Reporting of Regressions
def test_honest_regression_reporting(sample_baseline_policy):
    # Create an inferior candidate policy (e.g. all rules disabled or threshold loosened)
    inferior_rules = [
        PolicyRuleSchema(
            id="rule-vel-01",
            name="Account 10-Minute Velocity Cap (Loosened)",
            rule_type=PolicyRuleType.VELOCITY_ACCOUNT,
            category=PolicyCategory.VELOCITY,
            parameters={"time_window_minutes": 10, "max_transactions": 500},
            action=RuleAction.BLOCK,
            is_enabled=False,
            sequence_order=1,
        )
    ]
    engine = BenchmarkEngine()
    snapshot = engine.freeze_candidate(
        candidate_id="cand-inferior",
        baseline_policy=sample_baseline_policy,
        candidate_rules=inferior_rules
    )

    report = engine.run_batch_benchmark(
        baseline_policy=sample_baseline_policy,
        candidate_snapshot=snapshot,
        seed=49201,
        split=DatasetSplitType.HELD_OUT
    )

    assert report.comparison.delta_recall <= 0.0
    assert report.comparison.is_regression is True
    assert report.comparison.recommendation == "REJECT_PATCH"
