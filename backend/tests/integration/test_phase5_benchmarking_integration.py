import asyncio
import subprocess
import sys
import pytest

from backend.app.database.repositories.memory.memory_audit_repo import InMemoryAuditRepository
from backend.app.database.repositories.memory.memory_benchmark_repo import InMemoryBenchmarkRepository
from backend.app.schemas.common import DatasetSplitType, PolicyStatus
from backend.app.schemas.policy import (
    PolicyCategory,
    PolicyResponse,
    PolicyRuleSchema,
    PolicyRuleType,
    PolicyVersionSchema,
    RuleAction,
)
from backend.app.services.audit_service import AuditService
from backend.app.services.benchmark_service import BenchmarkService


@pytest.fixture
def sample_baseline() -> PolicyResponse:
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
        )
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
        name="Core Merchant Velocity Guard",
        description="Baseline risk policy.",
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
            id="rule-dev-frag-01",
            name="Device Entity Linkage Guard",
            rule_type=PolicyRuleType.IDENTITY_DEVICE_COUNT,
            category=PolicyCategory.IDENTITY,
            parameters={"shared_device_max_accounts": 2},
            action=RuleAction.BLOCK,
            is_enabled=True,
            sequence_order=2,
        ),
    ]



@pytest.mark.asyncio
async def test_benchmark_service_batch_lifecycle_and_audit(sample_baseline, sample_candidate_rules):
    bench_repo = InMemoryBenchmarkRepository()
    audit_repo = InMemoryAuditRepository()
    audit_service = AuditService(audit_repo=audit_repo)
    service = BenchmarkService(benchmark_repo=bench_repo, audit_service=audit_service)

    # 1. Freeze candidate
    cand_snapshot = await service.freeze_candidate(
        candidate_id="cand-svc-01",
        baseline_policy=sample_baseline,
        candidate_rules=sample_candidate_rules,
        candidate_version="v1.1.0-cand",
        actor_name="Harsh Shrivastava"
    )
    assert cand_snapshot.is_frozen is True

    # 2. Execute Batch Benchmark on Held-Out split
    report = await service.execute_batch_benchmark(
        baseline_policy=sample_baseline,
        candidate_snapshot=cand_snapshot,
        seed=49201,
        dataset_id="ds-synthetic-v1",
        split=DatasetSplitType.HELD_OUT,
        actor_name="Harsh Shrivastava"
    )

    assert report.benchmark_id is not None
    assert report.scenarios_evaluated_count == 10
    assert report.candidate_metrics is not None

    # 3. Verify Repository Persistence
    fetched_report = await service.get_batch_report(report.benchmark_id)
    assert fetched_report.benchmark_id == report.benchmark_id
    assert len(fetched_report.scenario_results) == 10

    all_reports = await service.list_batch_reports()
    assert len(all_reports) >= 1

    # 4. Verify Audit Event Trail
    events = await audit_service.list_audit_logs()
    action_names = [e.action for e in events]
    assert "CANDIDATE_FROZEN" in action_names
    assert "BENCHMARK_STARTED" in action_names
    assert "HELD_OUT_EVALUATION_STARTED" in action_names
    assert "HELD_OUT_EVALUATION_COMPLETED" in action_names


def test_cli_scripts_execution():
    # Test export dataset CLI
    res_export = subprocess.run(
        [sys.executable, "-m", "scripts.export_dataset", "--seed", "49201", "--legit", "200", "--adv", "100"],
        capture_output=True,
        text=True
    )
    assert res_export.returncode == 0
    assert "RISKFIRE — DETERMINISTIC DATASET EXPORT" in res_export.stdout
    assert "Cryptographic dataset integrity confirmed" in res_export.stdout

    # Test run benchmark CLI with reproducibility check
    res_bench = subprocess.run(
        [sys.executable, "-m", "scripts.run_benchmark", "--seed", "49201", "--check-reproducibility"],
        capture_output=True,
        text=True
    )
    assert res_bench.returncode == 0
    assert "HEADLESS BATCH BENCHMARK & GENERALIZATION EVALUATION" in res_bench.stdout
    assert "REPRODUCIBILITY PROOF & DIVERGENCE VERIFICATION" in res_bench.stdout
    assert "Run A (49201) and Run B (49201) are 100% BIT-FOR-BIT IDENTICAL." in res_bench.stdout
    assert "Different seeds produce provably divergent synthetic experiments." in res_bench.stdout
