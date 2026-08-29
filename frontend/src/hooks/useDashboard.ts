import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  dashboardRepository,
  policyRepository,
  vulnerabilityRepository,
  simulationRepository,
  incidentRepository,
  benchmarkRepository,
} from '@/services/repositories'
import {
  DashboardMetrics,
  PolicyScopeContext,
  RiskTrendPoint,
  AttackVectorDistribution,
  PolicyEffectivenessPoint,
  Vulnerability,
  SimulationRun,
  Incident,
  BenchmarkComparison,
  RiskPolicy,
} from '@/types'

export const useDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlPolicyId = searchParams.get('policy_id') || searchParams.get('policyId') || ''

  const [policies, setPolicies] = useState<RiskPolicy[]>([])
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(urlPolicyId)
  const [policyScope, setPolicyScope] = useState<PolicyScopeContext | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [riskTrend, setRiskTrend] = useState<RiskTrendPoint[]>([])
  const [attackVectors, setAttackVectors] = useState<AttackVectorDistribution[]>([])
  const [policyEffectiveness, setPolicyEffectiveness] = useState<PolicyEffectivenessPoint[]>([])
  const [topVulnerabilities, setTopVulnerabilities] = useState<Vulnerability[]>([])
  const [recentSimulations, setRecentSimulations] = useState<SimulationRun[]>([])
  const [activeIncidents, setActiveIncidents] = useState<Incident[]>([])
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 1. Fetch scoped dashboard summary function
  const fetchData = useCallback(async (targetPolicyId?: string) => {
    const policyToFetch = targetPolicyId !== undefined ? targetPolicyId : selectedPolicyId
    setLoading(true)
    setError(null)
    try {
      const summary = await dashboardRepository.getSummary(policyToFetch || undefined)
      setPolicyScope(summary.policyScope)
      setMetrics(summary.metrics)
      setRiskTrend(summary.riskTrend)
      setAttackVectors(summary.attackVectors)
      setPolicyEffectiveness(summary.policyEffectiveness)
      setTopVulnerabilities(summary.topVulnerabilities)
      setRecentSimulations(summary.recentSimulations)
      setActiveIncidents(summary.activeIncidents.filter((i: Incident) => i.status !== 'RESOLVED'))

      // Also attempt to load latest comparison
      try {
        const comp = await benchmarkRepository.getComparison()
        setComparison(comp)
      } catch {
        setComparison(null)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load policy-scoped dashboard metrics')
    } finally {
      setLoading(false)
      setSwitching(false)
    }
  }, [selectedPolicyId])

  // 2. Initial load of all policies
  useEffect(() => {
    let mounted = true
    const loadPolicies = async () => {
      try {
        const polList = await policyRepository.getPolicies()
        if (mounted) {
          setPolicies(polList)
          if (!urlPolicyId && polList.length > 0) {
            const active = polList.find((p) => p.isActive) || polList[0]
            setSelectedPolicyId(active.id)
          }
        }
      } catch (err: any) {
        console.error('Failed to load policies for selector:', err)
      }
    }
    loadPolicies()
    return () => {
      mounted = false
    }
  }, [urlPolicyId])

  // 3. Sync state if URL search param changes (e.g. back/forward button)
  useEffect(() => {
    if (urlPolicyId && urlPolicyId !== selectedPolicyId) {
      setSelectedPolicyId(urlPolicyId)
      fetchData(urlPolicyId)
    }
  }, [urlPolicyId, selectedPolicyId, fetchData])

  // 4. Initial fetch on mount and whenever selectedPolicyId changes
  useEffect(() => {
    fetchData()
  }, [fetchData])

  const switchPolicy = (newPolicyId: string) => {
    if (newPolicyId === selectedPolicyId) return
    setSwitching(true)
    setSelectedPolicyId(newPolicyId)
    setSearchParams(newPolicyId ? { policy_id: newPolicyId } : {}, { replace: false })
    fetchData(newPolicyId)
  }

  return {
    policies,
    selectedPolicyId,
    policyScope,
    metrics,
    riskTrend,
    attackVectors,
    policyEffectiveness,
    topVulnerabilities,
    recentSimulations,
    activeIncidents,
    comparison,
    loading,
    switching,
    error,
    switchPolicy,
    refetch: () => fetchData(),
  }
}


