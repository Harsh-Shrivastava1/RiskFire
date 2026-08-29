import {
  IDashboardRepository,
  IPolicyRepository,
  ISimulationRepository,
  IAttackRepository,
  IVulnerabilityRepository,
  IPatchRepository,
  IBenchmarkRepository,
  IIncidentRepository,
  IDatasetRepository,
  IAuditRepository,
  IReportRepository,
  IGraphRepository,
} from './types'
import {
  RiskPolicy,
  PolicyVersion,
  SimulationRun,
  SimulationEvent,
  AttackAgent,
  Vulnerability,
  PolicyPatch,
  BenchmarkRun,
  BenchmarkComparison,
  Incident,
  SyntheticDataset,
  AuditLogEntry,
  ExecutiveReport,
  AttackGraphData,
  DashboardMetrics,
  RiskTrendPoint,
  AttackVectorDistribution,
  PolicyEffectivenessPoint,
} from '@/types'

export class MockDashboardRepository implements IDashboardRepository {
  async getMetrics(_policyId?: string): Promise<DashboardMetrics> {
    return {
      policyCoverage: 88.5,
      activeVulnerabilities: 3,
      attackSuccessRate: 21.6,
      simulatedExposure: 1485000,
      detectionRecall: 78.4,
      falsePositiveRate: 0.12,
      simulationsRunCount: 42,
      attacksDetectedCount: 627,
      policyBypassesCount: 173,
      riskPostureScore: 74,
      isEvaluated: true,
    }
  }
  async getRiskTrend(_policyId?: string): Promise<RiskTrendPoint[]> {
    return []
  }
  async getAttackVectors(_policyId?: string): Promise<AttackVectorDistribution[]> {
    return []
  }
  async getPolicyEffectiveness(_policyId?: string): Promise<PolicyEffectivenessPoint[]> {
    return []
  }
  async getSummary(policyId?: string): Promise<any> {
    const metrics = await this.getMetrics(policyId)
    return {
      policyScope: {
        policyId: policyId || 'pol-vel-01',
        policyName: 'Core Merchant Velocity & High-Value Guard',
        versionNumber: 'v1.0.0',
        datasetId: 'ds-synthetic-v1',
        seed: 49201,
        isEvaluated: true,
      },
      metrics,
      riskTrend: [],
      attackVectors: [],
      policyEffectiveness: [],
      topVulnerabilities: [],
      recentSimulations: [],
      activeIncidents: [],
    }
  }
}

export class MockPolicyRepository implements IPolicyRepository {
  async getPolicies(): Promise<RiskPolicy[]> {
    return []
  }
  async getPolicyById(_id: string): Promise<RiskPolicy | null> {
    return null
  }
  async createPolicy(policy: Partial<RiskPolicy>): Promise<RiskPolicy> {
    return policy as RiskPolicy
  }
  async updatePolicy(_id: string, policy: Partial<RiskPolicy>): Promise<RiskPolicy> {
    return policy as RiskPolicy
  }
  async getPolicyVersions(_policyId: string): Promise<PolicyVersion[]> {
    return []
  }
}

export class MockSimulationRepository implements ISimulationRepository {
  async getSimulations(): Promise<SimulationRun[]> {
    return []
  }
  async getSimulationById(_id: string): Promise<SimulationRun | null> {
    return null
  }
  async getSimulationEvents(_simulationId: string): Promise<SimulationEvent[]> {
    return []
  }
  async triggerFireDrill(_policyVersionId: string): Promise<SimulationRun> {
    return {} as SimulationRun
  }
  async triggerSimulation(_config: any): Promise<SimulationRun> {
    return {} as SimulationRun
  }
}

export class MockAttackRepository implements IAttackRepository {
  async getAgents(): Promise<AttackAgent[]> {
    return []
  }
  async generateAttackPlan(_input: any): Promise<any> {
    return {}
  }
}

export class MockVulnerabilityRepository implements IVulnerabilityRepository {
  async getVulnerabilities(): Promise<Vulnerability[]> {
    return []
  }
  async getVulnerabilityById(_id: string): Promise<Vulnerability | null> {
    return null
  }
  async explainVulnerability(_vulnerabilityId: string): Promise<any> {
    return {}
  }
}

export class MockPatchRepository implements IPatchRepository {
  async getPatches(): Promise<PolicyPatch[]> {
    return []
  }
  async getPatchById(_id: string): Promise<PolicyPatch | null> {
    return null
  }
  async getPatchesForVulnerability(_vulnerabilityId: string): Promise<PolicyPatch[]> {
    return []
  }
  async generatePatch(_vulnerabilityId: string): Promise<PolicyPatch> {
    return {} as PolicyPatch
  }
  async simulatePatch(_patchId: string): Promise<PolicyPatch> {
    return {} as PolicyPatch
  }
  async evaluatePatch(_patchId: string, _split?: string, _seed?: number): Promise<PolicyPatch> {
    return {} as PolicyPatch
  }
  async iteratePatch(_patchId: string, _feedbackNotes?: string, _targetSplit?: string): Promise<PolicyPatch> {
    return {} as PolicyPatch
  }
  async approvePatch(_patchId: string, _notes?: string): Promise<PolicyPatch> {
    return {} as PolicyPatch
  }
  async rejectPatch(_patchId: string, _reason?: string): Promise<PolicyPatch> {
    return {} as PolicyPatch
  }
  async getPatchDecision(_patchId: string): Promise<any> {
    return null
  }
}

export class MockBenchmarkRepository implements IBenchmarkRepository {
  async getBenchmarkRuns(): Promise<BenchmarkRun[]> {
    return []
  }
  async getComparison(_patchId?: string): Promise<BenchmarkComparison> {
    return {} as BenchmarkComparison
  }
  async comparePolicies(_request: any): Promise<any> {
    return {} as any
  }
  async getPolicyComparison(_comparisonId: string): Promise<any> {
    return {} as any
  }
  async listPolicyComparisons(): Promise<any[]> {
    return []
  }
}

export class MockIncidentRepository implements IIncidentRepository {
  async getIncidents(): Promise<Incident[]> {
    return []
  }
  async getIncidentById(_id: string): Promise<Incident | null> {
    return null
  }
}

export class MockDatasetRepository implements IDatasetRepository {
  async getDatasets(): Promise<SyntheticDataset[]> {
    return []
  }
}

export class MockAuditRepository implements IAuditRepository {
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    return []
  }
}

export class MockReportRepository implements IReportRepository {
  async getReports(): Promise<ExecutiveReport[]> {
    return []
  }
  async getReportById(_id: string): Promise<ExecutiveReport | null> {
    return null
  }
  async generateReport(_request: { simulation_id?: string; title?: string }): Promise<ExecutiveReport> {
    return {} as ExecutiveReport
  }
}

export class MockGraphRepository implements IGraphRepository {
  async getAttackGraph(_simulationId?: string): Promise<AttackGraphData> {
    return { nodes: [], edges: [] }
  }
}
