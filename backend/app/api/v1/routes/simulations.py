from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_simulation_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.simulation_service import SimulationService
from backend.app.schemas.simulation import (
    SimulationRunResponse,
    SimulationEventResponse,
    SimulationCreateRequest,
    FireDrillRequest,
)

router = APIRouter(prefix="/simulations", tags=["Simulations"])


@router.get("", response_model=List[SimulationRunResponse], status_code=status.HTTP_200_OK)
async def list_simulations(
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    user: UserContext = Depends(get_current_user),
    simulation_service: SimulationService = Depends(get_simulation_service)
) -> List[SimulationRunResponse]:
    return await simulation_service.list_simulations(merchant_id=user.merchant_id, limit=limit, offset=offset)


@router.post("", response_model=SimulationRunResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=SimulationRunResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
@router.post("/run", response_model=SimulationRunResponse, status_code=status.HTTP_201_CREATED)
@router.post("/run/", response_model=SimulationRunResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def create_simulation(
    request: SimulationCreateRequest,
    user: UserContext = Depends(get_current_user),
    simulation_service: SimulationService = Depends(get_simulation_service)
) -> SimulationRunResponse:
    return await simulation_service.run_simulation(user.merchant_id, request, actor_name=user.name)


@router.post("/fire-drill", response_model=SimulationRunResponse, status_code=status.HTTP_201_CREATED)
@router.post("/fire-drill/", response_model=SimulationRunResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
async def trigger_fire_drill(
    request: FireDrillRequest,
    user: UserContext = Depends(get_current_user),
    simulation_service: SimulationService = Depends(get_simulation_service)
) -> SimulationRunResponse:
    return await simulation_service.trigger_fire_drill(user.merchant_id, request, actor_name=user.name)


@router.get("/{simulation_id}", response_model=SimulationRunResponse, status_code=status.HTTP_200_OK)
async def get_simulation(
    simulation_id: str,
    user: UserContext = Depends(get_current_user),
    simulation_service: SimulationService = Depends(get_simulation_service)
) -> SimulationRunResponse:
    return await simulation_service.get_simulation(simulation_id)


@router.get("/{simulation_id}/events", response_model=List[SimulationEventResponse], status_code=status.HTTP_200_OK)
async def get_simulation_events(
    simulation_id: str,
    limit: int = Query(default=200, ge=1, le=1000),
    user: UserContext = Depends(get_current_user),
    simulation_service: SimulationService = Depends(get_simulation_service)
) -> List[SimulationEventResponse]:
    return await simulation_service.get_simulation_events(simulation_id, limit=limit)
