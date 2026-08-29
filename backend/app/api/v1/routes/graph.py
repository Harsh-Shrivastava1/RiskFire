from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from backend.app.api.v1.dependencies import get_graph_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.graph_service import GraphService
from backend.app.schemas.graph import AttackGraphDataResponse

router = APIRouter(prefix="/graph", tags=["AttackGraph"])


@router.get("", response_model=AttackGraphDataResponse, status_code=status.HTTP_200_OK)
async def get_attack_graph(
    simulation_id: Optional[str] = Query(None),
    user: UserContext = Depends(get_current_user),
    graph_service: GraphService = Depends(get_graph_service)
) -> AttackGraphDataResponse:
    """
    Returns entity topology graph nodes and edges for React Flow visualization.
    """
    return await graph_service.get_attack_graph(simulation_id=simulation_id)
