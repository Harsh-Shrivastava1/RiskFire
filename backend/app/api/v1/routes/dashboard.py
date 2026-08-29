from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_dashboard_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.dashboard_service import DashboardService
from backend.app.schemas.dashboard import DashboardSummaryResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse, status_code=status.HTTP_200_OK)
async def get_dashboard_summary(
    policy_id: Optional[str] = Query(None, description="Scope summary to a specific policy ID"),
    policy_version_id: Optional[str] = Query(None, description="Scope summary to a specific policy version"),
    user: UserContext = Depends(get_current_user),
    dashboard_service: DashboardService = Depends(get_dashboard_service)
) -> DashboardSummaryResponse:
    """
    Returns policy-scoped dashboard metrics, risk trends, attack vectors, and critical items.
    Dynamically derived from backend repository state.
    """
    return await dashboard_service.get_dashboard_summary(
        merchant_id=user.merchant_id,
        policy_id=policy_id,
        policy_version_id=policy_version_id
    )
