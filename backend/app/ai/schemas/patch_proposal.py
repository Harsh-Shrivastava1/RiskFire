from typing import List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.patch import PolicyRuleModificationSchema


class PatchProposalInput(BaseModel):
    vulnerability_id: str
    vulnerability_title: str
    why_failed: str
    current_policy_id: str
    current_policy_name: str
    simulated_exposure: float


class PatchProposal(BaseModel):
    target_policy_id: str
    identified_weakness: str
    proposed_changes: List[PolicyRuleModificationSchema] = Field(default_factory=list)
    reasoning: str
    expected_benefit: str
    expected_fpr_impact: str
    expected_customer_friction: str
    confidence: str = "HIGH"
