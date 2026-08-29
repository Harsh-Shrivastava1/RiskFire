from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import PatchStatus, SeverityLevel, DatasetSplitType
from backend.app.schemas.benchmark import CandidatePolicySnapshot, ScenarioMetricResult


class MetricDelta(BaseModel):
    before: float
    after: float
    delta: float


class BeforeAfterMetricsSchema(BaseModel):
    precision: MetricDelta
    recall: MetricDelta
    f1: MetricDelta
    false_positive_rate: MetricDelta
    attack_success_rate: MetricDelta
    bypasses_count: MetricDelta
    simulated_exposure: MetricDelta
    customer_friction_impact: str = "LOW"


class PolicyRuleModificationSchema(BaseModel):
    rule_type: str
    operation: str  # "ADD" | "MODIFY" | "REMOVE"
    current_rule_text: Optional[str] = None
    proposed_rule_text: str
    rationale: str


class PatchDecisionEvaluation(BaseModel):
    decision: str  # "APPROVE_PATCH" | "REJECT_PATCH" | "MANUAL_REVIEW_REQUIRED"
    recommendation_title: str
    recommendation_summary: str
    reasons: List[str] = Field(default_factory=list)
    security_improvements: List[str] = Field(default_factory=list)
    operational_regressions: List[str] = Field(default_factory=list)
    trade_off_summary: str
    metrics_considered: Dict[str, Any] = Field(default_factory=dict)
    thresholds_applied: Dict[str, Any] = Field(default_factory=dict)
    evaluated_at: str
    candidate_checksum: str
    dataset_split: str
    is_held_out_evaluated: bool


class PatchApproveRequest(BaseModel):
    notes: Optional[str] = None


class PatchRejectRequest(BaseModel):
    reason: str


class PatchIterateRequest(BaseModel):
    feedback_notes: Optional[str] = None
    target_split: DatasetSplitType = DatasetSplitType.HELD_OUT


class PatchResponse(BaseModel):
    id: str
    vulnerability_id: str
    vulnerability_title: str
    vulnerability_severity: SeverityLevel
    source_policy_id: str
    source_policy_name: str
    source_policy_version: str
    target_policy_version: str
    status: PatchStatus
    identified_weakness: str
    proposed_changes: List[PolicyRuleModificationSchema] = Field(default_factory=list)
    ai_reasoning: str
    expected_risk_reduction: str
    expected_fpr_impact: str
    expected_customer_friction: str
    validation_status: str  # "AWAITING_VALIDATION" | "VALIDATED" | "REJECTED" | "APPROVED"
    confidence: str  # "HIGH" | "MEDIUM" | "LOW"
    metrics_comparison: Optional[BeforeAfterMetricsSchema] = None
    decision_evaluation: Optional[PatchDecisionEvaluation] = None
    candidate_id: Optional[str] = None
    candidate_checksum: Optional[str] = None
    candidate_snapshot: Optional[CandidatePolicySnapshot] = None
    benchmark_report_id: Optional[str] = None
    iteration_index: int = 1
    parent_patch_id: Optional[str] = None
    scenario_results: Optional[List[ScenarioMetricResult]] = None
    created_at: str
    reviewed_at: Optional[str] = None
    reviewed_by: Optional[str] = None
    rejection_reason: Optional[str] = None

