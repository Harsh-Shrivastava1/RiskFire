from typing import List, Optional
from pydantic import BaseModel, Field


class ReportFindingSchema(BaseModel):
    id: str
    title: str
    severity: str
    affected_policy: str
    exposure_estimate: float
    description: str
    remediation_status: str


class ReportGenerateRequest(BaseModel):
    title: Optional[str] = None
    simulation_id: Optional[str] = None
    timeframe: Optional[str] = "Last 30 Days"


class ExecutiveReportResponse(BaseModel):
    id: str
    report_number: str
    title: str
    created_at: str
    simulation_id: str
    policy_version_tested: str
    author: str
    status: str  # "FINAL" | "DRAFT"
    risk_posture_score: int
    executive_summary: str
    key_findings: List[ReportFindingSchema] = Field(default_factory=list)
    top_vulnerabilities_count: int
    total_simulated_exposure: float
    overall_policy_recall: float
    overall_fpr: float
    recommended_actions: List[str] = Field(default_factory=list)
    methodology_disclaimer: str
