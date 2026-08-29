from typing import List
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_audit_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.audit_service import AuditService
from backend.app.schemas.audit import AuditLogResponse

router = APIRouter(prefix="/audit", tags=["Audit"])


@router.get("", response_model=List[AuditLogResponse], status_code=status.HTTP_200_OK)
@router.get("/logs", response_model=List[AuditLogResponse], status_code=status.HTTP_200_OK)
async def list_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    user: UserContext = Depends(get_current_user),
    audit_service: AuditService = Depends(get_audit_service)
) -> List[AuditLogResponse]:
    return await audit_service.list_audit_logs(limit=limit, offset=offset)

