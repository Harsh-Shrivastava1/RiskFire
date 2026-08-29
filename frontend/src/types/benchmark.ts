import { DatasetSplitType, UUID } from './common'

export interface PolicyRuleChange {
  ruleType: string
  operation: 'ADD' | 'MODIFY' | 'REMOVE'
  currentValue?: any
  proposedValue: any
  rationale: string
}

export interface BenchmarkMetrics {
  totalTransactions: number
  totalAdversarial: number
  totalLegitimate: number
  truePositives: number
  trueNegatives: number
  falsePositives: number
  falseNegatives: number
  precision: number
  recall: number
  f1Score: number
  falsePositiveRate: number
  attackSuccessRate: number
  successfulBypasses: number
  simulatedExposure: number
  exposureReduction?: number
  customerFrictionScore: number
  policyCoverage: number
  simulationThroughput: number
}

export interface BenchmarkRun {
  id: UUID
  simulationId: UUID
  policyId: UUID
  policyName: string
  policyVersionNumber: string
  datasetSplit: DatasetSplitType
  status: 'COMPLETED' | 'RUNNING' | 'FAILED'
  metrics: BenchmarkMetrics
  isHeldOutIsolated: boolean
  executedAt: string
}

export interface BenchmarkComparison {
  id: UUID
  patchId: UUID
  baselineVersion: string
  patchedVersion: string
  datasetSplit: DatasetSplitType
  before: BenchmarkMetrics
  after: BenchmarkMetrics
  deltaRecall: number
  deltaPrecision: number
  deltaFpr: number
  deltaExposure: number
  netImprovementScore: number
  isRegression: boolean
  recommendation: 'APPROVE_PATCH' | 'MANUAL_REVIEW_REQUIRED' | 'REJECT_PATCH'
}

export interface PolicyComparisonRequest {
  policy_a_id: string
  policy_a_version_id?: string
  policy_b_id: string
  policy_b_version_id?: string
  seed?: number
  dataset_id?: string
  dataset_split?: DatasetSplitType
}

export interface ScenarioPolicyResult {
  policy_id: string
  policy_name: string
  version_number: string
  passed: boolean
  adversarial_count: number
  legitimate_count: number
  detected_count: number
  bypasses_count: number
  simulated_exposure: number
  recall: number
  false_positive_rate: number
  attack_success_rate: number
  triggered_rules: string[]
}

export interface ScenarioComparisonItem {
  scenario_id: string
  scenario_name: string
  attack_type: string
  description: string
  policy_a: ScenarioPolicyResult
  policy_b: ScenarioPolicyResult
}

export interface FairnessVerification {
  dataset_id: string
  dataset_split: string
  seed: number
  total_workload_transactions: number
  canonical_scenarios_count: number
  scenarios_hash: string
  is_fair_comparison: boolean
  fairness_status: string
  mismatch_reason?: string
}

export interface PolicyComparisonReport {
  comparison_id: string
  policy_a_id: string
  policy_a_name: string
  policy_a_version: string
  policy_b_id: string
  policy_b_name: string
  policy_b_version: string
  dataset_id: string
  dataset_split: DatasetSplitType
  seed: number
  fairness: FairnessVerification
  policy_a_metrics: BenchmarkMetrics
  policy_b_metrics: BenchmarkMetrics
  policy_a_scenarios_passed: number
  policy_b_scenarios_passed: number
  total_scenarios_evaluated: number
  delta_recall: number
  delta_fpr: number
  delta_precision: number
  delta_bypasses: number
  delta_exposure: number
  net_improvement_score: number
  recommendation: 'RECOMMEND_POLICY_A' | 'RECOMMEND_POLICY_B' | 'MANUAL_REVIEW_REQUIRED' | 'NO_CLEAR_WINNER' | 'NOT_DIRECTLY_COMPARABLE'
  recommendation_reason: string
  security_gain_summary: string
  operational_tradeoff_summary: string
  exposure_reduction_summary: string
  scenarios: ScenarioComparisonItem[]
  created_at: string
}

