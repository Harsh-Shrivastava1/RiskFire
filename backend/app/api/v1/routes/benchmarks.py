from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_benchmark_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.benchmark_service import BenchmarkService
from backend.app.schemas.benchmark import (
    BenchmarkRunResponse,
    BenchmarkComparisonResponse,
    BatchBenchmarkReportSchema,
    PolicyComparisonRequest,
    PolicyComparisonReportSchema,
    DatasetManifestSchema,
    DatasetSplitType,
)

router = APIRouter(prefix="/benchmarks", tags=["Benchmarks"])


@router.post("/compare-policies", response_model=PolicyComparisonReportSchema, status_code=status.HTTP_200_OK)
async def compare_two_policies(
    request: PolicyComparisonRequest,
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> PolicyComparisonReportSchema:
    """
    Executes a deterministic, strictly fair side-by-side benchmark comparison between two policies.
    Enforces identical seed, dataset, held-out split, workload, and canonical 10 scenarios.
    Returns deterministic recommendation with zero AI authority over the outcome.
    """
    return await benchmark_service.compare_two_policies(
        request=request,
        actor_name=user.name
    )


@router.get("/comparisons", response_model=List[PolicyComparisonReportSchema], status_code=status.HTTP_200_OK)
async def list_policy_comparisons(
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> List[PolicyComparisonReportSchema]:
    return await benchmark_service.list_policy_comparisons()


@router.get("/comparisons/{comparison_id}", response_model=PolicyComparisonReportSchema, status_code=status.HTTP_200_OK)
async def get_policy_comparison(
    comparison_id: str,
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> PolicyComparisonReportSchema:
    return await benchmark_service.get_policy_comparison(comparison_id)


@router.get("", response_model=List[BenchmarkRunResponse], status_code=status.HTTP_200_OK)
@router.get("/runs", response_model=List[BenchmarkRunResponse], status_code=status.HTTP_200_OK)
async def list_benchmark_runs(
    split: Optional[DatasetSplitType] = Query(None),
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> List[BenchmarkRunResponse]:
    return await benchmark_service.list_benchmark_runs(split=split)


@router.get("/runs/{benchmark_id}", response_model=BenchmarkRunResponse, status_code=status.HTTP_200_OK)
async def get_benchmark_run(
    benchmark_id: str,
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> BenchmarkRunResponse:
    return await benchmark_service.get_benchmark_run(benchmark_id)


@router.get("/comparison/latest", response_model=BenchmarkComparisonResponse, status_code=status.HTTP_200_OK)
async def get_latest_comparison(
    split: Optional[DatasetSplitType] = Query(None),
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> BenchmarkComparisonResponse:
    return await benchmark_service.get_latest_comparison(split=split)


@router.get("/batch/reports", response_model=List[BatchBenchmarkReportSchema], status_code=status.HTTP_200_OK)
async def list_batch_reports(
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> List[BatchBenchmarkReportSchema]:
    return await benchmark_service.list_batch_reports()


@router.get("/batch/reports/{benchmark_id}", response_model=BatchBenchmarkReportSchema, status_code=status.HTTP_200_OK)
async def get_batch_report(
    benchmark_id: str,
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> BatchBenchmarkReportSchema:
    return await benchmark_service.get_batch_report(benchmark_id)


@router.post("/integrity/verify", response_model=DatasetManifestSchema, status_code=status.HTTP_200_OK)
async def verify_dataset_integrity(
    manifest_path: Optional[str] = Query(None),
    user: UserContext = Depends(get_current_user),
    benchmark_service: BenchmarkService = Depends(get_benchmark_service)
) -> DatasetManifestSchema:
    return await benchmark_service.verify_dataset_integrity(
        manifest_path=manifest_path,
        actor_name=user.name
    )


