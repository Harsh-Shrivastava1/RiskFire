from typing import List
from fastapi import APIRouter, Depends, status
from backend.app.api.v1.dependencies import get_attack_service
from backend.app.core.security import get_current_user, UserContext
from backend.app.services.attack_service import AttackService
from backend.app.schemas.attack import AttackAgentSchema, AttackScenarioSchema, AttackAgentType
from backend.app.ai.schemas.attack_plan import AttackPlannerInput, AttackPlan

router = APIRouter(prefix="/attacks", tags=["Attacks"])


@router.get("/agents", response_model=List[AttackAgentSchema], status_code=status.HTTP_200_OK)
async def list_attack_agents(
    user: UserContext = Depends(get_current_user),
    attack_service: AttackService = Depends(get_attack_service)
) -> List[AttackAgentSchema]:
    return await attack_service.list_attack_agents()


@router.get("/agents/{agent_type}", response_model=AttackAgentSchema, status_code=status.HTTP_200_OK)
async def get_attack_agent(
    agent_type: AttackAgentType,
    user: UserContext = Depends(get_current_user),
    attack_service: AttackService = Depends(get_attack_service)
) -> AttackAgentSchema:
    return await attack_service.get_attack_agent(agent_type)


@router.get("/scenarios/{simulation_id}", response_model=List[AttackScenarioSchema], status_code=status.HTTP_200_OK)
async def get_simulation_scenarios(
    simulation_id: str,
    user: UserContext = Depends(get_current_user),
    attack_service: AttackService = Depends(get_attack_service)
) -> List[AttackScenarioSchema]:
    return await attack_service.get_scenarios(simulation_id)


@router.post("/plan", response_model=AttackPlan, status_code=status.HTTP_200_OK)
async def generate_attack_plan(
    input_data: AttackPlannerInput,
    user: UserContext = Depends(get_current_user),
    attack_service: AttackService = Depends(get_attack_service)
) -> AttackPlan:
    """
    Generate an AI attack plan for an active policy.
    AI generates candidate strategy; execution is handled deterministically by AttackEngine.
    """
    return await attack_service.generate_attack_plan(input_data, actor_name=user.name)
