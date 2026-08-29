from typing import List
from fastapi import APIRouter, Depends, status
from backend.app.api.v1.dependencies import get_report_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.report_service import ReportService
from backend.app.schemas.report import ExecutiveReportResponse, ReportGenerateRequest

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("", response_model=List[ExecutiveReportResponse], status_code=status.HTTP_200_OK)
async def list_reports(
    user: UserContext = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service)
) -> List[ExecutiveReportResponse]:
    return await report_service.list_reports()


@router.get("/{report_id}", response_model=ExecutiveReportResponse, status_code=status.HTTP_200_OK)
async def get_report(
    report_id: str,
    user: UserContext = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service)
) -> ExecutiveReportResponse:
    return await report_service.get_report(report_id)


@router.post("/generate", response_model=ExecutiveReportResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    request: ReportGenerateRequest,
    user: UserContext = Depends(get_current_user),
    report_service: ReportService = Depends(get_report_service)
) -> ExecutiveReportResponse:
    return await report_service.generate_report(user.merchant_id, request, actor_name=user.name)
