from typing import List, Optional
from pymongo import DESCENDING
from pymongo.database import Database
from backend.app.database.repositories.interfaces.benchmark_repository import BenchmarkRepository
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BatchBenchmarkReportSchema,
    PolicyComparisonReportSchema,
    DatasetSplitType,
)


class MongoBenchmarkRepository(BenchmarkRepository):
    def __init__(self, db: Database):
        self.runs_col = db.benchmarks
        self.comparisons_col = db.benchmark_comparisons
        self.batch_reports_col = db.benchmark_batch_reports
        self.policy_comparisons_col = db.policy_comparisons

    async def list_benchmark_runs(self, split: Optional[DatasetSplitType] = None) -> List[BenchmarkRunResponse]:
        query = {}
        if split:
            val = split.value if hasattr(split, "value") else str(split)
            query["dataset_split"] = val
        cursor = self.runs_col.find(query, {"_id": 0}).sort("executed_at", DESCENDING)
        docs = list(cursor)
        return [BenchmarkRunResponse.model_validate(doc) for doc in docs]

    async def get_benchmark_run_by_id(self, benchmark_id: str) -> Optional[BenchmarkRunResponse]:
        doc = self.runs_col.find_one({"id": benchmark_id}, {"_id": 0})
        if not doc:
            return None
        return BenchmarkRunResponse.model_validate(doc)

    async def save_benchmark_run(self, benchmark: BenchmarkRunResponse) -> BenchmarkRunResponse:
        self.runs_col.update_one(
            {"id": benchmark.id},
            {"$set": benchmark.model_dump()},
            upsert=True
        )
        return benchmark

    async def get_latest_comparison(self, split: Optional[DatasetSplitType] = None) -> Optional[BenchmarkComparisonResponse]:
        query = {}
        if split:
            val = split.value if hasattr(split, "value") else str(split)
            query["dataset_split"] = val
        cursor = self.comparisons_col.find(query, {"_id": 0}).sort("_id", DESCENDING).limit(1)
        docs = list(cursor)
        if not docs:
            return None
        return BenchmarkComparisonResponse.model_validate(docs[0])

    async def save_comparison(self, comparison: BenchmarkComparisonResponse) -> BenchmarkComparisonResponse:
        self.comparisons_col.update_one(
            {"id": comparison.id},
            {"$set": comparison.model_dump()},
            upsert=True
        )
        return comparison

    async def save_batch_report(self, report: BatchBenchmarkReportSchema) -> BatchBenchmarkReportSchema:
        self.batch_reports_col.update_one(
            {"benchmark_id": report.benchmark_id},
            {"$set": report.model_dump()},
            upsert=True
        )
        return report

    async def get_batch_report_by_id(self, benchmark_id: str) -> Optional[BatchBenchmarkReportSchema]:
        doc = self.batch_reports_col.find_one({"benchmark_id": benchmark_id}, {"_id": 0})
        if not doc:
            return None
        return BatchBenchmarkReportSchema.model_validate(doc)

    async def list_batch_reports(self) -> List[BatchBenchmarkReportSchema]:
        cursor = self.batch_reports_col.find({}, {"_id": 0}).sort("created_at", DESCENDING)
        docs = list(cursor)
        return [BatchBenchmarkReportSchema.model_validate(doc) for doc in docs]

    async def save_policy_comparison(self, report: PolicyComparisonReportSchema) -> PolicyComparisonReportSchema:
        self.policy_comparisons_col.update_one(
            {"comparison_id": report.comparison_id},
            {"$set": report.model_dump()},
            upsert=True
        )
        return report

    async def get_policy_comparison_by_id(self, comparison_id: str) -> Optional[PolicyComparisonReportSchema]:
        doc = self.policy_comparisons_col.find_one({"comparison_id": comparison_id}, {"_id": 0})
        if not doc:
            return None
        return PolicyComparisonReportSchema.model_validate(doc)

    async def list_policy_comparisons(self) -> List[PolicyComparisonReportSchema]:
        cursor = self.policy_comparisons_col.find({}, {"_id": 0}).sort("created_at", DESCENDING)
        docs = list(cursor)
        return [PolicyComparisonReportSchema.model_validate(doc) for doc in docs]

