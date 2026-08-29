import { SimulationStatus, UUID } from './common'
import { AttackAgentType, AttackDifficulty } from './attack'

export interface SimulationConfig {
  merchantId: UUID
  policyVersionId: UUID
  seed?: number
  legitimateCustomerCount: number
  adversarialActorCount: number
  legitimateTransactionCount: number
  attackTransactionCount: number
  simDurationHours: number
  attackTypes: AttackAgentType[]
  difficulty: AttackDifficulty
  minTransactionAmount: number
  maxTransactionAmount: number
}

export interface SimulationRun {
  id: UUID
  merchantId: UUID
  policyVersionId: UUID
  policyName: string
  policyVersionNumber: string
  seed: number
  status: SimulationStatus
  runType: 'MANUAL' | 'FIRE_DRILL' | 'REPLAY' | 'BENCHMARK'
  startedAt: string
  completedAt?: string
  durationSeconds?: number
  totalTransactions: number
  legitimateTransactionsCount: number
  attackTransactionsCount: number
  attacksAttempted: number
  bypassesFound: number
  simulatedExposure: number
  detectionRecall: number
  falsePositiveRate: number
  eventsProcessed: number
  activeAgents: AttackAgentType[]
  errorMessage?: string
}

export interface SimulationEvent {
  id: UUID
  simulationId: UUID
  eventType: 
    | 'SIMULATION_STARTED'
    | 'ENTITY_POOL_CREATED'
    | 'ATTACK_STEP_EXECUTED'
    | 'TRANSACTION_EVALUATED'
    | 'BYPASS_DETECTED'
    | 'VULNERABILITY_IDENTIFIED'
    | 'SIMULATION_COMPLETED'
    | 'SIMULATION_FAILED'
  sequenceNum: number
  timestamp: string
  simTimestamp: string
  message: string
  metadata?: Record<string, any>
}
