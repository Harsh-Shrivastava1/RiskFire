import {
  ApiDashboardRepository,
  ApiPolicyRepository,
  ApiSimulationRepository,
  ApiAttackRepository,
  ApiVulnerabilityRepository,
  ApiPatchRepository,
  ApiBenchmarkRepository,
  ApiIncidentRepository,
  ApiDatasetRepository,
  ApiAuditRepository,
  ApiReportRepository,
  ApiGraphRepository,
} from '../api/apiRepositories'

export * from './types'

// Centralized real API repositories communicating with the FastAPI & MongoDB backend
export const dashboardRepository = new ApiDashboardRepository()
export const policyRepository = new ApiPolicyRepository()
export const simulationRepository = new ApiSimulationRepository()
export const attackRepository = new ApiAttackRepository()
export const vulnerabilityRepository = new ApiVulnerabilityRepository()
export const patchRepository = new ApiPatchRepository()
export const benchmarkRepository = new ApiBenchmarkRepository()
export const incidentRepository = new ApiIncidentRepository()
export const datasetRepository = new ApiDatasetRepository()
export const auditRepository = new ApiAuditRepository()
export const reportRepository = new ApiReportRepository()
export const graphRepository = new ApiGraphRepository()
