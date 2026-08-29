import { UUID } from './common'

export interface ReportFinding {
  id: string
  title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  affectedPolicy: string
  exposureEstimate: number
  description: string
  remediationStatus: 'PATCH_AVAILABLE' | 'UNDER_REVIEW' | 'RESOLVED'
}

export interface ExecutiveReport {
  id: UUID
  reportNumber: string
  title: string
  createdAt: string
  simulationId: UUID
  policyVersionTested: string
  author: string
  status: 'FINAL' | 'DRAFT'
  riskPostureScore: number // 0-100
  executiveSummary: string
  keyFindings: ReportFinding[]
  topVulnerabilitiesCount: number
  totalSimulatedExposure: number
  overallPolicyRecall: number
  overallFpr: number
  recommendedActions: string[]
  methodologyDisclaimer: string
}
