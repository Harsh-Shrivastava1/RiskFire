from abc import ABC, abstractmethod
from typing import List, Optional
from backend.app.schemas.attack import AttackAgentSchema, AttackScenarioSchema, AttackAgentType


class AttackRepository(ABC):
    @abstractmethod
    async def list_attack_agents(self) -> List[AttackAgentSchema]:
        pass

    @abstractmethod
    async def get_attack_agent_by_type(self, agent_type: AttackAgentType) -> Optional[AttackAgentSchema]:
        pass

    @abstractmethod
    async def save_scenario(self, scenario: AttackScenarioSchema) -> AttackScenarioSchema:
        pass

    @abstractmethod
    async def get_scenarios_by_simulation(self, simulation_id: str) -> List[AttackScenarioSchema]:
        pass
