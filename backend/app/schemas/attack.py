from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import SeverityLevel


class AttackAgentType(str, Enum):
    VELOCITY_ATTACKER = "VELOCITY_ATTACKER"
    IDENTITY_FRAGMENTER = "IDENTITY_FRAGMENTER"
    REFUND_ABUSER = "REFUND_ABUSER"
    PROMOTION_ABUSER = "PROMOTION_ABUSER"
    PAYMENT_ROTATOR = "PAYMENT_ROTATOR"
    COORDINATED_CLUSTER = "COORDINATED_CLUSTER"


class AttackDifficulty(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EXPERT = "EXPERT"


class AttackerObjective(str, Enum):
    BYPASS_ACCOUNT_VELOCITY = "BYPASS_ACCOUNT_VELOCITY"
    BYPASS_DEVICE_FINGERPRINT = "BYPASS_DEVICE_FINGERPRINT"
    EXPLOIT_REFUND_WINDOW = "EXPLOIT_REFUND_WINDOW"
    FARM_NEW_USER_PROMOTIONS = "FARM_NEW_USER_PROMOTIONS"
    ROTATE_PAYMENT_INSTRUMENTS = "ROTATE_PAYMENT_INSTRUMENTS"
    COORDINATED_SYNDICATE_DRAIN = "COORDINATED_SYNDICATE_DRAIN"


class AttackAgentSchema(BaseModel):
    id: str
    type: AttackAgentType
    name: str
    description: str
    target_policies: List[str] = Field(default_factory=list)
    evasion_tactics: List[str] = Field(default_factory=list)
    severity_potential: SeverityLevel
    icon_name: str


class AttackStepSchema(BaseModel):
    id: str
    sequence_number: int
    actor_account_id: str
    device_id: str
    ip_id: str
    address_id: str
    payment_instrument_id: str
    action_type: str  # "TRANSACT" | "REFUND" | "APPLY_PROMO"
    amount: float
    sim_timestamp: str
    status: str  # "EXECUTED" | "BLOCKED" | "FLAGGED"


class AttackScenarioSchema(BaseModel):
    id: str
    simulation_id: str
    agent_type: AttackAgentType
    name: str
    objective: str
    target_policy_id: str
    target_policy_name: str
    actors_count: int
    shared_device: bool
    shared_address: bool
    shared_ip: bool
    transaction_count: int
    duration_minutes: int
    steps: List[AttackStepSchema] = Field(default_factory=list)
    status: str
    bypass_count: int
    exposure_generated: float
    reasoning: Optional[str] = None
