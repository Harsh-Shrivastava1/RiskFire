import asyncio
from typing import Dict, List, Optional
from backend.app.database.repositories.interfaces.benchmark_repository import BenchmarkRepository
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BenchmarkMetricsSchema,
    BatchBenchmarkReportSchema,
    PolicyComparisonReportSchema,
    DatasetSplitType,
)


class InMemoryBenchmarkRepository(BenchmarkRepository):
    def __init__(self):
        self._lock = asyncio.Lock()
        self._runs: Dict[str, BenchmarkRunResponse] = {}
        self._comparisons: Dict[str, BenchmarkComparisonResponse] = {}
        self._batch_reports: Dict[str, BatchBenchmarkReportSchema] = {}
        self._policy_comparisons: Dict[str, PolicyComparisonReportSchema] = {}
        self._seed_default_benchmarks()

    def _seed_default_benchmarks(self):
        m_before = BenchmarkMetricsSchema(
            total_transactions=480,
            total_adversarial=120,
            total_legitimate=360,
            true_positives=86,
            true_negatives=340,
            false_positives=20,
            false_negatives=34,
            precision=81.1,
            recall=71.7,
            f1_score=76.1,
            false_positive_rate=5.6,
            attack_success_rate=28.3,
            successful_bypasses=34,
            simulated_exposure=163200.0,
            exposure_reduction=0.0,
            customer_friction_score=5.6,
            policy_coverage=71.7,
            simulation_throughput=1420.0
        )

        m_after = BenchmarkMetricsSchema(
            total_transactions=480,
            total_adversarial=120,
            total_legitimate=360,
            true_positives=114,
            true_negatives=354,
            false_positives=6,
            false_negatives=6,
            precision=95.0,
            recall=95.0,
            f1_score=95.0,
            false_positive_rate=1.7,
            attack_success_rate=5.0,
            successful_bypasses=6,
            simulated_exposure=28800.0,
            exposure_reduction=134400.0,
            customer_friction_score=1.7,
            policy_coverage=95.0,
            simulation_throughput=1480.0
        )

        run1 = BenchmarkRunResponse(
            id="bm-run-001",
            simulation_id="sim-run-8921",
            policy_id="pol-vel-01",
            policy_name="Core Merchant Velocity & High-Value Guard",
            policy_version_number="v1.0.0",
            dataset_split=DatasetSplitType.HELD_OUT,
            status="COMPLETED",
            metrics=m_before,
            is_held_out_isolated=True,
            executed_at="2026-08-20T10:15:50Z"
        )

        run2 = BenchmarkRunResponse(
            id="bm-run-002",
            simulation_id="sim-run-8921",
            policy_id="pol-vel-01",
            policy_name="Core Merchant Velocity & High-Value Guard",
            policy_version_number="v1.1.0",
            dataset_split=DatasetSplitType.HELD_OUT,
            status="COMPLETED",
            metrics=m_after,
            is_held_out_isolated=True,
            executed_at="2026-08-20T10:16:30Z"
        )

        comp1 = BenchmarkComparisonResponse(
            id="cmp-991",
            patch_id="patch-991",
            baseline_version="v1.0.0",
            patched_version="v1.1.0",
            dataset_split=DatasetSplitType.HELD_OUT,
            before=m_before,
            after=m_after,
            delta_recall=23.3,
            delta_precision=13.9,
            delta_fpr=-3.9,
            delta_exposure=134400.0,
            net_improvement_score=27.2,
            is_regression=False,
            recommendation="APPROVE_PATCH"
        )

        self._runs[run1.id] = run1
        self._runs[run2.id] = run2
        self._comparisons[comp1.id] = comp1

    async def list_benchmark_runs(self, split: Optional[DatasetSplitType] = None) -> List[BenchmarkRunResponse]:
        async with self._lock:
            runs = list(self._runs.values())
            if split:
                runs = [r for r in runs if r.dataset_split == split]
            return runs

    async def get_benchmark_run_by_id(self, benchmark_id: str) -> Optional[BenchmarkRunResponse]:
        async with self._lock:
            return self._runs.get(benchmark_id)

    async def save_benchmark_run(self, benchmark: BenchmarkRunResponse) -> BenchmarkRunResponse:
        async with self._lock:
            self._runs[benchmark.id] = benchmark
            return benchmark

    async def get_latest_comparison(self, split: Optional[DatasetSplitType] = None) -> Optional[BenchmarkComparisonResponse]:
        async with self._lock:
            if not self._comparisons:
                return None
            comps = list(self._comparisons.values())
            if split:
                comps = [c for c in comps if c.dataset_split == split]
            return comps[-1] if comps else None

    async def save_comparison(self, comparison: BenchmarkComparisonResponse) -> BenchmarkComparisonResponse:
        async with self._lock:
            self._comparisons[comparison.id] = comparison
            return comparison

    async def save_batch_report(self, report: BatchBenchmarkReportSchema) -> BatchBenchmarkReportSchema:
        async with self._lock:
            self._batch_reports[report.benchmark_id] = report
            return report

    async def get_batch_report_by_id(self, benchmark_id: str) -> Optional[BatchBenchmarkReportSchema]:
        async with self._lock:
            return self._batch_reports.get(benchmark_id)

    async def list_batch_reports(self) -> List[BatchBenchmarkReportSchema]:
        async with self._lock:
            return list(self._batch_reports.values())

    async def save_policy_comparison(self, report: PolicyComparisonReportSchema) -> PolicyComparisonReportSchema:
        async with self._lock:
            self._policy_comparisons[report.comparison_id] = report
            return report

    async def get_policy_comparison_by_id(self, comparison_id: str) -> Optional[PolicyComparisonReportSchema]:
        async with self._lock:
            return self._policy_comparisons.get(comparison_id)

    async def list_policy_comparisons(self) -> List[PolicyComparisonReportSchema]:
        async with self._lock:
            return list(self._policy_comparisons.values())
