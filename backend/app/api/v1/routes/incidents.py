from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_incident_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.incident_service import IncidentService
from backend.app.schemas.incident import IncidentResponse, IncidentCreate, IncidentUpdate

router = APIRouter(prefix="/incidents", tags=["Incidents"])


@router.get("", response_model=List[IncidentResponse], status_code=status.HTTP_200_OK)
async def list_incidents(
    status_filter: Optional[str] = Query(None, alias="status"),
    user: UserContext = Depends(get_current_user),
    incident_service: IncidentService = Depends(get_incident_service)
) -> List[IncidentResponse]:
    return await incident_service.list_incidents(status=status_filter)


@router.get("/{incident_id}", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
async def get_incident(
    incident_id: str,
    user: UserContext = Depends(get_current_user),
    incident_service: IncidentService = Depends(get_incident_service)
) -> IncidentResponse:
    return await incident_service.get_incident(incident_id)


@router.post("", response_model=IncidentResponse, status_code=status.HTTP_201_CREATED)
async def create_incident(
    data: IncidentCreate,
    user: UserContext = Depends(get_current_user),
    incident_service: IncidentService = Depends(get_incident_service)
) -> IncidentResponse:
    return await incident_service.create_incident(data, actor_name=user.name)


@router.put("/{incident_id}", response_model=IncidentResponse, status_code=status.HTTP_200_OK)
async def update_incident(
    incident_id: str,
    data: IncidentUpdate,
    user: UserContext = Depends(get_current_user),
    incident_service: IncidentService = Depends(get_incident_service)
) -> IncidentResponse:
    return await incident_service.update_incident(incident_id, data, actor_name=user.name)
