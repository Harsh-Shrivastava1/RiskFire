import { BenchmarkComparison, BenchmarkRun } from '@/types'

export const mockBenchmarkRuns: BenchmarkRun[] = [
  {
    id: 'bench-001',
    simulationId: 'sim-142',
    policyId: 'pol-001',
    policyName: 'POL-VELOCITY-001 (Account Velocity Baseline)',
    policyVersionNumber: 'v1.2 (Baseline)',
    datasetSplit: 'held_out',
    status: 'COMPLETED',
    isHeldOutIsolated: true,
    executedAt: '2026-08-20T11:30:00Z',
    metrics: {
      totalTransactions: 1200,
      totalAdversarial: 300,
      totalLegitimate: 900,
      truePositives: 231,
      trueNegatives: 857,
      falsePositives: 43,
      falseNegatives: 69,
      precision: 0.843,
      recall: 0.770,
      f1Score: 0.805,
      falsePositiveRate: 0.048,
      attackSuccessRate: 0.230,
      successfulBypasses: 69,
      simulatedExposure: 442000,
      customerFrictionScore: 0.048,
      policyCoverage: 0.770,
      simulationThroughput: 420.5,
    },
  },
  {
    id: 'bench-002',
    simulationId: 'sim-142-replay',
    policyId: 'pol-001',
    policyName: 'POL-VELOCITY-001 (Patched v1.3)',
    policyVersionNumber: 'v1.3 (Patched)',
    datasetSplit: 'held_out',
    status: 'COMPLETED',
    isHeldOutIsolated: true,
    executedAt: '2026-08-20T11:45:00Z',
    metrics: {
      totalTransactions: 1200,
      totalAdversarial: 300,
      totalLegitimate: 900,
      truePositives: 282,
      trueNegatives: 853,
      falsePositives: 47,
      falseNegatives: 18,
      precision: 0.857,
      recall: 0.940,
      f1Score: 0.897,
      falsePositiveRate: 0.052,
      attackSuccessRate: 0.060,
      successfulBypasses: 18,
      simulatedExposure: 115000,
      exposureReduction: 327000,
      customerFrictionScore: 0.052,
      policyCoverage: 0.940,
      simulationThroughput: 415.0,
    },
  },
]

export const mockBenchmarkComparison: BenchmarkComparison = {
  id: 'cmp-001',
  patchId: 'patch-001',
  baselineVersion: 'v1.2 (Baseline)',
  patchedVersion: 'v1.3 (Patched Proposal)',
  datasetSplit: 'held_out',
  before: mockBenchmarkRuns[0].metrics,
  after: mockBenchmarkRuns[1].metrics,
  deltaRecall: 0.170, // +17.0%
  deltaPrecision: 0.014, // +1.4%
  deltaFpr: 0.004, // +0.4%
  deltaExposure: -327000, // -₹3.27L
  netImprovementScore: 16.6, // deltaRecall - deltaFpr
  isRegression: false,
  recommendation: 'APPROVE_PATCH',
}
