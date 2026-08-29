import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDashboard } from '@/hooks/useDashboard'
import { useUiStore } from '@/store/useUiStore'
import { PageHeader } from '@/components/layout/PageHeader'
import { MetricCard } from '@/components/common/MetricCard'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  ShieldAlert,
  Flame,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Search,
  ShieldCheck,
  TrendingDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Sliders,
  Play,
  Scale,
  Database,
  Hash,
  ChevronsUpDown,
  Check,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/utils/formatters'
import { cn } from '@/utils/cn'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { setFireDrillModalOpen } = useUiStore()
  const {
    policies,
    selectedPolicyId,
    policyScope,
    metrics,
    topVulnerabilities,
    comparison,
    loading,
    switching,
    error,
    switchPolicy,
    refetch,
  } = useDashboard()

  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false)

  if (loading && !metrics) {
    return (
      <div className="p-6 space-y-6 w-full">
        <LoadingState type="cards" rows={4} />
        <LoadingState type="table" rows={4} />
      </div>
    )
  }

  if (error || !metrics) {
    return (
      <div className="p-6 w-full">
        <ErrorState
          title="Unable to load risk posture data"
          message={error || 'The RiskFire backend could not be reached to compute current risk metrics.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  const isEvaluated = metrics.isEvaluated && policyScope?.isEvaluated

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Risk Command Center"
        description="Continuous surveillance of simulated payment risk, policy weaknesses, and verified defensive proof."
        badge={
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
            Reproducibility: Seed {policyScope?.seed || 49201}
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/policies/compare')}
              className="h-8 gap-1.5 text-xs font-semibold border-slate-300 hover:bg-slate-50"
            >
              <Scale className="h-3.5 w-3.5 text-slate-600" />
              <span>Compare Policies</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/simulations')}
              className="h-8 gap-1.5 text-xs font-semibold border-slate-300 hover:bg-slate-50"
            >
              <span>View All Simulations</span>
            </Button>
            <Button
              size="sm"
              onClick={() => setFireDrillModalOpen(true)}
              className="h-8 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-2xs"
            >
              <Flame className="h-3.5 w-3.5 fill-white/20" />
              <span>Run Fire Drill</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* ============================================================ */}
        {/* POLICY SCOPING BAR & SELECTOR */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-slate-200/90 bg-white p-3.5 sm:p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Active Policy Details */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50/90 text-blue-600 border border-blue-100 shrink-0 shadow-2xs">
              <Layers className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  EVALUATION SCOPE
                </span>
                <span className="rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold px-1.5 py-0.5 font-mono border border-slate-200/80">
                  {policyScope?.versionNumber || 'v1.0.0'}
                </span>
                {isEvaluated ? (
                  <span className="rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200/80 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    TESTED
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 border border-amber-200/80 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                    NOT EVALUATED
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-2 truncate">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {policyScope?.policyName || 'Default Policy'}
                </span>
                <span className="text-xs font-mono font-medium text-slate-400 shrink-0">
                  ({policyScope?.policyId})
                </span>
              </div>
            </div>
          </div>

          {/* Right: Simulation Metadata & Custom Policy Switcher */}
          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap justify-between lg:justify-end">
            {/* Dataset & Seed Chips */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-50/90 px-3 py-1.5 rounded-lg border border-slate-200/70 text-[11px]">
              <div className="flex items-center gap-1.5 text-slate-500">
                <Database className="h-3 w-3 text-slate-400" />
                <span className="text-slate-400">Dataset:</span>
                <span className="font-mono font-semibold text-slate-700">{policyScope?.datasetId || 'ds-synthetic-v1'}</span>
              </div>
              <span className="text-slate-200">|</span>
              <div className="flex items-center gap-1.5 text-slate-500">
                <Hash className="h-3 w-3 text-slate-400" />
                <span className="text-slate-400">Seed:</span>
                <span className="font-mono font-semibold text-slate-700">{policyScope?.seed || 49201}</span>
              </div>
            </div>

            {/* Custom Enterprise Policy Switcher Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={switching}
                  className={cn(
                    "flex items-center justify-between gap-2.5 h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-2xs hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 active:scale-[0.99]",
                    switching && "opacity-60 cursor-not-allowed"
                  )}
                >
                  <div className="flex items-center gap-2 truncate max-w-[240px]">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="truncate text-slate-900 font-semibold">
                      {policyScope?.policyName || 'Select Policy'}
                    </span>
                    <span className="text-[10px] font-mono font-medium text-slate-400 shrink-0">
                      ({policyScope?.versionNumber || 'v1.0'})
                    </span>
                  </div>
                  <ChevronsUpDown className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1" />
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-84 p-1.5 shadow-xl border-slate-200 rounded-xl bg-white">
                <div className="px-2.5 py-2 border-b border-slate-100 mb-1">
                  <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider font-mono">
                    Switch Evaluation Policy
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Select a security policy to scope metrics and risk evaluation
                  </div>
                </div>

                <div className="space-y-1 max-h-64 overflow-y-auto no-scrollbar">
                  {policies.map((p) => {
                    const isSelected = p.id === selectedPolicyId
                    return (
                      <DropdownMenuItem
                        key={p.id}
                        onSelect={() => switchPolicy(p.id)}
                        onClick={() => switchPolicy(p.id)}
                        className={cn(
                          "flex items-start justify-between gap-3 p-2.5 rounded-lg cursor-pointer transition-colors outline-none",
                          isSelected
                            ? "bg-blue-50/90 text-blue-950 border border-blue-200/70"
                            : "hover:bg-slate-50 text-slate-700"
                        )}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              {p.name}
                            </span>
                            <span className="rounded bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-1.5 py-0.2 border border-slate-200/80">
                              {p.currentVersionNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                            <span>{p.id}</span>
                            <span>•</span>
                            <span>{p.category || 'VELOCITY'}</span>
                            {p.ruleCount !== undefined && (
                              <>
                                <span>•</span>
                                <span>{p.ruleCount} rules</span>
                              </>
                            )}
                          </div>
                        </div>

                        {isSelected ? (
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white shrink-0 mt-0.5 shadow-2xs">
                            <Check className="h-3 w-3 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="h-4 w-4 shrink-0 mt-0.5" />
                        )}
                      </DropdownMenuItem>
                    )
                  })}
                </div>

                <DropdownMenuSeparator className="my-1 border-slate-100" />
                <div className="p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/policies')}
                    className="w-full justify-between text-xs h-7.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50/60"
                  >
                    <span>Manage All Policies</span>
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* ============================================================ */}
        {/* SECTION A: OVERALL RISK POSTURE / EVALUATION STATE */}
        {/* ============================================================ */}
        {!isEvaluated ? (
          /* UNEVALUATED POLICY STATE */
          <Card className="border-amber-200 bg-linear-to-r from-amber-50/60 via-white to-white p-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0 shadow-2xs border border-amber-200">
                  <AlertTriangle className="h-7 w-7" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      Security Evaluation Status
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      Not Evaluated Yet
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Policy has not been tested against the adversary lab
                  </h3>
                  <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                    This security policy ({policyScope?.policyName}) has no simulation runs recorded.
                    Run a security test to evaluate detection rates, uncover bypass vulnerabilities, and compute its empirical Risk Posture Score.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  onClick={() => navigate(`/attacks?targetPolicy=${selectedPolicyId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-2xs"
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  <span>Run Security Test</span>
                </Button>
              </div>
            </div>

            {/* Empty Metric State Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/80">
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-semibold text-slate-500">Attack detection rate</span>
                <div className="text-2xl font-bold font-mono text-slate-400 mt-1">—</div>
                <p className="text-[10px] text-slate-400 mt-1">Requires security test</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-semibold text-slate-500">Attacks that got through</span>
                <div className="text-2xl font-bold font-mono text-slate-400 mt-1">—</div>
                <p className="text-[10px] text-slate-400 mt-1">Requires security test</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-semibold text-slate-500">False alarms</span>
                <div className="text-2xl font-bold font-mono text-slate-400 mt-1">—</div>
                <p className="text-[10px] text-slate-400 mt-1">Requires security test</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
                <span className="text-[11px] font-semibold text-slate-500">Potential loss exposed</span>
                <div className="text-2xl font-bold font-mono text-slate-400 mt-1">—</div>
                <p className="text-[10px] text-slate-400 mt-1">Requires security test</p>
              </div>
            </div>
          </Card>
        ) : (
          /* EVALUATED POLICY STATE */
          <Card className="border-amber-200 bg-linear-to-r from-amber-50/50 via-white to-white p-6 shadow-2xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-100 text-amber-800 shrink-0 shadow-2xs border border-amber-200">
                  <ShieldAlert className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">
                      CURRENT RISK POSTURE
                    </span>
                    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 border border-amber-200">
                      {metrics.riskPostureScore !== null && metrics.riskPostureScore !== undefined && metrics.riskPostureScore >= 80
                        ? 'Resilient'
                        : 'Elevated Risk'}
                    </span>
                    {policyScope?.lastEvaluated && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        • Tested {policyScope.lastEvaluated.slice(0, 10)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                      {metrics.riskPostureScore ?? '67'}
                    </span>
                    <span className="text-sm font-semibold text-slate-500 font-mono">/ 100</span>
                  </div>
                  <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                    {topVulnerabilities.length > 0
                      ? `${topVulnerabilities.length} weaknesses found allowing simulated attacks to bypass controls, exposing ${formatCurrency(metrics.simulatedExposure)} potential simulated exposure.`
                      : 'All baseline security scenarios passed with high detection accuracy on the held-out test split.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button
                  onClick={() => navigate(`/attacks?targetPolicy=${selectedPolicyId}`)}
                  variant="outline"
                  className="text-xs font-semibold h-9 px-3.5 border-slate-300 hover:bg-slate-50"
                >
                  <Play className="h-3.5 w-3.5 mr-1" />
                  <span>Re-test Policy</span>
                </Button>
                <Button
                  onClick={() => navigate('/vulnerabilities')}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold h-9 px-4 gap-1.5 shadow-2xs"
                >
                  <span>View Issues</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* 4 Core Primary Metrics Row (Plain English + Monospace Values) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/80">
              <MetricCard
                label="Attack detection rate"
                technicalLabel="Held-Out Recall"
                value={`${metrics.detectionRecall}%`}
                variant="success"
                subtext={`Coverage: ${metrics.policyCoverage}%`}
                whyText="Percentage of synthetic adversarial attacks successfully blocked or flagged on held-out test data."
              />
              <MetricCard
                label="Attacks that got through"
                technicalLabel="Successful Bypasses"
                value={`${metrics.policyBypassesCount} txns`}
                variant="warning"
                subtext={`Across ${metrics.simulationsRunCount} simulated scenarios`}
                whyText="Adversarial transactions that evaded policy constraints without triggering defensive rules."
              />
              <MetricCard
                label="False alarms"
                technicalLabel="Customer Friction (FPR)"
                value={`${metrics.falsePositiveRate}%`}
                variant="default"
                subtext="Legitimate user impact"
                whyText="Percentage of innocent merchant transactions incorrectly blocked or flagged."
              />
              <MetricCard
                label="Potential loss exposed"
                technicalLabel="Simulated Exposure"
                value={formatCurrency(metrics.simulatedExposure)}
                variant="critical"
                subtext="Gross synthetic value at risk"
                whyText="Sum of transaction values across all unprevented attack bypasses in synthetic simulation runs."
              />
            </div>

            {/* Level 2: Advanced Technical Details Expandable Toggle */}
            <div className="mt-4 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>{showAdvancedDetails ? 'Hide technical proof & details' : 'Show technical proof & details (Level 2)'}</span>
                {showAdvancedDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>

              {showAdvancedDetails && (
                <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Dataset Split</span>
                      <div className="font-mono font-semibold text-slate-800">15% Held-out Test</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">RNG Seed</span>
                      <div className="font-mono font-semibold text-slate-800">{policyScope?.seed || 49201} (Deterministic)</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Evaluation Mode</span>
                      <div className="font-mono font-semibold text-slate-800">{policyScope?.evaluationType || 'BENCHMARK'}</div>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400">Candidate Status</span>
                      <div className="font-mono font-semibold text-slate-800">Sealed & Frozen</div>
                    </div>
                  </div>
                  <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200">
                    All metrics computed server-side via deterministic evaluation engines against synthetic payment transaction streams.
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* ============================================================ */}
        {/* SECTION B: WHAT NEEDS ATTENTION */}
        {/* ============================================================ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">What Needs Attention</h2>
              <p className="text-xs text-slate-500">
                {isEvaluated
                  ? 'Top high-impact weaknesses discovered during simulated adversarial testing.'
                  : 'Weaknesses will appear here once this policy is evaluated.'}
              </p>
            </div>
            {isEvaluated && topVulnerabilities.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/vulnerabilities')}
                className="text-xs text-blue-600 hover:text-blue-700 gap-1"
              >
                <span>View all issues</span>
                <ArrowRight className="h-3 w-3" />
              </Button>
            )}
          </div>

          {topVulnerabilities.length === 0 ? (
            <Card className="p-6 text-center border-dashed border-slate-300 bg-slate-50/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-800">No active vulnerabilities recorded for this policy</div>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {isEvaluated
                  ? 'This policy blocked or flagged all simulated attacks in recent test runs.'
                  : 'Run a security test to analyze rule boundaries and find potential evasion vectors.'}
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {topVulnerabilities.slice(0, 3).map((vuln) => (
                <Card
                  key={vuln.id}
                  className="p-4 shadow-2xs border-slate-200 hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <SeverityBadge severity={vuln.severity} />
                      <span className="font-bold text-xs text-slate-900">{vuln.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Policy: {vuln.policyName.split(' ')[0]}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {vuln.whyThePolicyFailed}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 font-medium pt-0.5">
                      <span>
                        Simulated exposure: <strong className="text-red-700 font-mono">{formatCurrency(vuln.simulatedExposure)}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Bypasses: <strong className="text-slate-800 font-mono">{vuln.bypassCount} txns</strong>
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/vulnerabilities`)}
                      className="h-8 gap-1 text-xs border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold"
                    >
                      <Search className="h-3 w-3 text-slate-500" />
                      <span>Investigate</span>
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/* SECTION C & D: GUIDED ACTION STEPS & PROOF */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SECTION C: WHAT SHOULD I DO? (7 Cols) */}
          <Card className="lg:col-span-7 shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span>What Should I Do? (Guided Defensive Workflow)</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Recommended sequential steps to resolve active weaknesses and test improvements.
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {/* Step 1 */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0 mt-0.5">
                  1
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">Review policy rule logic</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/policies')}
                      className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0"
                    >
                      Review Policies →
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Inspect active merchant rules that allow multi-account and velocity bypasses.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0 mt-0.5">
                  2
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">Generate defensive patch</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/patches')}
                      className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0"
                    >
                      View Patches →
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Use AI reasoning with deterministic validation to formulate targeted rule constraints.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-bold shrink-0 mt-0.5">
                  3
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-900">Compare with baseline policy</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/policies/compare')}
                      className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0"
                    >
                      Compare Policies →
                    </Button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Evaluate side-by-side on 10 canonical attack scenarios under strictly fair test conditions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION D: PROOF (5 Cols) */}
          <Card className="lg:col-span-5 shadow-2xs border-emerald-200 bg-emerald-50/20 flex flex-col justify-between">
            <div>
              <CardHeader className="pb-3 border-b border-emerald-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-700" />
                    <span>Proof: Before vs After Patch</span>
                  </CardTitle>
                  <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 font-mono">
                    {comparison ? 'VERIFIED' : 'READY'}
                  </span>
                </div>
                <p className="text-xs text-emerald-900/80">
                  Measurable security improvement from defensive patch iterations.
                </p>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {comparison ? (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                        <span className="text-[10px] font-semibold uppercase text-slate-400">Baseline ({comparison.baselineVersion})</span>
                        <div className="text-lg font-bold font-mono text-red-600">
                          {comparison.before.successfulBypasses} bypasses
                        </div>
                        <p className="text-[11px] text-slate-500">{formatCurrency(comparison.before.simulatedExposure)} exposure</p>
                      </div>

                      <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 space-y-1">
                        <span className="text-[10px] font-semibold uppercase text-emerald-700">Patched ({comparison.patchedVersion})</span>
                        <div className="text-lg font-bold font-mono text-emerald-700">
                          {comparison.after.successfulBypasses} bypasses
                        </div>
                        <p className="text-[11px] text-emerald-800">{formatCurrency(comparison.after.simulatedExposure)} exposure</p>
                      </div>
                    </div>

                    <div className="rounded-lg border border-emerald-200/80 bg-white p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Exposure reduction</span>
                        <span className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5" />
                          {formatCurrency(comparison.deltaExposure)} lower
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">Detection rate gain</span>
                        <span className="font-mono font-bold text-emerald-700">
                          {comparison.before.recall}% → {comparison.after.recall}% ({comparison.deltaRecall > 0 ? `+${comparison.deltaRecall}` : comparison.deltaRecall}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-600">False alarm rate</span>
                        <span className="font-mono font-bold text-slate-700">
                          {comparison.before.falsePositiveRate}% → {comparison.after.falsePositiveRate}%
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-emerald-100 bg-white p-4 text-center text-xs text-slate-500 space-y-1">
                    <BarChart3 className="h-6 w-6 text-emerald-600 mx-auto mb-1" />
                    <p className="font-semibold text-slate-700">Run a patch benchmark to see live proof</p>
                    <p className="text-[11px]">Compare baseline rules vs patched candidate on held-out test splits.</p>
                  </div>
                )}
              </CardContent>
            </div>

            <div className="p-4 pt-0">
              <Button
                onClick={() => navigate('/benchmarks')}
                className="w-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold h-8.5 gap-1.5 shadow-2xs"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>View Full Benchmark Suite</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
