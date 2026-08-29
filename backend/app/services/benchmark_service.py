from datetime import datetime, timezone
from typing import List, Optional
from backend.app.database.repositories.interfaces.benchmark_repository import BenchmarkRepository
from backend.app.database.repositories.interfaces.policy_repository import PolicyRepository
from backend.app.services.audit_service import AuditService
from backend.app.engines.benchmark.benchmark_engine import BenchmarkEngine
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BatchBenchmarkReportSchema,
    PolicyComparisonRequest,
    PolicyComparisonReportSchema,
    CandidatePolicySnapshot,
    DatasetManifestSchema,
    DatasetSplitType,
)
from backend.app.schemas.policy import PolicyResponse, PolicyRuleSchema
from backend.app.schemas.common import AuditActorType
from backend.app.core.exceptions import ResourceNotFoundError, BenchmarkIntegrityError


class BenchmarkService:
    def __init__(
        self,
        benchmark_repo: BenchmarkRepository,
        audit_service: AuditService,
        policy_repo: Optional[PolicyRepository] = None
    ):
        self.benchmark_repo = benchmark_repo
        self.audit_service = audit_service
        self.policy_repo = policy_repo
        self.benchmark_engine = BenchmarkEngine()

    async def list_benchmark_runs(self, split: Optional[DatasetSplitType] = None) -> List[BenchmarkRunResponse]:
        return await self.benchmark_repo.list_benchmark_runs(split=split)

    async def get_benchmark_run(self, benchmark_id: str) -> BenchmarkRunResponse:
        run = await self.benchmark_repo.get_benchmark_run_by_id(benchmark_id)
        if not run:
            raise ResourceNotFoundError("BenchmarkRun", benchmark_id)
        return run

    async def get_latest_comparison(self, split: Optional[DatasetSplitType] = None) -> BenchmarkComparisonResponse:
        comp = await self.benchmark_repo.get_latest_comparison(split=split)
        if not comp:
            raise ResourceNotFoundError("BenchmarkComparison", split.value if split else "LATEST")
        return comp

    async def execute_held_out_benchmark(
        self,
        simulation_id: str,
        policy_id: str,
        policy_name: str,
        policy_version_number: str,
        transactions: List[dict],
        split: DatasetSplitType = DatasetSplitType.HELD_OUT,
        actor_name: str = "Harsh Shrivastava"
    ) -> BenchmarkRunResponse:
        # Enforce held-out test evaluation boundary
        metrics = self.benchmark_engine.compute_metrics(
            transactions=transactions,
            split=split,
            is_final_held_out_evaluation=(split == DatasetSplitType.HELD_OUT)
        )

        now_iso = datetime.now(timezone.utc).isoformat()
        run_id = f"bm-run-{simulation_id[-4:]}-{split.value[:3]}"

        run = BenchmarkRunResponse(
            id=run_id,
            simulation_id=simulation_id,
            policy_id=policy_id,
            policy_name=policy_name,
            policy_version_number=policy_version_number,
            dataset_split=split,
            status="COMPLETED",
            metrics=metrics,
            is_held_out_isolated=True,
            executed_at=now_iso
        )

        saved = await self.benchmark_repo.save_benchmark_run(run)

        await self.audit_service.record_event(
            action="BENCHMARK_EVALUATION_COMPLETED",
            entity_type="BenchmarkRun",
            entity_id=saved.id,
            entity_name=f"Benchmark Run on {split.value} Split",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "split": split.value,
                "recall": metrics.recall,
                "precision": metrics.precision,
                "fpr": metrics.false_positive_rate,
                "exposure": metrics.simulated_exposure
            }
        )

        return saved

    async def freeze_candidate(
        self,
        candidate_id: str,
        baseline_policy: PolicyResponse,
        candidate_rules: List[PolicyRuleSchema],
        candidate_version: str = "v1.1.0-candidate",
        source_vulnerability_id: Optional[str] = None,
        ai_proposal_id: Optional[str] = None,
        actor_name: str = "Harsh Shrivastava"
    ) -> CandidatePolicySnapshot:
        snapshot = self.benchmark_engine.freeze_candidate(
            candidate_id=candidate_id,
            baseline_policy=baseline_policy,
            candidate_rules=candidate_rules,
            candidate_version=candidate_version,
            source_vulnerability_id=source_vulnerability_id,
            ai_proposal_id=ai_proposal_id
        )

        await self.audit_service.record_event(
            action="CANDIDATE_FROZEN",
            entity_type="CandidatePolicySnapshot",
            entity_id=snapshot.candidate_id,
            entity_name=f"Candidate Policy Snapshot {snapshot.candidate_version}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "candidate_checksum": snapshot.candidate_checksum,
                "baseline_version": snapshot.baseline_version,
                "candidate_version": snapshot.candidate_version,
                "rules_count": len(snapshot.rules)
            }
        )

        return snapshot

    async def execute_batch_benchmark(
        self,
        baseline_policy: PolicyResponse,
        candidate_snapshot: Optional[CandidatePolicySnapshot] = None,
        seed: int = 49201,
        dataset_id: str = "ds-synthetic-v1",
        split: DatasetSplitType = DatasetSplitType.HELD_OUT,
        actor_name: str = "Harsh Shrivastava"
    ) -> BatchBenchmarkReportSchema:
        await self.audit_service.record_event(
            action="BENCHMARK_STARTED",
            entity_type="BatchBenchmark",
            entity_id=f"bm-batch-{seed % 10000:04d}",
            entity_name=f"Multi-Scenario Batch Benchmark (Seed: {seed})",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "seed": seed,
                "dataset_id": dataset_id,
                "split": split.value,
                "has_candidate": candidate_snapshot is not None
            }
        )

        if split == DatasetSplitType.HELD_OUT:
            await self.audit_service.record_event(
                action="HELD_OUT_EVALUATION_STARTED",
                entity_type="BatchBenchmark",
                entity_id=f"bm-batch-{seed % 10000:04d}",
                entity_name="Held-Out Evaluation Started",
                actor_name=actor_name,
                actor_type=AuditActorType.SYSTEM,
                details={"split": split.value, "seed": seed}
            )

        report = self.benchmark_engine.run_batch_benchmark(
            baseline_policy=baseline_policy,
            candidate_snapshot=candidate_snapshot,
            seed=seed,
            dataset_id=dataset_id,
            split=split
        )

        # Export JSON and CSV artifacts
        self.benchmark_engine.artifact_exporter.export_report_json(report)
        self.benchmark_engine.artifact_exporter.export_report_csv(report)

        # Persist to repository
        saved_report = await self.benchmark_repo.save_batch_report(report)

        # If comparison exists, save it to comparison collection as well
        if report.comparison:
            await self.benchmark_repo.save_comparison(report.comparison)

        if split == DatasetSplitType.HELD_OUT:
            await self.audit_service.record_event(
                action="HELD_OUT_EVALUATION_COMPLETED",
                entity_type="BatchBenchmark",
                entity_id=saved_report.benchmark_id,
                entity_name="Held-Out Evaluation Completed",
                actor_name=actor_name,
                actor_type=AuditActorType.SYSTEM,
                details={
                    "benchmark_id": saved_report.benchmark_id,
                    "scenarios_count": saved_report.scenarios_evaluated_count,
                    "baseline_recall": saved_report.baseline_metrics.recall,
                    "candidate_recall": saved_report.candidate_metrics.recall if saved_report.candidate_metrics else None,
                    "delta_recall": saved_report.comparison.delta_recall if saved_report.comparison else None,
                    "recommendation": saved_report.comparison.recommendation if saved_report.comparison else None
                }
            )

        return saved_report

    async def get_batch_report(self, benchmark_id: str) -> BatchBenchmarkReportSchema:
        report = await self.benchmark_repo.get_batch_report_by_id(benchmark_id)
        if not report:
            raise ResourceNotFoundError("BatchBenchmarkReport", benchmark_id)
        return report

    async def list_batch_reports(self) -> List[BatchBenchmarkReportSchema]:
        return await self.benchmark_repo.list_batch_reports()

    async def verify_dataset_integrity(
        self,
        manifest_path: Optional[str] = None,
        actor_name: str = "Harsh Shrivastava"
    ) -> DatasetManifestSchema:
        manifest = self.benchmark_engine.dataset_exporter.verify_dataset_integrity(manifest_path)

        await self.audit_service.record_event(
            action="BENCHMARK_INTEGRITY_VERIFIED",
            entity_type="DatasetManifest",
            entity_id=manifest.dataset_id,
            entity_name="Cryptographic Dataset Integrity Verified",
            actor_name=actor_name,
            actor_type=AuditActorType.SYSTEM,
            details={
                "dataset_id": manifest.dataset_id,
                "seed": manifest.seed,
                "total_records": manifest.total_records,
                "files_count": len(manifest.files)
            }
        )

        return manifest

    async def compare_two_policies(
        self,
        request: PolicyComparisonRequest,
        actor_name: str = "Harsh Shrivastava"
    ) -> PolicyComparisonReportSchema:
        if not self.policy_repo:
            raise RuntimeError("PolicyRepository is required for policy comparison.")

        policy_a = await self.policy_repo.get_policy_by_id(request.policy_a_id)
        if not policy_a:
            raise ResourceNotFoundError("Policy A", request.policy_a_id)

        policy_b = await self.policy_repo.get_policy_by_id(request.policy_b_id)
        if not policy_b:
            raise ResourceNotFoundError("Policy B", request.policy_b_id)

        report = self.benchmark_engine.run_two_policy_comparison(
            policy_a=policy_a,
            policy_b=policy_b,
            seed=request.seed,
            dataset_id=request.dataset_id,
            split=request.dataset_split
        )

        saved = await self.benchmark_repo.save_policy_comparison(report)

        await self.audit_service.record_event(
            action="POLICIES_COMPARED",
            entity_type="PolicyComparison",
            entity_id=saved.comparison_id,
            entity_name=f"Comparison: {policy_a.name} vs {policy_b.name}",
            actor_name=actor_name,
            actor_type=AuditActorType.USER,
            details={
                "policy_a_id": policy_a.id,
                "policy_a_name": policy_a.name,
                "policy_b_id": policy_b.id,
                "policy_b_name": policy_b.name,
                "seed": request.seed,
                "dataset_id": request.dataset_id,
                "split": request.dataset_split.value,
                "recommendation": saved.recommendation,
                "delta_recall": saved.delta_recall,
                "delta_fpr": saved.delta_fpr,
                "delta_exposure": saved.delta_exposure
            }
        )

        return saved

    async def get_policy_comparison(self, comparison_id: str) -> PolicyComparisonReportSchema:
        report = await self.benchmark_repo.get_policy_comparison_by_id(comparison_id)
        if not report:
            raise ResourceNotFoundError("PolicyComparisonReport", comparison_id)
        return report

    async def list_policy_comparisons(self) -> List[PolicyComparisonReportSchema]:
        return await self.benchmark_repo.list_policy_comparisons()


