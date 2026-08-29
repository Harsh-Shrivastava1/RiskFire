import { UUID } from './common'

export type AuditAction =
  | 'SIMULATION_STARTED'
  | 'SIMULATION_COMPLETED'
  | 'ATTACK_PLAN_GENERATED'
  | 'ATTACK_PLAN_VALIDATED'
  | 'BYPASS_DETECTED'
  | 'VULNERABILITY_DISCOVERED'
  | 'EXPLANATION_GENERATED'
  | 'PATCH_GENERATED'
  | 'PATCH_VALIDATED'
  | 'PATCH_SIMULATED'
  | 'PATCH_APPROVED'
  | 'PATCH_REJECTED'
  | 'POLICY_CREATED'
  | 'POLICY_VERSION_DEPLOYED'
  | 'BENCHMARK_EXECUTED'
  | 'USER_LOGIN'

export interface AuditLogEntry {
  id: UUID
  timestamp: string
  action: AuditAction
  actorType: 'USER' | 'SYSTEM' | 'AI_AGENT'
  actorName: string
  entityType: 'POLICY' | 'SIMULATION' | 'VULNERABILITY' | 'PATCH' | 'BENCHMARK' | 'DATASET'
  entityId: UUID
  entityName: string
  status: 'SUCCESS' | 'WARNING' | 'FAILED' | 'REJECTED'
  details: Record<string, any>
  ipAddress?: string
}
