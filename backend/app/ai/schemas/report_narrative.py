from typing import List, Optional
from pydantic import BaseModel, Field


class ReportNarrativeInput(BaseModel):
    simulation_id: str
    merchant_name: str
    policy_name: str
    total_transactions: int
    bypasses_found: int
    simulated_exposure: float
    detection_recall: float
    false_positive_rate: float
    vulnerabilities_summary: List[str]


class ReportNarrative(BaseModel):
    executive_summary: str
    risk_posture_assessment: str
    key_findings_summary: List[str] = Field(default_factory=list)
    recommended_actions: List[str] = Field(default_factory=list)
    methodology_note: str
    disclaimer: str
