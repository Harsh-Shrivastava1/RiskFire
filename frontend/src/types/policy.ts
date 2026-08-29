import { PolicyStatus, UUID } from './common'

export type PolicyCategory = 
  | 'VELOCITY'
  | 'AMOUNT'
  | 'IDENTITY'
  | 'PAYMENT_INSTRUMENT'
  | 'REFUNDS'
  | 'PROMOTIONS'
  | 'BEHAVIORAL'

export type PolicyRuleType =
  | 'VELOCITY_ACCOUNT'
  | 'VELOCITY_DEVICE'
  | 'VELOCITY_INSTRUMENT'
  | 'VELOCITY_ADDRESS'
  | 'VELOCITY_IP'
  | 'AMOUNT_MAX'
  | 'AMOUNT_DAILY'
  | 'AMOUNT_WEEKLY'
  | 'IDENTITY_ACCOUNT_AGE'
  | 'IDENTITY_DEVICE_COUNT'
  | 'IDENTITY_IP_CHANGES'
  | 'IDENTITY_ADDRESS_REUSE'
  | 'INSTRUMENT_CARDS_PER_ACCOUNT'
  | 'INSTRUMENT_ACCOUNTS_PER_CARD'
  | 'INSTRUMENT_REUSE'
  | 'REFUND_FREQUENCY'
  | 'REFUND_RATIO'
  | 'REFUND_THRESHOLD'
  | 'PROMOTION_COUPON'
  | 'PROMOTION_REFERRAL'
  | 'PROMOTION_NEW_USER'
  | 'BEHAVIOR_RAPID_SWITCH'
  | 'BEHAVIOR_CHECKOUT_FAILURES'
  | 'BEHAVIOR_BURST'
  | 'BEHAVIOR_UNUSUAL_SEQUENCE'

export type RuleAction = 'BLOCK' | 'FLAG' | 'MONITOR'

export interface PolicyRule {
  id: UUID
  policyVersionId: UUID
  name: string
  ruleType: PolicyRuleType
  category: PolicyCategory
  parameters: Record<string, any>
  action: RuleAction
  isEnabled: boolean
  sequenceOrder: number
  description?: string
}

export interface PolicyVersion {
  id: UUID
  policyId: UUID
  versionNumber: string
  status: PolicyStatus
  rules: PolicyRule[]
  createdAt: string
  createdBy: string
  notes?: string
  effectivenessScore?: number
  attackCoverageScore?: number
}

export interface RiskPolicy {
  id: UUID
  merchantId: UUID
  name: string
  description: string
  category: PolicyCategory
  isActive: boolean
  currentVersionNumber: string
  currentVersionId: UUID
  ruleCount: number
  coverageRate: number // 0-100%
  effectivenessRate: number // 0-100%
  lastUpdated: string
  versions?: PolicyVersion[]
}
