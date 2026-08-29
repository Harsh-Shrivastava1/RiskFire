from typing import List, Optional
from backend.app.database.repositories.interfaces.attack_repository import AttackRepository
from backend.app.services.audit_service import AuditService
from backend.app.ai.base import AIProvider
from backend.app.ai.modules.attack_planner import AttackPlanner
from backend.app.ai.schemas.attack_plan import AttackPlannerInput, AttackPlan
from backend.app.schemas.attack import AttackAgentSchema, AttackScenarioSchema, AttackAgentType
from backend.app.schemas.common import AuditActorType
from backend.app.core.exceptions import ResourceNotFoundError


class AttackService:
    def __init__(
        self,
        attack_repo: AttackRepository,
        audit_service: Optional[AuditService] = None,
        ai_provider: Optional[AIProvider] = None
    ):
        self.attack_repo = attack_repo
        self.audit_service = audit_service
        self.ai_provider = ai_provider
        self.planner = AttackPlanner(ai_provider) if ai_provider else None

    async def list_attack_agents(self) -> List[AttackAgentSchema]:
        return await self.attack_repo.list_attack_agents()

    async def get_attack_agent(self, agent_type: AttackAgentType) -> AttackAgentSchema:
        agent = await self.attack_repo.get_attack_agent_by_type(agent_type)
        if not agent:
            raise ResourceNotFoundError("AttackAgent", agent_type.value)
        return agent

    async def get_scenarios(self, simulation_id: str) -> List[AttackScenarioSchema]:
        return await self.attack_repo.get_scenarios_by_simulation(simulation_id)

    async def generate_attack_plan(
        self,
        input_data: AttackPlannerInput,
        actor_name: str = "Arjun Mehta"
    ) -> AttackPlan:
        if not self.planner:
            raise RuntimeError("AttackPlanner is not initialized (missing AIProvider).")

        plan = await self.planner.generate_plan(input_data)

        if self.audit_service:
            await self.audit_service.record_event(
                action="AI_ATTACK_PLAN_GENERATED",
                entity_type="AttackPlan",
                entity_id=input_data.simulation_id or "plan-gen",
                entity_name=f"Attack Plan ({plan.attack_type.value})",
                actor_name=actor_name,
                actor_type=AuditActorType.AI_AGENT,
                details={
                    "attack_type": plan.attack_type.value,
                    "target_policy": plan.target_policy_name,
                    "transaction_count": plan.transaction_count,
                    "duration_minutes": plan.duration_minutes
                }
            )

        return plan
