import {
  dashboardRepository,
  policyRepository,
  simulationRepository,
  vulnerabilityRepository,
  patchRepository,
  benchmarkRepository,
  incidentRepository,
  datasetRepository,
  auditRepository,
  reportRepository,
  graphRepository,
} from '../../src/services/repositories'

export async function runRepositoryTests(): Promise<boolean> {
  const metrics = await dashboardRepository.getMetrics()
  if (!metrics || metrics.simulatedExposure <= 0) {
    throw new Error('Dashboard metrics failed validation')
  }

  const policies = await policyRepository.getPolicies()
  if (!policies || policies.length === 0) {
    throw new Error('Policy repository failed validation')
  }

  const simulations = await simulationRepository.getSimulations()
  if (!simulations || simulations.length === 0) {
    throw new Error('Simulation repository failed validation')
  }

  const vulnerabilities = await vulnerabilityRepository.getVulnerabilities()
  if (!vulnerabilities || vulnerabilities.length === 0) {
    throw new Error('Vulnerability repository failed validation')
  }

  const patches = await patchRepository.getPatches()
  if (!patches || patches.length === 0) {
    throw new Error('Patch repository failed validation')
  }

  const benchmarks = await benchmarkRepository.getBenchmarkRuns()
  if (!benchmarks || benchmarks.length === 0) {
    throw new Error('Benchmark repository failed validation')
  }

  const incidents = await incidentRepository.getIncidents()
  if (!incidents || incidents.length === 0) {
    throw new Error('Incident repository failed validation')
  }

  const datasets = await datasetRepository.getDatasets()
  if (!datasets || datasets.length === 0) {
    throw new Error('Dataset repository failed validation')
  }

  const auditLogs = await auditRepository.getAuditLogs()
  if (!auditLogs || auditLogs.length === 0) {
    throw new Error('Audit repository failed validation')
  }

  const reports = await reportRepository.getReports()
  if (!reports || reports.length === 0) {
    throw new Error('Report repository failed validation')
  }

  const graph = await graphRepository.getAttackGraph()
  if (!graph || graph.nodes.length === 0) {
    throw new Error('Graph repository failed validation')
  }

  return true
}
