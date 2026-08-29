from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_vulnerability_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.vulnerability_service import VulnerabilityService
from backend.app.schemas.vulnerability import VulnerabilityResponse
from backend.app.ai.schemas.explanation import VulnerabilityExplanation

router = APIRouter(prefix="/vulnerabilities", tags=["Vulnerabilities"])


@router.get("", response_model=List[VulnerabilityResponse], status_code=status.HTTP_200_OK)
async def list_vulnerabilities(
    status_filter: Optional[str] = Query(None, alias="status"),
    policy_id: Optional[str] = Query(None, description="Scope vulnerabilities to a specific policy"),
    user: UserContext = Depends(get_current_user),
    vulnerability_service: VulnerabilityService = Depends(get_vulnerability_service)
) -> List[VulnerabilityResponse]:
    return await vulnerability_service.list_vulnerabilities(status=status_filter, policy_id=policy_id)


@router.get("/{vulnerability_id}", response_model=VulnerabilityResponse, status_code=status.HTTP_200_OK)
async def get_vulnerability(
    vulnerability_id: str,
    user: UserContext = Depends(get_current_user),
    vulnerability_service: VulnerabilityService = Depends(get_vulnerability_service)
) -> VulnerabilityResponse:
    return await vulnerability_service.get_vulnerability(vulnerability_id)


@router.put("/{vulnerability_id}/status", response_model=VulnerabilityResponse, status_code=status.HTTP_200_OK)
async def update_vulnerability_status(
    vulnerability_id: str,
    status: str = Query(...),
    user: UserContext = Depends(get_current_user),
    vulnerability_service: VulnerabilityService = Depends(get_vulnerability_service)
) -> VulnerabilityResponse:
    return await vulnerability_service.update_status(vulnerability_id, status, actor_name=user.name)


@router.post("/{vulnerability_id}/explain", response_model=VulnerabilityExplanation, status_code=status.HTTP_200_OK)
async def explain_vulnerability(
    vulnerability_id: str,
    user: UserContext = Depends(get_current_user),
    vulnerability_service: VulnerabilityService = Depends(get_vulnerability_service)
) -> VulnerabilityExplanation:
    """
    Generate an AI vulnerability explanation grounded in observed deterministic simulation evidence.
    """
    return await vulnerability_service.explain_vulnerability(vulnerability_id, actor_name=user.name)
