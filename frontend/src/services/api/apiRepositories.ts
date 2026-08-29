import { apiClient } from './client'
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
} from '../repositories/types'
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
  PolicyScopeContext,
  PolicyComparisonRequest,
  PolicyComparisonReport,
  RiskTrendPoint,
  AttackVectorDistribution,
  PolicyEffectivenessPoint,
} from '@/types'

// Helper mapper functions for snake_case -> camelCase domain model consistency

function mapPolicy(raw: any): RiskPolicy {
  return {
    id: raw.id,
    merchantId: raw.merchant_id,
    name: raw.name,
    description: raw.description,
    category: raw.category,
    isActive: raw.is_active,
    currentVersionId: raw.current_version_id,
    currentVersionNumber: raw.current_version_number,
    ruleCount: raw.rule_count,
    coverageRate: raw.coverage_rate,
    effectivenessRate: raw.effectiveness_rate,
    lastUpdated: raw.updated_at || raw.created_at,
    versions: (raw.versions || []).map((v: any) => ({
      id: v.id,
      policyId: v.policy_id,
      versionNumber: v.version_number,
      status: v.status,
      rules: (v.rules || []).map((r: any) => ({
        id: r.id,
        policyVersionId: r.policy_version_id,
        name: r.name,
        ruleType: r.rule_type,
        category: r.category,
        parameters: r.parameters || {},
        action: r.action,
        isEnabled: r.is_enabled ?? true,
        sequenceOrder: r.sequence_order || 1,
        description: r.description,
      })),
      createdAt: v.created_at,
      createdBy: v.created_by,
      notes: v.notes,
    })),
  }
}

function mapSimulation(raw: any): SimulationRun {
  return {
    id: raw.id,
    merchantId: raw.merchant_id,
    policyVersionId: raw.policy_version_id,
    policyName: raw.policy_name,
    policyVersionNumber: raw.policy_version_number,
    seed: raw.seed,
    status: raw.status,
    runType: raw.run_type,
    startedAt: raw.started_at,
    completedAt: raw.completed_at,
    durationSeconds: raw.duration_seconds,
    totalTransactions: raw.total_transactions,
    legitimateTransactionsCount: raw.legitimate_transactions_count,
    attackTransactionsCount: raw.attack_transactions_count,
    attacksAttempted: raw.attacks_attempted,
    bypassesFound: raw.bypasses_found,
    simulatedExposure: raw.simulated_exposure,
    detectionRecall: raw.detection_recall,
    falsePositiveRate: raw.false_positive_rate,
    eventsProcessed: raw.events_processed,
    activeAgents: raw.active_agents || [],
    errorMessage: raw.error_message,
  }
}

function mapSimulationEvent(raw: any): SimulationEvent {
  return {
    id: raw.id,
    simulationId: raw.simulation_id,
    eventType: raw.event_type,
    sequenceNum: raw.sequence_num,
    timestamp: raw.timestamp,
    simTimestamp: raw.sim_timestamp,
    message: raw.message,
    metadata: raw.metadata || {},
  }
}

function mapVulnerability(raw: any): Vulnerability {
  return {
    id: raw.id,
    simulationId: raw.simulation_id,
    policyId: raw.policy_id,
    policyName: raw.policy_name,
    policyVersionNumber: raw.policy_version_number,
    title: raw.title,
    vulnerabilityType: raw.vulnerability_type,
    severity: raw.severity,
    attackType: raw.attack_type,
    outcome: raw.outcome,
    bypassCount: raw.bypass_count,
    totalAttackCount: raw.total_attack_count,
    bypassRate: raw.bypass_rate,
    simulatedExposure: raw.simulated_exposure,
    affectedEntityCount: raw.affected_entity_count,
    repeatabilityScore: raw.repeatability_score,
    confidenceScore: raw.confidence_score,
    executiveSummary: raw.executive_summary,
    whyThePolicyFailed: raw.why_the_policy_failed,
    attackMechanism: raw.attack_mechanism,
    keySignalMissed: raw.key_signal_missed,
    contributingFactors: raw.contributing_factors || [],
    recommendedRemediation: raw.recommended_remediation,
    firstDetected: raw.first_detected,
    lastSeen: raw.last_seen,
    status: raw.status,
    plainEnglishSummary: raw.plain_english_summary,
    scenarioId: raw.scenario_id,
    datasetSplit: raw.dataset_split,
    seed: raw.seed,
    rulesTriggered: raw.rules_triggered || [],
    rulesNotTriggered: raw.rules_not_triggered || [],
    attackAttemptsCount: raw.attack_attempts_count,
    detectionCount: raw.detection_count,
    falseAlarmsCount: raw.false_alarms_count,
    affectedAccounts: raw.affected_accounts || [],
    affectedDevices: raw.affected_devices || [],
    affectedIps: raw.affected_ips || [],
    evidence: (raw.evidence || []).map((e: any) => ({
      id: e.id,
      transactionId: e.transaction_id,
      accountId: e.account_id,
      deviceId: e.device_id,
      ipAddress: e.ip_address,
      addressHash: e.address_hash,
      paymentInstrument: e.payment_instrument,
      amount: e.amount,
      simTimestamp: e.sim_timestamp,
      policyRuleTriggered: e.policy_rule_triggered,
      decision: e.decision,
      reasonMissed: e.reason_missed,
    })),
  }
}

function mapPatch(raw: any): PolicyPatch {
  return {
    id: raw.id,
    vulnerabilityId: raw.vulnerability_id,
    vulnerabilityTitle: raw.vulnerability_title,
    vulnerabilitySeverity: raw.vulnerability_severity,
    sourcePolicyId: raw.source_policy_id,
    sourcePolicyName: raw.source_policy_name,
    sourcePolicyVersion: raw.source_policy_version,
    targetPolicyVersion: raw.target_policy_version,
    status: raw.status,
    identifiedWeakness: raw.identified_weakness,
    proposedChanges: (raw.proposed_changes || []).map((p: any) => ({
      ruleType: p.rule_type,
      operation: p.operation,
      currentRuleText: p.current_rule_text,
      proposedRuleText: p.proposed_rule_text,
      rationale: p.rationale,
    })),
    aiReasoning: raw.ai_reasoning,
    expectedRiskReduction: raw.expected_risk_reduction,
    expectedFprImpact: raw.expected_fpr_impact,
    expectedCustomerFriction: raw.expected_customer_friction,
    validationStatus: raw.validation_status,
    confidence: raw.confidence,
    metricsComparison: raw.metrics_comparison
      ? {
          precision: raw.metrics_comparison.precision,
          recall: raw.metrics_comparison.recall,
          f1: raw.metrics_comparison.f1,
          falsePositiveRate: raw.metrics_comparison.false_positive_rate,
          attackSuccessRate: raw.metrics_comparison.attack_success_rate,
          bypassesCount: raw.metrics_comparison.bypasses_count,
          simulatedExposure: raw.metrics_comparison.simulated_exposure,
          customerFrictionImpact: raw.metrics_comparison.customer_friction_impact,
        }
      : undefined,
    decisionEvaluation: raw.decision_evaluation
      ? {
          decision: raw.decision_evaluation.decision,
          recommendationTitle: raw.decision_evaluation.recommendation_title,
          recommendationSummary: raw.decision_evaluation.recommendation_summary,
          reasons: raw.decision_evaluation.reasons || [],
          securityImprovements: raw.decision_evaluation.security_improvements || [],
          operationalRegressions: raw.decision_evaluation.operational_regressions || [],
          tradeOffSummary: raw.decision_evaluation.trade_off_summary,
          metricsConsidered: raw.decision_evaluation.metrics_considered || {},
          thresholdsApplied: raw.decision_evaluation.thresholds_applied || {},
          evaluatedAt: raw.decision_evaluation.evaluated_at,
          candidateChecksum: raw.decision_evaluation.candidate_checksum,
          datasetSplit: raw.decision_evaluation.dataset_split,
          isHeldOutEvaluated: raw.decision_evaluation.is_held_out_evaluated,
        }
      : undefined,
    candidateId: raw.candidate_id,
    candidateChecksum: raw.candidate_checksum,
    benchmarkReportId: raw.benchmark_report_id,
    iterationIndex: raw.iteration_index || 1,
    parentPatchId: raw.parent_patch_id,
    scenarioResults: (raw.scenario_results || []).map((s: any) => ({
      scenarioId: s.scenario_id,
      scenarioName: s.scenario_name,
      totalTransactions: s.total_transactions,
      adversarialTransactions: s.adversarial_transactions,
      baselineRecall: s.baseline_recall,
      candidateRecall: s.candidate_recall,
      deltaRecall: s.delta_recall,
      baselineBypasses: s.baseline_bypasses,
      candidateBypasses: s.candidate_bypasses,
      simulatedExposure: s.simulated_exposure,
      attackSuccessRate: s.attack_success_rate,
      status: s.status,
    })),
    createdAt: raw.created_at,
    reviewedAt: raw.reviewed_at,
    reviewedBy: raw.reviewed_by,
    rejectionReason: raw.rejection_reason,
  }
}

function mapBenchmarkMetrics(raw: any) {
  return {
    totalTransactions: raw.total_transactions,
    totalAdversarial: raw.total_adversarial,
    totalLegitimate: raw.total_legitimate,
    truePositives: raw.true_positives,
    trueNegatives: raw.true_negatives,
    falsePositives: raw.false_positives,
    falseNegatives: raw.false_negatives,
    precision: raw.precision,
    recall: raw.recall,
    f1Score: raw.f1_score,
    falsePositiveRate: raw.false_positive_rate,
    attackSuccessRate: raw.attack_success_rate,
    successfulBypasses: raw.successful_bypasses,
    simulatedExposure: raw.simulated_exposure,
    exposureReduction: raw.exposure_reduction,
    customerFrictionScore: raw.customer_friction_score,
    policyCoverage: raw.policy_coverage,
    simulationThroughput: raw.simulation_throughput,
  }
}

function mapBenchmarkRun(raw: any): BenchmarkRun {
  return {
    id: raw.id,
    simulationId: raw.simulation_id,
    policyId: raw.policy_id,
    policyName: raw.policy_name,
    policyVersionNumber: raw.policy_version_number,
    datasetSplit: raw.dataset_split,
    status: raw.status,
    metrics: mapBenchmarkMetrics(raw.metrics || {}),
    isHeldOutIsolated: raw.is_held_out_isolated,
    executedAt: raw.executed_at,
  }
}

function mapBenchmarkComparison(raw: any): BenchmarkComparison {
  return {
    id: raw.id,
    patchId: raw.patch_id,
    baselineVersion: raw.baseline_version,
    patchedVersion: raw.patched_version,
    datasetSplit: raw.dataset_split,
    before: mapBenchmarkMetrics(raw.before || {}),
    after: mapBenchmarkMetrics(raw.after || {}),
    deltaRecall: raw.delta_recall,
    deltaPrecision: raw.delta_precision,
    deltaFpr: raw.delta_fpr,
    deltaExposure: raw.delta_exposure,
    netImprovementScore: raw.net_improvement_score,
    isRegression: raw.is_regression,
    recommendation: raw.recommendation,
  }
}

function mapIncident(raw: any): Incident {
  return {
    id: raw.id,
    incidentNumber: raw.incident_number,
    title: raw.title,
    severity: raw.severity,
    status: raw.status,
    affectedPolicyId: raw.affected_policy_id,
    affectedPolicyName: raw.affected_policy_name,
    vulnerabilityId: raw.vulnerability_id,
    vulnerabilityTitle: raw.vulnerability_title,
    simulationId: raw.simulation_id,
    simulatedExposure: raw.simulated_exposure,
    bypassesCount: raw.bypasses_count,
    detectedAt: raw.detected_at,
    owner: raw.owner,
    summary: raw.summary,
    timeline: (raw.timeline || []).map((t: any) => ({
      id: t.id,
      timestamp: t.timestamp,
      title: t.title,
      description: t.description,
      actor: t.actor,
      type: t.type,
    })),
  }
}

function mapAuditLog(raw: any): AuditLogEntry {
  return {
    id: raw.id,
    timestamp: raw.timestamp,
    action: raw.action,
    actorType: raw.actor_type,
    actorName: raw.actor_name,
    entityType: raw.entity_type,
    entityId: raw.entity_id,
    entityName: raw.entity_name,
    status: raw.status,
    details: raw.details || {},
    ipAddress: raw.ip_address,
  }
}

function mapExecutiveReport(raw: any): ExecutiveReport {
  return {
    id: raw.id,
    reportNumber: raw.report_number,
    title: raw.title,
    createdAt: raw.created_at,
    simulationId: raw.simulation_id,
    policyVersionTested: raw.policy_version_tested,
    author: raw.author,
    status: raw.status,
    riskPostureScore: raw.risk_posture_score,
    executiveSummary: raw.executive_summary,
    keyFindings: (raw.key_findings || []).map((f: any) => ({
      id: f.id,
      title: f.title,
      severity: f.severity,
      affectedPolicy: f.affected_policy,
      exposureEstimate: f.exposure_estimate,
      description: f.description,
      remediationStatus: f.remediation_status,
    })),
    topVulnerabilitiesCount: raw.top_vulnerabilities_count,
    totalSimulatedExposure: raw.total_simulated_exposure,
    overallPolicyRecall: raw.overall_policy_recall,
    overallFpr: raw.overall_fpr,
    recommendedActions: raw.recommended_actions || [],
    methodologyDisclaimer: raw.methodology_disclaimer,
  }
}

// -------------------------------------------------------------
// Repository Implementations
// -------------------------------------------------------------

export class ApiDashboardRepository implements IDashboardRepository {
  async getSummary(policyId?: string): Promise<{
    policyScope: PolicyScopeContext
    metrics: DashboardMetrics
    riskTrend: RiskTrendPoint[]
    attackVectors: AttackVectorDistribution[]
    policyEffectiveness: PolicyEffectivenessPoint[]
    topVulnerabilities: Vulnerability[]
    recentSimulations: SimulationRun[]
    activeIncidents: Incident[]
  }> {
    const params = policyId ? { policy_id: policyId } : undefined
    const data = await apiClient.get<any>('/dashboard/summary', params)
    const m = data.metrics || {}
    const pScope = data.policyScope || data.policy_scope || {
      policyId: policyId || 'pol-vel-01',
      policyName: 'Core Merchant Velocity & High-Value Guard',
      versionNumber: 'v1.0.0',
      isEvaluated: true,
    }
    const isEval = m.isEvaluated ?? m.is_evaluated ?? pScope.isEvaluated ?? pScope.is_evaluated ?? true
    const metrics: DashboardMetrics = {
      policyCoverage: m.policyCoverage ?? m.policy_coverage ?? 0,
      activeVulnerabilities: m.activeVulnerabilities ?? m.active_vulnerabilities ?? 0,
      attackSuccessRate: m.attackSuccessRate ?? m.attack_success_rate ?? 0,
      simulatedExposure: m.simulatedExposure ?? m.simulated_exposure ?? 0,
      detectionRecall: m.detectionRecall ?? m.detection_recall ?? 0,
      falsePositiveRate: m.falsePositiveRate ?? m.false_positive_rate ?? 0,
      simulationsRunCount: m.simulationsRunCount ?? m.simulations_run_count ?? 0,
      attacksDetectedCount: m.attacksDetectedCount ?? m.attacks_detected_count ?? 0,
      policyBypassesCount: m.policyBypassesCount ?? m.policy_bypasses_count ?? 0,
      riskPostureScore: m.riskPostureScore ?? m.risk_posture_score ?? null,
      isEvaluated: isEval,
    }
    return {
      policyScope: {
        policyId: pScope.policyId ?? pScope.policy_id,
        policyName: pScope.policyName ?? pScope.policy_name,
        versionNumber: pScope.versionNumber ?? pScope.version_number,
        versionId: pScope.versionId ?? pScope.version_id,
        evaluationId: pScope.evaluationId ?? pScope.evaluation_id,
        evaluationType: pScope.evaluationType ?? pScope.evaluation_type,
        datasetId: pScope.datasetId ?? pScope.dataset_id ?? 'ds-synthetic-v1',
        seed: pScope.seed ?? 49201,
        lastEvaluated: pScope.lastEvaluated ?? pScope.last_evaluated,
        isEvaluated: isEval,
      },
      metrics,
      riskTrend: (data.riskTrend || data.risk_trend || []).map((t: any) => ({
        date: t.date,
        recall: t.recall ?? (metrics.detectionRecall || 0),
        fpr: t.fpr ?? (metrics.falsePositiveRate || 0),
        bypasses: t.bypassesDetected ?? t.bypasses_detected ?? t.bypasses ?? 0,
        exposure: t.exposure ?? (t.bypassesDetected || 0) * 4800,
      })),
      attackVectors: (data.attackVectors || data.attack_vectors || []).map((v: any) => ({
        name: v.vector || v.name,
        attacksCount: v.count || v.attacksCount || 0,
        bypassesCount: Math.round(((v.count || 0) * (v.percentage || 0)) / 100),
        exposureAmount: v.exposure || v.exposureAmount || 0,
        severity: v.severity || 'HIGH',
      })),
      policyEffectiveness: (data.policyEffectiveness || data.policy_effectiveness || []).map((p: any) => ({
        policyName: p.policyName || p.policy_name,
        coverage: p.coverageRate || p.coverage_rate || 0,
        recall: p.recall ?? 0,
        fpr: p.fpr ?? 0,
      })),
      topVulnerabilities: (data.topVulnerabilities || data.top_vulnerabilities || []).map(mapVulnerability),
      recentSimulations: (data.recentSimulations || data.recent_simulations || []).map(mapSimulation),
      activeIncidents: (data.activeIncidents || data.active_incidents || []).map(mapIncident),
    }
  }

  async getMetrics(policyId?: string): Promise<DashboardMetrics> {
    const summary = await this.getSummary(policyId)
    return summary.metrics
  }

  async getRiskTrend(policyId?: string): Promise<RiskTrendPoint[]> {
    const summary = await this.getSummary(policyId)
    return summary.riskTrend
  }

  async getAttackVectors(policyId?: string): Promise<AttackVectorDistribution[]> {
    const summary = await this.getSummary(policyId)
    return summary.attackVectors
  }

  async getPolicyEffectiveness(policyId?: string): Promise<PolicyEffectivenessPoint[]> {
    const summary = await this.getSummary(policyId)
    return summary.policyEffectiveness
  }
}

export class ApiPolicyRepository implements IPolicyRepository {
  async getPolicies(): Promise<RiskPolicy[]> {
    const list = await apiClient.get<any[]>('/policies')
    return list.map(mapPolicy)
  }

  async getPolicyById(id: string): Promise<RiskPolicy | null> {
    try {
      const pol = await apiClient.get<any>(`/policies/${id}`)
      return mapPolicy(pol)
    } catch (err: any) {
      if (err.status === 404) return null
      throw err
    }
  }

  async createPolicy(policyData: Partial<RiskPolicy>): Promise<RiskPolicy> {
    const body = {
      name: policyData.name || 'Untitled Policy',
      description: policyData.description || '',
      category: policyData.category || 'VELOCITY',
      rules: (policyData.versions?.[0]?.rules || []).map((r) => ({
        name: r.name,
        rule_type: r.ruleType,
        category: r.category || policyData.category || 'VELOCITY',
        parameters: r.parameters || {},
        action: r.action || 'BLOCK',
        is_enabled: r.isEnabled ?? true,
        sequence_order: r.sequenceOrder || 1,
        description: r.description,
      })),
      notes: policyData.versions?.[0]?.notes || 'Created via RiskFire Policy Builder',
    }
    const created = await apiClient.post<any>('/policies', body)
    return mapPolicy(created)
  }

  async updatePolicy(id: string, updateData: Partial<RiskPolicy>): Promise<RiskPolicy> {
    const body: any = {}
    if (updateData.name !== undefined) body.name = updateData.name
    if (updateData.description !== undefined) body.description = updateData.description
    if (updateData.isActive !== undefined) body.is_active = updateData.isActive

    const updated = await apiClient.put<any>(`/policies/${id}`, body)
    return mapPolicy(updated)
  }

  async getPolicyVersions(policyId: string): Promise<PolicyVersion[]> {
    const pol = await this.getPolicyById(policyId)
    return pol?.versions || []
  }
}

export class ApiSimulationRepository implements ISimulationRepository {
  async getSimulations(): Promise<SimulationRun[]> {
    const list = await apiClient.get<any[]>('/simulations')
    return list.map(mapSimulation)
  }

  async getSimulationById(id: string): Promise<SimulationRun | null> {
    try {
      const sim = await apiClient.get<any>(`/simulations/${id}`)
      return mapSimulation(sim)
    } catch (err: any) {
      if (err.status === 404) return null
      throw err
    }
  }

  async getSimulationEvents(simulationId: string): Promise<SimulationEvent[]> {
    const events = await apiClient.get<any[]>(`/simulations/${simulationId}/events`)
    return events.map(mapSimulationEvent)
  }

  async triggerFireDrill(policyVersionId?: string): Promise<SimulationRun> {
    const body = {
      policy_id: policyVersionId || 'pol-vel-01',
      difficulty: 'HIGH',
      seed: 49201,
    }
    const sim = await apiClient.post<any>('/simulations/fire-drill', body)
    return mapSimulation(sim)
  }

  async triggerSimulation(config: any): Promise<SimulationRun> {
    const body = {
      policy_id: config.policyId || config.policyVersionId || 'pol-vel-01',
      policy_name: config.policyName,
      seed: config.seed || 49201,
      attack_types: config.attackTypes || ['VELOCITY_ATTACKER'],
      difficulty: config.difficulty || 'HIGH',
      legitimate_transaction_count: config.legitimateTransactionCount || 2400,
      attack_transaction_count: config.attackTransactionCount || 800,
      sim_duration_hours: config.simDurationHours || 24,
    }
    const sim = await apiClient.post<any>('/simulations/run', body)
    return mapSimulation(sim)
  }
}

export class ApiAttackRepository implements IAttackRepository {
  async getAgents(): Promise<AttackAgent[]> {
    const agents = await apiClient.get<any[]>('/attacks/agents')
    return agents.map((a: any) => ({
      id: a.id,
      type: a.type,
      name: a.name,
      description: a.description,
      targetPolicies: a.target_policies || [],
      evasionTactics: a.evasion_tactics || [],
      severityPotential: a.severity_potential || 'HIGH',
      iconName: a.icon_name || 'Zap',
    }))
  }

  async generateAttackPlan(input: {
    merchant_id?: string
    simulation_id?: string
    active_policy_names?: string[]
    attack_type: string
    difficulty?: string
    available_entity_counts?: Record<string, any>
  }): Promise<any> {
    const body = {
      merchant_id: input.merchant_id || 'm-dev-01',
      simulation_id: input.simulation_id || 'sim-01',
      active_policy_names: input.active_policy_names || ['Core Merchant Velocity & High-Value Guard'],
      attack_type: input.attack_type,
      difficulty: input.difficulty || 'HIGH',
      available_entity_counts: input.available_entity_counts || {},
    }
    return await apiClient.post<any>('/attacks/plan', body)
  }
}

export class ApiVulnerabilityRepository implements IVulnerabilityRepository {
  async getVulnerabilities(policyId?: string): Promise<Vulnerability[]> {
    const params = policyId ? { policy_id: policyId } : undefined
    const vulns = await apiClient.get<any[]>('/vulnerabilities', params)
    return vulns.map(mapVulnerability)
  }

  async getVulnerabilityById(id: string): Promise<Vulnerability | null> {
    try {
      const vuln = await apiClient.get<any>(`/vulnerabilities/${id}`)
      return mapVulnerability(vuln)
    } catch (err: any) {
      if (err.status === 404) return null
      throw err
    }
  }

  async explainVulnerability(vulnerabilityId: string): Promise<any> {
    return await apiClient.post<any>(`/vulnerabilities/${vulnerabilityId}/explain`)
  }
}

export class ApiPatchRepository implements IPatchRepository {
  async getPatches(): Promise<PolicyPatch[]> {
    const patches = await apiClient.get<any[]>('/patches')
    return patches.map(mapPatch)
  }

  async getPatchById(id: string): Promise<PolicyPatch | null> {
    try {
      const patch = await apiClient.get<any>(`/patches/${id}`)
      return mapPatch(patch)
    } catch (err: any) {
      if (err.status === 404) return null
      throw err
    }
  }

  async getPatchesForVulnerability(vulnerabilityId: string): Promise<PolicyPatch[]> {
    const patches = await apiClient.get<any[]>(`/patches/vulnerability/${vulnerabilityId}`)
    return patches.map(mapPatch)
  }

  async generatePatch(vulnerabilityId: string): Promise<PolicyPatch> {
    const res = await apiClient.post<any>(`/patches/generate/${vulnerabilityId}`)
    return mapPatch(res)
  }

  async simulatePatch(patchId: string): Promise<PolicyPatch> {
    const res = await apiClient.post<any>(`/patches/${patchId}/simulate`)
    return mapPatch(res)
  }

  async evaluatePatch(patchId: string, split: string = 'held_out', seed: number = 49201): Promise<PolicyPatch> {
    const res = await apiClient.post<any>(`/patches/${patchId}/evaluate?split=${split}&seed=${seed}`)
    return mapPatch(res)
  }

  async iteratePatch(patchId: string, feedbackNotes?: string, targetSplit: string = 'held_out'): Promise<PolicyPatch> {
    const res = await apiClient.post<any>(`/patches/${patchId}/iterate`, {
      feedback_notes: feedbackNotes,
      target_split: targetSplit,
    })
    return mapPatch(res)
  }

  async approvePatch(patchId: string, notes?: string): Promise<PolicyPatch> {
    const res = await apiClient.post<any>(`/patches/${patchId}/approve`, { notes: notes || 'Approved via RiskFire Console' })
    return mapPatch(res)
  }

  async rejectPatch(patchId: string, reason?: string): Promise<PolicyPatch> {
    const res = await apiClient.post<any>(`/patches/${patchId}/reject`, { reason: reason || 'Rejected by risk engineer' })
    return mapPatch(res)
  }

  async getPatchDecision(patchId: string): Promise<any> {
    return await apiClient.get<any>(`/patches/${patchId}/decision`)
  }
}

export class ApiBenchmarkRepository implements IBenchmarkRepository {
  async getBenchmarkRuns(): Promise<BenchmarkRun[]> {
    const runs = await apiClient.get<any[]>('/benchmarks/runs')
    return runs.map(mapBenchmarkRun)
  }

  async getComparison(_patchId?: string): Promise<BenchmarkComparison> {
    const comp = await apiClient.get<any>('/benchmarks/comparison/latest')
    return mapBenchmarkComparison(comp)
  }

  async comparePolicies(request: PolicyComparisonRequest): Promise<PolicyComparisonReport> {
    return await apiClient.post<PolicyComparisonReport>('/benchmarks/compare-policies', request)
  }

  async getPolicyComparison(comparisonId: string): Promise<PolicyComparisonReport> {
    return await apiClient.get<PolicyComparisonReport>(`/benchmarks/comparisons/${comparisonId}`)
  }

  async listPolicyComparisons(): Promise<PolicyComparisonReport[]> {
    return await apiClient.get<PolicyComparisonReport[]>('/benchmarks/comparisons')
  }
}

export class ApiIncidentRepository implements IIncidentRepository {
  async getIncidents(): Promise<Incident[]> {
    const incs = await apiClient.get<any[]>('/incidents')
    return incs.map(mapIncident)
  }

  async getIncidentById(id: string): Promise<Incident | null> {
    try {
      const inc = await apiClient.get<any>(`/incidents/${id}`)
      return mapIncident(inc)
    } catch (err: any) {
      if (err.status === 404) return null
      throw err
    }
  }
}

export class ApiDatasetRepository implements IDatasetRepository {
  async getDatasets(): Promise<SyntheticDataset[]> {
    const datasets = await apiClient.get<any[]>('/datasets')
    return datasets.map((d: any) => ({
      id: d.id,
      name: d.name,
      version: d.version,
      totalRecords: d.totalRecords ?? d.total_records,
      generationSeed: d.generationSeed ?? d.generation_seed,
      createdAt: d.createdAt ?? d.created_at,
      status: d.status,
      splits: (d.splits || []).map((s: any) => ({
        split: s.split,
        percentage: s.percentage,
        totalRecords: s.totalRecords ?? s.total_records,
        legitimateCount: s.legitimateCount ?? s.legitimate_count,
        adversarialCount: s.adversarialCount ?? s.adversarial_count,
        accountsCount: s.accountsCount ?? s.accounts_count,
        devicesCount: s.devicesCount ?? s.devices_count,
        isIsolated: s.isIsolated ?? s.is_isolated,
        lastUpdated: s.lastUpdated ?? s.last_updated,
      })),
      description: d.description,
    }))
  }
}

export class ApiAuditRepository implements IAuditRepository {
  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const logs = await apiClient.get<any[]>('/audit')
    return logs.map(mapAuditLog)
  }
}

export class ApiReportRepository implements IReportRepository {
  async getReports(): Promise<ExecutiveReport[]> {
    const reports = await apiClient.get<any[]>('/reports')
    return reports.map(mapExecutiveReport)
  }

  async getReportById(id: string): Promise<ExecutiveReport | null> {
    try {
      const report = await apiClient.get<any>(`/reports/${id}`)
      return mapExecutiveReport(report)
    } catch (err: any) {
      if (err.status === 404) return null
      throw err
    }
  }

  async generateReport(request: { simulation_id?: string; title?: string }): Promise<ExecutiveReport> {
    const res = await apiClient.post<any>('/reports/generate', request)
    return mapExecutiveReport(res)
  }
}

export class ApiGraphRepository implements IGraphRepository {
  async getAttackGraph(simulationId?: string): Promise<AttackGraphData> {
    const params = simulationId ? { simulation_id: simulationId } : undefined
    const graph = await apiClient.get<any>('/graph', params)
    return {
      nodes: (graph.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'entityNode',
        position: n.position || { x: 100, y: 100 },
        data: {
          id: n.data?.id || n.id,
          label: n.data?.label || n.label || '',
          entityType: n.data?.entityType || n.data?.entity_type || 'ACCOUNT',
          identifier: n.data?.identifier || n.identifier || '',
          isAdversarial: n.data?.isAdversarial ?? n.data?.is_adversarial ?? false,
          isShared: n.data?.isShared ?? n.data?.is_shared ?? false,
          connectionCount: n.data?.connectionCount ?? n.data?.connection_count ?? 1,
          riskLevel: n.data?.riskLevel || n.data?.risk_level,
          metadata: n.data?.metadata || {},
        },
      })),
      edges: (graph.edges || []).map((e: any) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.animated ?? false,
        style: e.style,
      })),
    }
  }
}
