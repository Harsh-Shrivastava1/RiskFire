import { DatasetSplitType, PatchStatus, SeverityLevel, UUID } from './common'

export interface PolicyRuleModification {
  ruleType: string
  operation: 'ADD' | 'MODIFY' | 'REMOVE'
  currentRuleText?: string
  proposedRuleText: string
  rationale: string
}

export interface MetricDeltaItem {
  before: number
  after: number
  delta: number
}

export interface BeforeAfterMetrics {
  precision: MetricDeltaItem
  recall: MetricDeltaItem
  f1: MetricDeltaItem
  falsePositiveRate: MetricDeltaItem
  attackSuccessRate: MetricDeltaItem
  bypassesCount: MetricDeltaItem
  simulatedExposure: MetricDeltaItem
  customerFrictionImpact: 'LOW' | 'NEUTRAL' | 'SLIGHT_INCREASE'
}

export interface PatchDecisionEvaluation {
  decision: 'APPROVE_PATCH' | 'REJECT_PATCH' | 'MANUAL_REVIEW_REQUIRED'
  recommendationTitle: string
  recommendationSummary: string
  reasons: string[]
  securityImprovements: string[]
  operationalRegressions: string[]
  tradeOffSummary: string
  metricsConsidered: Record<string, any>
  thresholdsApplied: Record<string, any>
  evaluatedAt: string
  candidateChecksum: string
  datasetSplit: string
  isHeldOutEvaluated: boolean
}

export interface ScenarioMetricItem {
  scenarioId: string
  scenarioName: string
  totalTransactions: number
  adversarialTransactions: number
  baselineRecall: number
  candidateRecall: number
  deltaRecall: number
  baselineBypasses: number
  candidateBypasses: number
  simulatedExposure: number
  attackSuccessRate: number
  status: string
}

export interface PolicyPatch {
  id: UUID
  vulnerabilityId: UUID
  vulnerabilityTitle: string
  vulnerabilitySeverity: SeverityLevel
  sourcePolicyId: UUID
  sourcePolicyName: string
  sourcePolicyVersion: string
  targetPolicyVersion: string
  status: PatchStatus
  identifiedWeakness: string
  proposedChanges: PolicyRuleModification[]
  aiReasoning: string
  expectedRiskReduction: string
  expectedFprImpact: string
  expectedCustomerFriction: string
  validationStatus: 'AWAITING_VALIDATION' | 'VALIDATED' | 'REJECTED' | 'APPROVED'
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  metricsComparison?: BeforeAfterMetrics
  decisionEvaluation?: PatchDecisionEvaluation
  candidateId?: string
  candidateChecksum?: string
  benchmarkReportId?: string
  iterationIndex: number
  parentPatchId?: string
  scenarioResults?: ScenarioMetricItem[]
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
}

