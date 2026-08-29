import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useLiveSimulation } from '@/hooks/useLiveSimulation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Activity,
  Play,
  Pause,
  Square,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Terminal,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Flame,
  Zap,
  ArrowDown,
  Layers,
  Sparkles,
} from 'lucide-react'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const phases = [
  { id: 'INITIALIZATION', label: '1. Seed & Context' },
  { id: 'ENTITY_POOL', label: '2. Entity Pools' },
  { id: 'ATTACK_EXECUTION', label: '3. Attack Execution' },
  { id: 'RISK_EVALUATION', label: '4. Policy Evaluation' },
  { id: 'VULNERABILITY_ANALYSIS', label: '5. Vuln Discovery' },
  { id: 'EXPOSURE_CALCULATION', label: '6. Exposure Calc' },
  { id: 'COMPLETED', label: '7. Completed' },
]

export const LiveSimulation: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const simId = searchParams.get('id') || 'sim-142'
  const [showRawStream, setShowRawStream] = useState(false)

  const {
    isRunning,
    isPaused,
    currentPhase,
    processedCount,
    totalCount,
    progressPercent,
    bypassesCount,
    simulatedExposure,
    activePolicyName,
    activeSeed,
    activeScenario,
    currentPipelineTxn,
    events,
    togglePause,
    stopSimulation,
  } = useLiveSimulation(simId)

  const hasBypasses = bypassesCount > 0
  const isCompleted = !isRunning && (currentPhase === 'COMPLETED' || progressPercent === 100)

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Live Simulation Monitor"
        description="Streaming telemetry of deterministic transaction execution, policy decisions, and live bypass identification."
        badge={
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-800">
              RUN: {simId}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
              SEED: {activeSeed}
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            {isRunning ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePause}
                  className="h-8 gap-1.5 text-xs font-semibold border-slate-300"
                >
                  {isPaused ? <Play className="h-3.5 w-3.5 text-emerald-600 fill-emerald-600" /> : <Pause className="h-3.5 w-3.5 text-amber-600" />}
                  <span>{isPaused ? 'Resume' : 'Pause'}</span>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopSimulation}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Stop</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/attack-graph')}
                  className="h-8 gap-1.5 text-xs font-semibold border-slate-300"
                >
                  <span>View Attack Graph</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/vulnerabilities')}
                  className="h-8 gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs"
                >
                  <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                  <span>View Discovered Weaknesses</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* ============================================================ */}
        {/* ATTACK VS DEFENSE EXPLANATION CARD (A & D) */}
        {/* ============================================================ */}
        <Card className="p-5 shadow-2xs border-slate-200 bg-linear-to-r from-slate-50 via-white to-white space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                <span>Testing how well this policy stops simulated attacks</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                RiskFire is running synthetic attacks against the selected policy and recording which transactions are stopped, flagged, or allowed through.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold font-mono self-start sm:self-auto ${
                isRunning
                  ? isPaused
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-blue-100 text-blue-900 border border-blue-300 animate-pulse'
                  : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
              }`}
            >
              {isRunning ? (isPaused ? '● PAUSED' : '● EXECUTING LIVE') : '✓ COMPLETED'}
            </span>
          </div>

          {/* Pipeline Activity Visualization */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-1 text-xs">
            {/* Step 1: Attack Scenario */}
            <div className="rounded-lg border border-orange-200 bg-orange-50/40 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-600" />
                  1. Attack Scenario
                </span>
                <div className="font-bold text-slate-900 mt-1 line-clamp-1">{activeScenario.name}</div>
                <div className="font-mono text-[10px] text-orange-700 mt-0.5">{activeScenario.id}</div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                {activeScenario.activity}
              </p>
            </div>

            {/* Step 2: Synthetic Transaction */}
            <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Activity className="h-3 w-3 text-blue-600" />
                  2. Synthetic Transaction
                </span>
                <div className="font-mono font-bold text-slate-900 mt-1">
                  {currentPipelineTxn.id}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 mt-0.5">
                  <span>{currentPipelineTxn.accountId}</span>
                  <span>•</span>
                  <span>{currentPipelineTxn.deviceId}</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] font-semibold text-slate-800">
                Amount: <span className="font-mono">{formatCurrency(currentPipelineTxn.amount)}</span>
              </div>
            </div>

            {/* Step 3: Policy Evaluation */}
            <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 flex items-center gap-1">
                  <Layers className="h-3 w-3 text-blue-600" />
                  3. Policy Evaluation
                </span>
                <div className="font-bold text-slate-900 mt-1 line-clamp-1">
                  {activePolicyName}
                </div>
                <div className="font-mono text-[10px] text-blue-700 mt-0.5">Rule: {currentPipelineTxn.ruleTriggered}</div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                Matching velocity & ceiling constraints
              </p>
            </div>

            {/* Step 4: Decision Result */}
            <div
              className={`rounded-lg border p-3 flex flex-col justify-between ${
                currentPipelineTxn.decision === 'BYPASSED'
                  ? 'border-red-300 bg-red-50/50 text-red-950'
                  : 'border-emerald-300 bg-emerald-50/50 text-emerald-950'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  4. Live Decision
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold font-mono ${
                      currentPipelineTxn.decision === 'BYPASSED'
                        ? 'bg-red-600 text-white'
                        : currentPipelineTxn.decision === 'FLAGGED'
                        ? 'bg-amber-500 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {currentPipelineTxn.decision}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-2">
                {currentPipelineTxn.decision === 'BYPASSED'
                  ? 'Adversarial evasion logged'
                  : 'Defensive rule successfully triggered'}
              </p>
            </div>
          </div>
        </Card>

        {/* Phase Progress Pipeline */}
        <Card className="p-4 shadow-2xs border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <Activity className={`h-4 w-4 ${isRunning ? 'text-blue-600 animate-pulse' : 'text-emerald-600'}`} />
              <span className="font-semibold text-slate-800">
                Current Phase:{' '}
                <span className="font-mono text-blue-700 font-bold">{currentPhase}</span>
              </span>
            </div>
            <div className="font-mono text-slate-600 font-bold">
              {formatNumber(processedCount)} / {formatNumber(totalCount)} txns ({progressPercent}%)
            </div>
          </div>

          <Progress value={progressPercent} className="h-2.5 bg-slate-100" />

          {/* Stepper indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-4 text-[11px]">
            {phases.map((p, idx) => {
              const currentIdx = phases.findIndex((x) => x.id === currentPhase)
              const isPast = idx < currentIdx || currentPhase === 'COMPLETED'
              const isCurrent = idx === currentIdx && currentPhase !== 'COMPLETED'

              return (
                <div
                  key={p.id}
                  className={`p-2 rounded-lg border text-center transition-all ${
                    isCurrent
                      ? 'border-blue-500 bg-blue-50/80 font-bold text-blue-900 ring-1 ring-blue-400 shadow-2xs'
                      : isPast
                      ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800 font-medium'
                      : 'border-slate-200 bg-slate-50/40 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isPast ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    <span className="truncate">{p.label}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Live Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 shadow-2xs border-slate-200 bg-white">
            <span className="text-xs font-semibold text-slate-500">Target Policy</span>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 truncate">
                {activePolicyName}
              </span>
              <span className="rounded bg-blue-100 text-blue-700 text-[10px] font-mono font-bold px-1.5 py-0.5 ml-2 shrink-0">
                ACTIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Merchant security rules under test</p>
          </Card>

          <Card className="p-4 shadow-2xs border-red-200 bg-red-50/20">
            <span className="text-xs font-semibold text-red-900">Attacks That Got Through</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-700 font-mono">
                {bypassesCount}
              </span>
              <span className="text-xs text-red-600 font-medium">transactions</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Synthetic attacks that bypassed rules</p>
          </Card>

          <Card className="p-4 shadow-2xs border-red-200 bg-red-50/20">
            <span className="text-xs font-semibold text-red-900">Simulated Financial Exposure</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-red-700 font-mono">
                {formatCurrency(simulatedExposure)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Gross synthetic monetary risk exposed</p>
          </Card>
        </div>

        {/* Live Activity Feed */}
        <Card className="p-4 shadow-2xs border-slate-200 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-blue-600" />
              <span>Live Activity Stream</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Showing latest execution events
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {events.length > 0 ? (
              events.slice(0, 6).map((evt, idx) => {
                const meta = evt.metadata || {}
                const isBypass = meta.decision === 'ALLOWED' || evt.eventType === 'BYPASS_DETECTED'
                return (
                  <div
                    key={evt.id || idx}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                      isBypass
                        ? 'border-red-200 bg-red-50/40 text-red-950'
                        : 'border-slate-100 bg-slate-50/50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`h-2 w-2 rounded-full shrink-0 ${
                          isBypass ? 'bg-red-500' : 'bg-emerald-500'
                        }`}
                      />
                      <span className="font-mono text-slate-500 text-[11px]">
                        {evt.simTimestamp ? evt.simTimestamp.slice(11, 19) : '09:42:11'}
                      </span>
                      <span className="font-bold font-mono text-slate-900">
                        {meta.transactionId || `TXN-${1000 + idx * 23}`}
                      </span>
                      <span className="text-slate-500 hidden sm:inline">
                        ({meta.accountId || `ACC-${8000 + idx}`})
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium text-slate-700">
                        {formatCurrency(meta.amount || 24500)}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                          isBypass
                            ? 'bg-red-100 text-red-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isBypass ? '! Bypassed' : '✓ Blocked'}
                      </span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg border border-slate-100 bg-slate-50/50 text-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-mono text-slate-500 text-[11px]">09:42:11</span>
                    <span className="font-bold font-mono text-slate-900">TXN-1842</span>
                    <span className="text-slate-500 hidden sm:inline">(ACC-1842)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-slate-700">₹24,500</span>
                    <span className="rounded px-1.5 py-0.2 text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      ✓ Blocked
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg border border-red-200 bg-red-50/40 text-red-950">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
                    <span className="font-mono text-slate-500 text-[11px]">09:42:12</span>
                    <span className="font-bold font-mono text-slate-900">TXN-1843</span>
                    <span className="text-slate-500 hidden sm:inline">(ACC-9921)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-medium text-slate-700">₹68,000</span>
                    <span className="rounded px-1.5 py-0.2 text-[10px] font-mono font-bold bg-red-100 text-red-800">
                      ! Bypassed
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Collapsible Raw Event Stream Terminal */}
        <Card className="shadow-2xs overflow-hidden border-slate-800">
          <button
            type="button"
            onClick={() => setShowRawStream(!showRawStream)}
            className="w-full bg-slate-900 text-slate-100 py-3 px-4 flex items-center justify-between hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs font-mono">
              <Terminal className="h-4 w-4 text-emerald-400" />
              <span>View Raw Event Stream ({events.length} events recorded)</span>
              {isRunning && !isPaused && (
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            {showRawStream ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showRawStream && (
            <div className="bg-slate-950 p-4 max-h-80 overflow-y-auto font-mono text-xs text-slate-300 space-y-1.5">
              {events.map((evt, idx) => {
                const meta = evt.metadata || {}
                const isBypass = meta.decision === 'ALLOWED' || evt.eventType === 'BYPASS_DETECTED'
                return (
                  <div
                    key={evt.id || idx}
                    className={`flex items-start gap-3 py-1 px-2 rounded ${
                      isBypass ? 'bg-red-950/40 text-red-300 border-l-2 border-red-500' : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0 text-[10px]">
                      [{evt.simTimestamp ? evt.simTimestamp.slice(11, 19) : '00:00:00'}]
                    </span>
                    <span className="text-slate-400 font-semibold shrink-0">#{evt.sequenceNum}</span>
                    <span className="font-bold shrink-0">{meta.transactionId || 'txn'}</span>
                    <span className="text-slate-400 shrink-0">({meta.accountId || 'acc'})</span>
                    <span className="text-slate-300 shrink-0">{formatCurrency(meta.amount || 0)}</span>
                    <span
                      className={`font-bold shrink-0 text-[11px] ${
                        isBypass ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      → {meta.decision || 'EVALUATED'}
                    </span>
                    <span className="text-slate-400 truncate text-[11px]">
                      [{meta.ruleTriggered || 'POL-VELOCITY-001'}]
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Post-Simulation Next Steps */}
        {isCompleted && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
            <div className="space-y-1 text-xs">
              <span className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Simulation Complete — {bypassesCount} Attacks Got Through</span>
              </span>
              <p className="text-emerald-800">
                {formatNumber(totalCount)} / {formatNumber(totalCount)} transactions tested with {formatCurrency(simulatedExposure)} potential simulated exposure recorded.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/attack-graph')}
                className="text-xs border-emerald-300 hover:bg-emerald-100/50 text-emerald-900 font-semibold"
              >
                <span>View Attack Graph</span>
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/patches')}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold shadow-2xs"
              >
                <span>View Defensive Patches</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
