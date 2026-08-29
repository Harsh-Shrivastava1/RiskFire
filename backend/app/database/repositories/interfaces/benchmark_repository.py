from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BatchBenchmarkReportSchema,
    PolicyComparisonReportSchema,
    DatasetSplitType,
)


class BenchmarkRepository(ABC):
    @abstractmethod
    async def list_benchmark_runs(self, split: Optional[DatasetSplitType] = None) -> List[BenchmarkRunResponse]:
        pass

    @abstractmethod
    async def get_benchmark_run_by_id(self, benchmark_id: str) -> Optional[BenchmarkRunResponse]:
        pass

    @abstractmethod
    async def save_benchmark_run(self, benchmark: BenchmarkRunResponse) -> BenchmarkRunResponse:
        pass

    @abstractmethod
    async def get_latest_comparison(self, split: Optional[DatasetSplitType] = None) -> Optional[BenchmarkComparisonResponse]:
        pass

    @abstractmethod
    async def save_comparison(self, comparison: BenchmarkComparisonResponse) -> BenchmarkComparisonResponse:
        pass

    @abstractmethod
    async def save_batch_report(self, report: BatchBenchmarkReportSchema) -> BatchBenchmarkReportSchema:
        pass

    @abstractmethod
    async def get_batch_report_by_id(self, benchmark_id: str) -> Optional[BatchBenchmarkReportSchema]:
        pass

    @abstractmethod
    async def save_policy_comparison(self, report: "PolicyComparisonReportSchema") -> "PolicyComparisonReportSchema":
        pass

    @abstractmethod
    async def get_policy_comparison_by_id(self, comparison_id: str) -> Optional["PolicyComparisonReportSchema"]:
        pass

    @abstractmethod
    async def list_policy_comparisons(self) -> List["PolicyComparisonReportSchema"]:
        pass

