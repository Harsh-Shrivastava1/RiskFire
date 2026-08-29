from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.attack import AttackAgentType, AttackStepSchema


class AttackPlannerInput(BaseModel):
    merchant_id: str
    simulation_id: str
    active_policy_names: List[str]
    attack_type: AttackAgentType
    difficulty: str = "HIGH"
    available_entity_counts: dict = Field(default_factory=dict)


class AttackPlan(BaseModel):
    attack_type: AttackAgentType
    objective: str
    target_policy_name: str
    actors_count: int = Field(ge=1, le=100)
    shared_device: bool
    shared_address: bool
    shared_ip: bool
    transaction_count: int = Field(ge=1, le=10000)
    duration_minutes: int = Field(ge=1, le=1440)
    attack_steps: List[dict] = Field(default_factory=list)
    reasoning: str
