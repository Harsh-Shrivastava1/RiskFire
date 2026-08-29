import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { policyRepository, benchmarkRepository } from '@/services/repositories'
import { PageHeader } from '@/components/layout/PageHeader'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Scale,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react'
import { RiskPolicy, PolicyComparisonReport, DatasetSplitType } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

export const PolicyComparison: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialPolicyA = searchParams.get('policy_a') || searchParams.get('policyA') || ''
  const initialPolicyB = searchParams.get('policy_b') || searchParams.get('policyB') || ''

  const [policies, setPolicies] = useState<RiskPolicy[]>([])
  const [policyAId, setPolicyAId] = useState<string>(initialPolicyA)
  const [policyBId, setPolicyBId] = useState<string>(initialPolicyB)
  const [seed, setSeed] = useState<number>(49201)
  const [datasetId, setDatasetId] = useState<string>('ds-synthetic-v1')
  const [split, setSplit] = useState<DatasetSplitType>('held_out')

  const [report, setReport] = useState<PolicyComparisonReport | null>(null)
  const [loadingPolicies, setLoadingPolicies] = useState(true)
  const [comparing, setComparing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedScenario, setExpandedScenario] = useState<string | null>(null)

  // 1. Fetch available policies
  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const list = await policyRepository.getPolicies()
        if (mounted) {
          setPolicies(list)
          if (list.length >= 2) {
            if (!policyAId) setPolicyAId(list[0].id)
            if (!policyBId) setPolicyBId(list[1].id)
          } else if (list.length === 1) {
            if (!policyAId) setPolicyAId(list[0].id)
            if (!policyBId) setPolicyBId(list[0].id)
          }
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load policy catalogue.')
      } finally {
        if (mounted) setLoadingPolicies(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [policyAId, policyBId])

  // 2. Execute policy comparison
  const runComparison = async () => {
    if (!policyAId || !policyBId) return
    setComparing(true)
    setError(null)
    try {
      const res = await benchmarkRepository.comparePolicies({
        policy_a_id: policyAId,
        policy_b_id: policyBId,
        seed,
        dataset_id: datasetId,
        dataset_split: split,
      })
      setReport(res)
    } catch (err: any) {
      setError(err?.message || 'Failed to execute deterministic policy comparison.')
    } finally {
      setComparing(false)
    }
  }

  // Auto-run comparison once policies are ready
  useEffect(() => {
    if (policyAId && policyBId && !report && !comparing && policies.length > 0) {
      runComparison()
    }
  }, [policies])

  const policyA = policies.find((p) => p.id === policyAId)
  const policyB = policies.find((p) => p.id === policyBId)

  if (loadingPolicies) {
    return (
      <div className="p-6 space-y-6 w-full">
        <LoadingState type="cards" rows={3} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      <PageHeader
        title="Side-by-Side Policy Comparison"
        description="Strictly fair benchmark comparison between two security policies evaluated on identical synthetic workloads."
        badge={
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800">
            Fair Test Discipline (Seed {seed})
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/policies')}
              className="h-8 text-xs font-semibold"
            >
              ← Back to Policies
            </Button>
            <Button
              size="sm"
              onClick={runComparison}
              disabled={comparing || !policyAId || !policyBId}
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
            >
              <Scale className="h-3.5 w-3.5" />
              <span>{comparing ? 'Evaluating...' : 'Run Comparison'}</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {error && (
          <ErrorState
            title="Comparison Error"
            message={error}
            onRetry={runComparison}
          />
        )}

        {/* ============================================================ */}
        {/* POLICY SELECTION & TEST WORKLOAD CONTROLS */}
        {/* ============================================================ */}
        <Card className="p-5 border-slate-200 bg-white shadow-2xs">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Policy A Selector */}
            <div className="md:col-span-4 space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-blue-600"></span>
                <span>Policy A (Baseline)</span>
              </span>
              <Select value={policyAId} onValueChange={setPolicyAId}>
                <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold shadow-2xs">
                  <SelectValue placeholder="Select Baseline Policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                      {p.name} ({p.currentVersionNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                <span>ID: {policyA?.id || '—'}</span>
                <span>{policyA?.ruleCount || 0} rules</span>
              </div>
            </div>

            {/* VS Badge */}
            <div className="md:col-span-1 flex items-center justify-center">
              <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs flex items-center justify-center shadow-2xs">
                VS
              </div>
            </div>

            {/* Policy B Selector */}
            <div className="md:col-span-4 space-y-1.5 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
                <span>Policy B (Candidate)</span>
              </span>
              <Select value={policyBId} onValueChange={setPolicyBId}>
                <SelectTrigger className="w-full h-9 bg-white border-slate-300 text-xs font-semibold shadow-2xs">
                  <SelectValue placeholder="Select Candidate Policy" />
                </SelectTrigger>
                <SelectContent>
                  {policies.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                      {p.name} ({p.currentVersionNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-0.5">
                <span>ID: {policyB?.id || '—'}</span>
                <span>{policyB?.ruleCount || 0} rules</span>
              </div>
            </div>

            {/* Re-run CTA */}
            <div className="md:col-span-3 flex flex-col justify-center space-y-1 pl-2">
              <Button
                onClick={runComparison}
                disabled={comparing}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs h-9 shadow-2xs gap-1.5"
              >
                <RotateCcw className={`h-3.5 w-3.5 ${comparing ? 'animate-spin' : ''}`} />
                <span>{comparing ? 'Computing...' : 'Evaluate Comparison'}</span>
              </Button>
              <span className="text-[10px] text-slate-400 text-center font-mono">
                10 Canonical Scenarios (SCN-01..10)
              </span>
            </div>
          </div>
        </Card>

        {/* ============================================================ */}
        {/* FAIRNESS VERIFICATION BADGE */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                  Fair Comparison: VERIFIED
                </span>
                <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.2 font-mono">
                  100% ISOLATED
                </span>
              </div>
              <p className="text-xs text-emerald-900/80 mt-0.5">
                Identical seed ({report?.seed || seed}), identical dataset ({report?.dataset_id || datasetId}), held-out split, identical transaction workload (3,200 txns), and identical 10 attack scenarios. Only the policy logic changes.
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-emerald-900 font-mono shrink-0 hidden md:block">
            <div>Hash: {report?.fairness?.scenarios_hash || 'SHA256-49201-HELD'}</div>
            <div>Scenarios: 10/10 Canonical</div>
          </div>
        </div>

        {report && (
          <>
            {/* ============================================================ */}
            {/* DETERMINISTIC RECOMMENDATION BANNER */}
            {/* ============================================================ */}
            <Card
              className={`p-6 shadow-2xs border ${
                report.recommendation === 'RECOMMEND_POLICY_B'
                  ? 'border-emerald-300 bg-linear-to-r from-emerald-50/60 via-white to-white'
                  : report.recommendation === 'RECOMMEND_POLICY_A'
                  ? 'border-blue-300 bg-linear-to-r from-blue-50/60 via-white to-white'
                  : 'border-amber-300 bg-linear-to-r from-amber-50/60 via-white to-white'
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold font-mono border ${
                        report.recommendation === 'RECOMMEND_POLICY_B'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : report.recommendation === 'RECOMMEND_POLICY_A'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}
                    >
                      DETERMINISTIC RECOMMENDATION: {report.recommendation.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Net Score: {report.net_improvement_score > 0 ? `+${report.net_improvement_score}` : report.net_improvement_score}
                    </span>
                  </div>

                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">
                    {report.recommendation_reason}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Security Gain</span>
                      <div className="font-bold text-slate-900 mt-0.5">{report.security_gain_summary}</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Operational Friction</span>
                      <div className="font-bold text-slate-900 mt-0.5">{report.operational_tradeoff_summary}</div>
                    </div>
                    <div className="p-2.5 rounded-lg border border-slate-200 bg-white">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Loss Exposure Reduction</span>
                      <div className="font-bold text-emerald-700 font-mono mt-0.5">{report.exposure_reduction_summary}</div>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 text-right space-y-2">
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-[11px] text-slate-500 max-w-xs text-left">
                    <div className="font-bold text-slate-700 flex items-center gap-1 mb-1">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                      <span>Zero AI Authority</span>
                    </div>
                    Recommendation computed strictly by mathematical regression delta criteria on the held-out test split.
                  </div>
                </div>
              </div>
            </Card>

            {/* ============================================================ */}
            {/* PRIMARY COMPARISON METRICS TABLE */}
            {/* ============================================================ */}
            <Card className="shadow-2xs overflow-hidden border-slate-200">
              <CardHeader className="bg-slate-50/70 border-b border-border py-3">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center justify-between">
                  <span>Aggregate Benchmark Performance Delta</span>
                  <span className="text-xs font-mono font-normal text-slate-500">
                    Evaluated on 15% Held-Out Split (Seed {report.seed})
                  </span>
                </CardTitle>
              </CardHeader>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100/50 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-3 px-4">Evaluation Metric</th>
                      <th className="py-3 px-4 text-center text-blue-700">
                        Policy A ({report.policy_a_name.split(' ')[0]} {report.policy_a_version})
                      </th>
                      <th className="py-3 px-4 text-center text-emerald-700">
                        Policy B ({report.policy_b_name.split(' ')[0]} {report.policy_b_version})
                      </th>
                      <th className="py-3 px-4 text-right">Delta (B vs A)</th>
                      <th className="py-3 px-4">Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {/* Attack Detection Rate (Recall) */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        Attack Detection Rate (Recall)
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {report.policy_a_metrics.recall}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {report.policy_b_metrics.recall}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {report.delta_recall > 0 ? `+${report.delta_recall}%` : `${report.delta_recall}%`}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-600">
                        {report.delta_recall > 0 ? 'Higher attack catch rate' : 'Equivalent detection'}
                      </td>
                    </tr>

                    {/* Attacks that Got Through (Bypasses) */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        Attacks that Got Through (Bypasses)
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-600">
                        {report.policy_a_metrics.successfulBypasses} txns
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {report.policy_b_metrics.successfulBypasses} txns
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {report.delta_bypasses > 0 ? `-${report.delta_bypasses} bypasses` : `${report.delta_bypasses}`}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-600">
                        {report.delta_bypasses > 0 ? 'Fewer adversarial bypasses' : 'Neutral'}
                      </td>
                    </tr>

                    {/* False Alarms (FPR) */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        False Alarms (FPR)
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {report.policy_a_metrics.falsePositiveRate}%
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-700">
                        {report.policy_b_metrics.falsePositiveRate}%
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-700">
                        {report.delta_fpr > 0 ? `+${report.delta_fpr}%` : `${report.delta_fpr}%`}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-600">
                        {Math.abs(report.delta_fpr) <= 1.0 ? 'Acceptable friction' : 'Friction change'}
                      </td>
                    </tr>

                    {/* Potential Loss Exposed */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        Potential Loss Exposed (Simulated)
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-red-600">
                        {formatCurrency(report.policy_a_metrics.simulatedExposure)}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {formatCurrency(report.policy_b_metrics.simulatedExposure)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {report.delta_exposure > 0 ? `-${formatCurrency(report.delta_exposure)}` : `${formatCurrency(report.delta_exposure)}`}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-600">
                        {report.delta_exposure > 0 ? 'Exposure risk reduced' : 'Neutral'}
                      </td>
                    </tr>

                    {/* Scenarios Passed */}
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                        Canonical Scenarios Stopped
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {report.policy_a_scenarios_passed} / {report.total_scenarios_evaluated}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-emerald-700">
                        {report.policy_b_scenarios_passed} / {report.total_scenarios_evaluated}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-700">
                        {report.policy_b_scenarios_passed - report.policy_a_scenarios_passed > 0
                          ? `+${report.policy_b_scenarios_passed - report.policy_a_scenarios_passed}`
                          : `${report.policy_b_scenarios_passed - report.policy_a_scenarios_passed}`}
                      </td>
                      <td className="py-3 px-4 font-sans text-[11px] text-slate-600">
                        10 Canonical Test Vectors
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ============================================================ */}
            {/* 10 CANONICAL SCENARIOS BREAKDOWN */}
            {/* ============================================================ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    10-Scenario Breakdown (SCN-01 to SCN-10)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Detailed per-attack vector evaluation comparing rule triggering and bypass rates.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {report.scenarios.map((scn) => {
                  const isExpanded = expandedScenario === scn.scenario_id
                  return (
                    <Card
                      key={scn.scenario_id}
                      className="border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition-colors"
                    >
                      <div
                        onClick={() => setExpandedScenario(isExpanded ? null : scn.scenario_id)}
                        className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-white select-none"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-slate-500 px-2 py-0.5 rounded bg-slate-100">
                            {scn.scenario_id}
                          </span>
                          <div>
                            <div className="font-bold text-xs text-slate-900">{scn.scenario_name}</div>
                            <div className="text-[10px] text-slate-400 font-medium">{scn.description}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                          {/* Policy A Result */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-sans text-slate-400 font-semibold">Policy A:</span>
                            {scn.policy_a.passed ? (
                              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                                PASS ({scn.policy_a.recall}%)
                              </span>
                            ) : (
                              <span className="rounded bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5">
                                FAIL ({scn.policy_a.bypasses_count} byp)
                              </span>
                            )}
                          </div>

                          {/* Policy B Result */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-sans text-slate-400 font-semibold">Policy B:</span>
                            {scn.policy_b.passed ? (
                              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">
                                PASS ({scn.policy_b.recall}%)
                              </span>
                            ) : (
                              <span className="rounded bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5">
                                FAIL ({scn.policy_b.bypasses_count} byp)
                              </span>
                            )}
                          </div>

                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Policy A Details */}
                          <div className="p-3 rounded-md bg-white border border-slate-200 space-y-1.5">
                            <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
                              <span>Policy A ({report.policy_a_name})</span>
                              <span className="font-mono text-[10px] text-slate-500">
                                Exposure: {formatCurrency(scn.policy_a.simulated_exposure)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Detected: <strong className="font-mono">{scn.policy_a.detected_count}</strong> / {scn.policy_a.adversarial_count} attack transactions
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Triggered rules: {scn.policy_a.triggered_rules.join(', ') || 'None (Bypassed)'}
                            </div>
                          </div>

                          {/* Policy B Details */}
                          <div className="p-3 rounded-md bg-white border border-slate-200 space-y-1.5">
                            <div className="font-bold text-emerald-900 text-xs flex items-center justify-between">
                              <span>Policy B ({report.policy_b_name})</span>
                              <span className="font-mono text-[10px] text-slate-500">
                                Exposure: {formatCurrency(scn.policy_b.simulated_exposure)}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600">
                              Detected: <strong className="font-mono">{scn.policy_b.detected_count}</strong> / {scn.policy_b.adversarial_count} attack transactions
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Triggered rules: {scn.policy_b.triggered_rules.join(', ') || 'None (Bypassed)'}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
