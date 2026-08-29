from typing import List
from pydantic import BaseModel, Field


class VulnerabilityExplanationInput(BaseModel):
    vulnerability_id: str
    attack_type: str
    target_policy_name: str
    bypass_count: int
    total_attack_count: int
    simulated_exposure: float
    key_evidence_summary: str


class VulnerabilityExplanation(BaseModel):
    summary: str
    why_the_policy_failed: str
    attack_mechanism: str
    key_signal_missed: str
    contributing_factors: List[str] = Field(default_factory=list)
    confidence: str = "HIGH"
