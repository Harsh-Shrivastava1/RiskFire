from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, ConfigDict
from backend.app.schemas.vulnerability import VulnerabilityResponse
from backend.app.schemas.simulation import SimulationRunResponse
from backend.app.schemas.incident import IncidentResponse


class PolicyScopeContext(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    policy_id: str = Field(serialization_alias="policyId", alias="policyId")
    policy_name: str = Field(serialization_alias="policyName", alias="policyName")
    version_number: str = Field(serialization_alias="versionNumber", alias="versionNumber")
    version_id: Optional[str] = Field(None, serialization_alias="versionId", alias="versionId")
    evaluation_id: Optional[str] = Field(None, serialization_alias="evaluationId", alias="evaluationId")
    evaluation_type: Optional[str] = Field(None, serialization_alias="evaluationType", alias="evaluationType")
    dataset_id: Optional[str] = Field("ds-synthetic-v1", serialization_alias="datasetId", alias="datasetId")
    seed: Optional[int] = Field(49201, serialization_alias="seed", alias="seed")
    last_evaluated: Optional[str] = Field(None, serialization_alias="lastEvaluated", alias="lastEvaluated")
    is_evaluated: bool = Field(True, serialization_alias="isEvaluated", alias="isEvaluated")


class DashboardMetricsResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    policy_coverage: float = Field(serialization_alias="policyCoverage", alias="policyCoverage")
    active_vulnerabilities: int = Field(serialization_alias="activeVulnerabilities", alias="activeVulnerabilities")
    attack_success_rate: float = Field(serialization_alias="attackSuccessRate", alias="attackSuccessRate")
    simulated_exposure: float = Field(serialization_alias="simulatedExposure", alias="simulatedExposure")
    detection_recall: float = Field(serialization_alias="detectionRecall", alias="detectionRecall")
    false_positive_rate: float = Field(serialization_alias="falsePositiveRate", alias="falsePositiveRate")
    simulations_run_count: int = Field(serialization_alias="simulationsRunCount", alias="simulationsRunCount")
    attacks_detected_count: int = Field(serialization_alias="attacksDetectedCount", alias="attacksDetectedCount")
    policy_bypasses_count: int = Field(serialization_alias="policyBypassesCount", alias="policyBypassesCount")
    risk_posture_score: Optional[int] = Field(None, serialization_alias="riskPostureScore", alias="riskPostureScore")
    is_evaluated: bool = Field(True, serialization_alias="isEvaluated", alias="isEvaluated")


class RiskTrendPoint(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    date: str
    risk_score: int = Field(serialization_alias="riskScore", alias="riskScore")
    attacks_simulated: int = Field(serialization_alias="attacksSimulated", alias="attacksSimulated")
    bypasses_detected: int = Field(serialization_alias="bypassesDetected", alias="bypassesDetected")


class AttackVectorDistributionItem(BaseModel):
    vector: str
    count: int
    percentage: float
    exposure: float


class PolicyEffectivenessItem(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    policy_name: str = Field(serialization_alias="policyName", alias="policyName")
    coverage_rate: float = Field(serialization_alias="coverageRate", alias="coverageRate")
    bypasses_prevented: int = Field(serialization_alias="bypassesPrevented", alias="bypassesPrevented")
    bypasses_allowed: int = Field(serialization_alias="bypassesAllowed", alias="bypassesAllowed")


class DashboardSummaryResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    policy_scope: PolicyScopeContext = Field(serialization_alias="policyScope", alias="policyScope")
    metrics: DashboardMetricsResponse
    risk_trend: List[RiskTrendPoint] = Field(serialization_alias="riskTrend", alias="riskTrend")
    attack_vectors: List[AttackVectorDistributionItem] = Field(serialization_alias="attackVectors", alias="attackVectors")
    policy_effectiveness: List[PolicyEffectivenessItem] = Field(serialization_alias="policyEffectiveness", alias="policyEffectiveness")
    top_vulnerabilities: List[VulnerabilityResponse] = Field(serialization_alias="topVulnerabilities", alias="topVulnerabilities")
    recent_simulations: List[SimulationRunResponse] = Field(serialization_alias="recentSimulations", alias="recentSimulations")
    active_incidents: List[IncidentResponse] = Field(serialization_alias="activeIncidents", alias="activeIncidents")
