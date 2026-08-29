export type UUID = string

export type SeverityLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type RiskSeverity = SeverityLevel

export type PolicyStatus = 'ACTIVE' | 'DRAFT' | 'SUPERSEDED' | 'ARCHIVED'

export type SimulationStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type RiskDecisionOutcome = 'BLOCKED' | 'FLAGGED' | 'ALLOWED' | 'PARTIALLY_DETECTED'

export type PatchStatus = 'PENDING_SIMULATION' | 'SIMULATED' | 'APPROVED' | 'REJECTED'

export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'MITIGATED' | 'RESOLVED' | 'DISMISSED'

export type DatasetSplitType = 'development' | 'validation' | 'held_out'
export type DatasetSplit = 'DEV_SET' | 'VALIDATION_SET' | 'HELD_OUT_TEST_SET' | 'ALL' | DatasetSplitType

export interface PaginationParams {
  page: number
  pageSize: number
  total?: number
}

export interface DateRange {
  from: string
  to: string
}
