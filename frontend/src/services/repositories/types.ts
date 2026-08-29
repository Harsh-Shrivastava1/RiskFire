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
  PolicyComparisonRequest,
  PolicyComparisonReport,
  Incident,
  SyntheticDataset,
  AuditLogEntry,
  ExecutiveReport,
  AttackGraphData,
  DashboardMetrics,
  PolicyScopeContext,
  RiskTrendPoint,
  AttackVectorDistribution,
  PolicyEffectivenessPoint,
} from '@/types'

export interface IDashboardRepository {
  getMetrics(policyId?: string): Promise<DashboardMetrics>
  getRiskTrend(policyId?: string): Promise<RiskTrendPoint[]>
  getAttackVectors(policyId?: string): Promise<AttackVectorDistribution[]>
  getPolicyEffectiveness(policyId?: string): Promise<PolicyEffectivenessPoint[]>
  getSummary(policyId?: string): Promise<{
    policyScope: PolicyScopeContext
    metrics: DashboardMetrics
    riskTrend: RiskTrendPoint[]
    attackVectors: AttackVectorDistribution[]
    policyEffectiveness: PolicyEffectivenessPoint[]
    topVulnerabilities: Vulnerability[]
    recentSimulations: SimulationRun[]
    activeIncidents: Incident[]
  }>
}

export interface IPolicyRepository {
  getPolicies(): Promise<RiskPolicy[]>
  getPolicyById(id: string): Promise<RiskPolicy | null>
  createPolicy(policy: Partial<RiskPolicy>): Promise<RiskPolicy>
  updatePolicy(id: string, policy: Partial<RiskPolicy>): Promise<RiskPolicy>
  getPolicyVersions(policyId: string): Promise<PolicyVersion[]>
}

export interface ISimulationRepository {
  getSimulations(): Promise<SimulationRun[]>
  getSimulationById(id: string): Promise<SimulationRun | null>
  getSimulationEvents(simulationId: string): Promise<SimulationEvent[]>
  triggerFireDrill(policyId?: string): Promise<SimulationRun>
  triggerSimulation(config: any): Promise<SimulationRun>
}

export interface IAttackRepository {
  getAgents(): Promise<AttackAgent[]>
  generateAttackPlan(input: {
    merchant_id?: string
    simulation_id?: string
    active_policy_names?: string[]
    attack_type: string
    difficulty?: string
    available_entity_counts?: Record<string, any>
  }): Promise<any>
}

export interface IVulnerabilityRepository {
  getVulnerabilities(policyId?: string): Promise<Vulnerability[]>
  getVulnerabilityById(id: string): Promise<Vulnerability | null>
  explainVulnerability(vulnerabilityId: string): Promise<any>
}

export interface IPatchRepository {
  getPatches(): Promise<PolicyPatch[]>
  getPatchById(id: string): Promise<PolicyPatch | null>
  getPatchesForVulnerability(vulnerabilityId: string): Promise<PolicyPatch[]>
  generatePatch(vulnerabilityId: string): Promise<PolicyPatch>
  simulatePatch(patchId: string): Promise<PolicyPatch>
  evaluatePatch(patchId: string, split?: string, seed?: number): Promise<PolicyPatch>
  iteratePatch(patchId: string, feedbackNotes?: string, targetSplit?: string): Promise<PolicyPatch>
  approvePatch(patchId: string, notes?: string): Promise<PolicyPatch>
  rejectPatch(patchId: string, reason?: string): Promise<PolicyPatch>
  getPatchDecision(patchId: string): Promise<any>
}

export interface IBenchmarkRepository {
  getBenchmarkRuns(): Promise<BenchmarkRun[]>
  getComparison(patchId?: string): Promise<BenchmarkComparison>
  comparePolicies(request: PolicyComparisonRequest): Promise<PolicyComparisonReport>
  getPolicyComparison(comparisonId: string): Promise<PolicyComparisonReport>
  listPolicyComparisons(): Promise<PolicyComparisonReport[]>
}

export interface IIncidentRepository {
  getIncidents(): Promise<Incident[]>
  getIncidentById(id: string): Promise<Incident | null>
}

export interface IDatasetRepository {
  getDatasets(): Promise<SyntheticDataset[]>
}

export interface IAuditRepository {
  getAuditLogs(): Promise<AuditLogEntry[]>
}

export interface IReportRepository {
  getReports(): Promise<ExecutiveReport[]>
  getReportById(id: string): Promise<ExecutiveReport | null>
  generateReport(request: { simulation_id?: string; title?: string }): Promise<ExecutiveReport>
}

export interface IGraphRepository {
  getAttackGraph(simulationId?: string): Promise<AttackGraphData>
}
