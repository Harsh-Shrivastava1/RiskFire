from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import SimulationStatus
from backend.app.schemas.attack import AttackAgentType, AttackDifficulty


class SimulationCreateRequest(BaseModel):
    policy_id: Optional[str] = None
    policy_version_id: Optional[str] = None
    policy_name: Optional[str] = None
    seed: Optional[int] = None
    attack_types: List[AttackAgentType] = Field(default_factory=lambda: [AttackAgentType.VELOCITY_ATTACKER])
    difficulty: AttackDifficulty = AttackDifficulty.HIGH
    legitimate_transaction_count: int = Field(default=2400, ge=10, le=50000)
    attack_transaction_count: int = Field(default=800, ge=10, le=50000)
    sim_duration_hours: int = Field(default=24, ge=1, le=168)


class FireDrillRequest(BaseModel):
    policy_id: Optional[str] = None
    difficulty: AttackDifficulty = AttackDifficulty.HIGH
    seed: Optional[int] = None


class SimulationEventResponse(BaseModel):
    id: str
    simulation_id: str
    event_type: str
    sequence_num: int
    timestamp: str
    sim_timestamp: str
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SimulationRunResponse(BaseModel):
    id: str
    merchant_id: str
    policy_id: Optional[str] = None
    policy_version_id: str
    policy_name: str
    policy_version_number: str
    seed: int
    status: SimulationStatus
    run_type: str  # "MANUAL" | "FIRE_DRILL" | "REPLAY" | "BENCHMARK"
    started_at: str
    completed_at: Optional[str] = None
    duration_seconds: Optional[float] = None
    total_transactions: int
    legitimate_transactions_count: int
    attack_transactions_count: int
    attacks_attempted: int
    bypasses_found: int
    simulated_exposure: float
    detection_recall: float
    false_positive_rate: float
    events_processed: int
    active_agents: List[AttackAgentType] = Field(default_factory=list)
    error_message: Optional[str] = None
