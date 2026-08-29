import { SeverityLevel } from './common'

export interface PolicyScopeContext {
  policyId: string
  policyName: string
  versionNumber: string
  versionId?: string
  evaluationId?: string
  evaluationType?: string
  datasetId?: string
  seed?: number
  lastEvaluated?: string
  isEvaluated: boolean
}

export interface DashboardMetrics {
  policyCoverage: number
  activeVulnerabilities: number
  attackSuccessRate: number
  simulatedExposure: number
  detectionRecall: number
  falsePositiveRate: number
  simulationsRunCount: number
  attacksDetectedCount: number
  policyBypassesCount: number
  riskPostureScore?: number | null // 0-100 (higher is more resilient)
  isEvaluated: boolean
}

export interface RiskTrendPoint {
  date: string
  recall: number
  fpr: number
  bypasses: number
  exposure: number
}

export interface AttackVectorDistribution {
  name: string
  attacksCount: number
  bypassesCount: number
  exposureAmount: number
  severity: SeverityLevel
}

export interface PolicyEffectivenessPoint {
  policyName: string
  coverage: number
  recall: number
  fpr: number
}
