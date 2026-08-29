from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from backend.app.schemas.common import DatasetSplitType
from backend.app.schemas.policy import PolicyRuleSchema


class BenchmarkState(str, Enum):
    CREATED = "CREATED"
    DEVELOPMENT_EVALUATION = "DEVELOPMENT_EVALUATION"
    VALIDATION_EVALUATION = "VALIDATION_EVALUATION"
    CANDIDATE_FROZEN = "CANDIDATE_FROZEN"
    HELD_OUT_EVALUATION = "HELD_OUT_EVALUATION"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    INTEGRITY_ERROR = "INTEGRITY_ERROR"
    ISOLATION_ERROR = "ISOLATION_ERROR"


class BenchmarkMetricsSchema(BaseModel):
    total_transactions: int
    total_adversarial: int
    total_legitimate: int
    true_positives: int
    true_negatives: int
    false_positives: int
    false_negatives: int
    precision: float
    recall: float
    f1_score: float
    false_positive_rate: float
    attack_success_rate: float
    successful_bypasses: int
    simulated_exposure: float
    exposure_reduction: Optional[float] = None
    customer_friction_score: float
    policy_coverage: float
    simulation_throughput: float


class CandidatePolicySnapshot(BaseModel):
    candidate_id: str
    baseline_policy_id: str
    baseline_policy_name: str
    baseline_version: str
    candidate_version: str
    rules: List[PolicyRuleSchema]
    candidate_checksum: str
    source_vulnerability_id: Optional[str] = None
    ai_proposal_id: Optional[str] = None
    development_metrics: Optional[BenchmarkMetricsSchema] = None
    validation_metrics: Optional[BenchmarkMetricsSchema] = None
    is_frozen: bool = True
    frozen_at: str


class ScenarioMetricResult(BaseModel):
    scenario_id: str
    scenario_name: str
    attack_type: str
    total_transactions: int
    adversarial_count: int
    legitimate_count: int
    bypasses_count: int
    intercepted_count: int
    simulated_exposure: float
    recall: float
    false_positive_rate: float
    attack_success_rate: float
    status: str = "COMPLETED"  # "COMPLETED" | "FAILED"


class BenchmarkRunResponse(BaseModel):
    id: str
    simulation_id: str
    policy_id: str
    policy_name: str
    policy_version_number: str
    dataset_split: DatasetSplitType
    status: str  # "COMPLETED" | "RUNNING" | "FAILED"
    metrics: BenchmarkMetricsSchema
    is_held_out_isolated: bool
    executed_at: str


class BenchmarkComparisonResponse(BaseModel):
    id: str
    patch_id: str
    baseline_version: str
    patched_version: str
    dataset_split: DatasetSplitType
    before: BenchmarkMetricsSchema
    after: BenchmarkMetricsSchema
    delta_recall: float
    delta_precision: float
    delta_fpr: float
    delta_exposure: float
    net_improvement_score: float
    is_regression: bool
    recommendation: str  # "APPROVE_PATCH" | "MANUAL_REVIEW_REQUIRED" | "REJECT_PATCH"


class BatchBenchmarkReportSchema(BaseModel):
    benchmark_id: str
    dataset_id: str
    seed: int
    dataset_split: DatasetSplitType
    state: BenchmarkState
    candidate_snapshot: Optional[CandidatePolicySnapshot] = None
    scenarios_evaluated_count: int
    total_transactions_evaluated: int
    scenario_results: List[ScenarioMetricResult] = Field(default_factory=list)
    baseline_metrics: BenchmarkMetricsSchema
    candidate_metrics: Optional[BenchmarkMetricsSchema] = None
    comparison: Optional[BenchmarkComparisonResponse] = None
    integrity_status: str = "PASS"  # "PASS" | "INTEGRITY_VIOLATION"
    held_out_isolation_status: str = "PASS"  # "PASS" | "ISOLATION_VIOLATION"
    is_reproducible: bool = True
    created_at: str
    completed_at: Optional[str] = None
    engine_version: str = "1.0.0"
    schema_version: str = "1.0.0"


class DatasetFileManifest(BaseModel):
    split: str
    file_name: str
    file_path: str
    record_count: int
    sha256_hash: str
    byte_size: int


class DatasetManifestSchema(BaseModel):
    dataset_id: str
    generator_version: str = "1.0.0"
    schema_version: str = "1.0.0"
    seed: int
    total_records: int
    development_count: int
    validation_count: int
    held_out_count: int
    split_strategy: str = "70_15_15_DETERMINISTIC"
    files: List[DatasetFileManifest] = Field(default_factory=list)
    created_at: str


class PolicyComparisonRequest(BaseModel):
    policy_a_id: str
    policy_a_version_id: Optional[str] = None
    policy_b_id: str
    policy_b_version_id: Optional[str] = None
    seed: int = 49201
    dataset_id: str = "ds-synthetic-v1"
    dataset_split: DatasetSplitType = DatasetSplitType.HELD_OUT


class ScenarioPolicyResult(BaseModel):
    policy_id: str
    policy_name: str
    version_number: str
    passed: bool
    adversarial_count: int
    legitimate_count: int
    detected_count: int
    bypasses_count: int
    simulated_exposure: float
    recall: float
    false_positive_rate: float
    attack_success_rate: float
    triggered_rules: List[str] = Field(default_factory=list)


class ScenarioComparisonItem(BaseModel):
    scenario_id: str
    scenario_name: str
    attack_type: str
    description: str
    policy_a: ScenarioPolicyResult
    policy_b: ScenarioPolicyResult


class FairnessVerificationSchema(BaseModel):
    dataset_id: str
    dataset_split: str
    seed: int
    total_workload_transactions: int
    canonical_scenarios_count: int
    scenarios_hash: str
    is_fair_comparison: bool = True
    fairness_status: str = "VERIFIED"  # "VERIFIED" | "NOT_DIRECTLY_COMPARABLE"
    mismatch_reason: Optional[str] = None


class PolicyComparisonReportSchema(BaseModel):
    comparison_id: str
    policy_a_id: str
    policy_a_name: str
    policy_a_version: str
    policy_b_id: str
    policy_b_name: str
    policy_b_version: str
    dataset_id: str
    dataset_split: DatasetSplitType
    seed: int
    fairness: FairnessVerificationSchema
    policy_a_metrics: BenchmarkMetricsSchema
    policy_b_metrics: BenchmarkMetricsSchema
    policy_a_scenarios_passed: int
    policy_b_scenarios_passed: int
    total_scenarios_evaluated: int
    delta_recall: float  # B - A
    delta_fpr: float     # B - A
    delta_precision: float
    delta_bypasses: int  # A - B (positive means B had fewer bypasses)
    delta_exposure: float # A - B (positive means B reduced exposure)
    net_improvement_score: float
    recommendation: str  # "RECOMMEND_POLICY_A" | "RECOMMEND_POLICY_B" | "MANUAL_REVIEW_REQUIRED" | "NO_CLEAR_WINNER" | "NOT_DIRECTLY_COMPARABLE"
    recommendation_reason: str
    security_gain_summary: str
    operational_tradeoff_summary: str
    exposure_reduction_summary: str
    scenarios: List[ScenarioComparisonItem] = Field(default_factory=list)
    created_at: str


