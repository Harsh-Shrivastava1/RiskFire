import { DashboardMetrics, RiskTrendPoint, AttackVectorDistribution, PolicyEffectivenessPoint } from '@/types'

export const mockDashboardMetrics: DashboardMetrics = {
  policyCoverage: 78.4,
  activeVulnerabilities: 4,
  attackSuccessRate: 18.6,
  simulatedExposure: 1840000, // ₹18.4L
  detectionRecall: 81.4,
  falsePositiveRate: 4.8,
  simulationsRunCount: 142,
  attacksDetectedCount: 3840,
  policyBypassesCount: 714,
  riskPostureScore: 74,
  isEvaluated: true,
}

export const mockRiskTrend: RiskTrendPoint[] = [
  { date: 'Aug 14', recall: 68.2, fpr: 6.4, bypasses: 142, exposure: 2450000 },
  { date: 'Aug 15', recall: 71.0, fpr: 5.9, bypasses: 128, exposure: 2120000 },
  { date: 'Aug 16', recall: 74.5, fpr: 5.4, bypasses: 110, exposure: 1980000 },
  { date: 'Aug 17', recall: 76.8, fpr: 5.1, bypasses: 98, exposure: 1840000 },
  { date: 'Aug 18', recall: 79.2, fpr: 4.9, bypasses: 84, exposure: 1620000 },
  { date: 'Aug 19', recall: 80.5, fpr: 4.8, bypasses: 78, exposure: 1540000 },
  { date: 'Aug 20', recall: 81.4, fpr: 4.8, bypasses: 74, exposure: 1840000 },
]

export const mockAttackVectors: AttackVectorDistribution[] = [
  {
    name: 'Distributed Velocity Bypass',
    attacksCount: 840,
    bypassesCount: 284,
    exposureAmount: 890000,
    severity: 'CRITICAL',
  },
  {
    name: 'Identity Fragmentation Cluster',
    attacksCount: 620,
    bypassesCount: 196,
    exposureAmount: 540000,
    severity: 'HIGH',
  },
  {
    name: 'Payment Instrument Rotation',
    attacksCount: 510,
    bypassesCount: 112,
    exposureAmount: 260000,
    severity: 'HIGH',
  },
  {
    name: 'Refund Window Exploit',
    attacksCount: 340,
    bypassesCount: 82,
    exposureAmount: 110000,
    severity: 'MEDIUM',
  },
  {
    name: 'Promotion Referral Farming',
    attacksCount: 290,
    bypassesCount: 40,
    exposureAmount: 40000,
    severity: 'LOW',
  },
]

export const mockPolicyEffectiveness: PolicyEffectivenessPoint[] = [
  { policyName: 'POL-VELOCITY-001 (Account Velocity)', coverage: 68.5, recall: 65.2, fpr: 4.1 },
  { policyName: 'POL-AMOUNT-002 (High Value Burst)', coverage: 89.2, recall: 88.0, fpr: 3.2 },
  { policyName: 'POL-IDENTITY-003 (Device & IP Bound)', coverage: 76.4, recall: 74.8, fpr: 5.6 },
  { policyName: 'POL-INSTRUMENT-004 (Card Reuse Limits)', coverage: 82.1, recall: 80.4, fpr: 4.9 },
  { policyName: 'POL-REFUND-005 (Post-Delivery Window)', coverage: 77.0, recall: 73.5, fpr: 6.2 },
]
