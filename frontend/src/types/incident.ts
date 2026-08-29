import { IncidentStatus, SeverityLevel, UUID } from './common'

export interface IncidentTimelineEvent {
  id: UUID
  timestamp: string
  title: string
  description: string
  actor: string
  type: 'DETECTION' | 'SIMULATION' | 'INVESTIGATION' | 'PATCH' | 'STATUS_CHANGE'
}

export interface Incident {
  id: UUID
  incidentNumber: string
  title: string
  severity: SeverityLevel
  status: IncidentStatus
  affectedPolicyId: UUID
  affectedPolicyName: string
  vulnerabilityId?: UUID
  vulnerabilityTitle?: string
  simulationId?: UUID
  simulatedExposure: number
  bypassesCount: number
  detectedAt: string
  owner: string
  summary: string
  timeline: IncidentTimelineEvent[]
}
