import { UUID } from './common'

export type AttackAgentType =
  | 'VELOCITY_ATTACKER'
  | 'IDENTITY_FRAGMENTER'
  | 'REFUND_ABUSER'
  | 'PROMOTION_ABUSER'
  | 'PAYMENT_ROTATOR'
  | 'COORDINATED_CLUSTER'

export type AttackDifficulty = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXPERT'

export type AttackerObjective =
  | 'BYPASS_ACCOUNT_VELOCITY'
  | 'BYPASS_DEVICE_FINGERPRINT'
  | 'EXPLOIT_REFUND_WINDOW'
  | 'FARM_NEW_USER_PROMOTIONS'
  | 'ROTATE_PAYMENT_INSTRUMENTS'
  | 'COORDINATED_SYNDICATE_DRAIN'

export interface AttackAgent {
  id: UUID
  type: AttackAgentType
  name: string
  description: string
  targetPolicies: string[]
  evasionTactics: string[]
  severityPotential: 'CRITICAL' | 'HIGH' | 'MEDIUM'
  iconName: string
}

export interface AttackStep {
  id: UUID
  sequenceNumber: number
  actorAccountId: UUID
  deviceId: UUID
  ipId: UUID
  addressId: UUID
  paymentInstrumentId: UUID
  actionType: 'TRANSACT' | 'REFUND' | 'APPLY_PROMO' | 'SWITCH_ACCOUNT'
  amount: number
  simTimestamp: string
  status: 'EXECUTED' | 'BLOCKED' | 'FLAGGED'
}

export interface AttackScenario {
  id: UUID
  simulationId: UUID
  agentType: AttackAgentType
  name: string
  objective: string
  targetPolicyId: string
  targetPolicyName: string
  actorsCount: number
  sharedDevice: boolean
  sharedAddress: boolean
  sharedIp: boolean
  transactionCount: number
  durationMinutes: number
  steps: AttackStep[]
  status: 'PENDING' | 'EXECUTING' | 'SUCCESSFUL' | 'BLOCKED' | 'PARTIAL'
  bypassCount: number
  exposureGenerated: number
  reasoning?: string
}
