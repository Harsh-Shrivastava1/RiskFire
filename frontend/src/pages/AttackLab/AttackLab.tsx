import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAttackLab } from '@/hooks/useAttackLab'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Flame,
  ShieldCheck,
  Dices,
  ArrowRight,
  Sparkles,
  Users,
  CreditCard,
  RefreshCw,
  Gift,
  Network,
  Zap,
  Bot,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings2,
  AlertCircle,
} from 'lucide-react'
import { AttackAgentType } from '@/types'

const agentIcons: Record<AttackAgentType, React.ElementType> = {
  VELOCITY_ATTACKER: Zap,
  IDENTITY_FRAGMENTER: Users,
  REFUND_ABUSER: RefreshCw,
  PROMOTION_ABUSER: Gift,
  PAYMENT_ROTATOR: CreditCard,
  COORDINATED_CLUSTER: Network,
}

export const AttackLab: React.FC = () => {
  const navigate = useNavigate()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const {
    agents,
    policies,
    selectedPolicyId,
    setSelectedPolicyId,
    selectedAgentTypes,
    toggleAgent,
    difficulty,
    setDifficulty,
    seed,
    setSeed,
    randomizeSeed,
    legitimateCount,
    setLegitimateCount,
    attackCount,
    setAttackCount,
    loading,
    isLaunching,
    launchError,
    isGeneratingPlan,
    aiPlan,
    planError,
    generateAiPlan,
    launchSimulation,
  } = useAttackLab()

  if (loading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <LoadingState rows={5} />
      </div>
    )
  }

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId)
  const totalVolume = legitimateCount + attackCount

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Attack Lab"
        description="Safely test your payment controls using synthetic adversarial activity."
        badge={
          <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-xs font-mono font-bold">
            Synthetic Sandbox
          </span>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/simulations')}
            className="h-8 gap-1 text-xs"
          >
            <span>View Past Simulations</span>
            <ArrowRight className="h-3 w-3" />
          </Button>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Target Policy Banner */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 border border-blue-100 shrink-0">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Policy Under Test
                </span>
                <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.2 font-mono">
                  {selectedPolicy?.currentVersionNumber || 'v1.0.0'}
                </span>
              </div>
              <div className="text-sm font-bold text-slate-900">
                {selectedPolicy?.name || 'Default Security Policy'}
                <span className="ml-2 text-xs font-mono font-normal text-slate-500">
                  ({selectedPolicy?.id})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
              Change Target:
            </span>
            <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
              <SelectTrigger className="h-9 w-64 text-xs bg-white border-slate-300 font-semibold shadow-2xs">
                <SelectValue placeholder="Select Policy" />
              </SelectTrigger>
              <SelectContent>
                {policies.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs font-medium">
                    {p.name} ({p.currentVersionNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {launchError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{launchError}</span>
          </div>
        )}

        {/* ============================================================ */}
        {/* STEP 1: WHAT DO YOU WANT TO TEST? */}
        {/* ============================================================ */}
        <Card className="shadow-2xs p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Step 1 of 3
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                What attack strategy do you want to test?
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {selectedAgentTypes.length} selected
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent) => {
              const isSelected = selectedAgentTypes.includes(agent.type)
              const Icon = agentIcons[agent.type] || Zap
              return (
                <div
                  key={agent.id}
                  onClick={() => toggleAgent(agent.type)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-red-500 bg-red-50/40 shadow-xs ring-1 ring-red-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`p-2 rounded-md shrink-0 ${
                        isSelected ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs truncate">
                          {agent.name}
                        </span>
                        <span className="font-mono text-[9px] text-red-700 bg-red-100 px-1 py-0.2 rounded font-bold">
                          {agent.severityPotential}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                        {agent.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* ============================================================ */}
        {/* STEP 2 & 3: AGGRESSION & VOLUME */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Step 2: How aggressive? */}
          <Card className="shadow-2xs p-5 space-y-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Step 2 of 3
              </span>
              <h2 className="text-sm font-bold text-slate-900">How aggressive?</h2>
              <p className="text-xs text-slate-500">
                Controls the evasion sophistication and burst rate of the attack.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2">
              {(['LOW', 'MEDIUM', 'HIGH'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-2.5 rounded-lg text-xs font-bold transition-all border ${
                    difficulty === lvl
                      ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </Card>

          {/* Step 3: Transactions to simulate */}
          <Card className="shadow-2xs p-5 space-y-3">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">
                Step 3 of 3
              </span>
              <h2 className="text-sm font-bold text-slate-900">Transactions to simulate</h2>
              <p className="text-xs text-slate-500">
                Synthetic transaction volume for this simulation run.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Input
                type="number"
                value={totalVolume}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 100
                  const attacks = Math.round(val * 0.3)
                  setAttackCount(attacks)
                  setLegitimateCount(val - attacks)
                }}
                className="h-10 text-sm font-mono font-bold text-slate-900 bg-white"
              />
              <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                transactions
              </span>
            </div>
          </Card>
        </div>

        {/* ============================================================ */}
        {/* PRIMARY RUN ACTION */}
        {/* ============================================================ */}
        <div className="rounded-xl border border-red-200 bg-linear-to-r from-red-50/40 via-white to-white p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Ready to test:</span>
              <span className="text-xs font-semibold text-slate-600">
                {selectedPolicy?.name || 'Default Policy'} • {selectedAgentTypes.length} strategies • {difficulty} aggression • {totalVolume} txns
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Evaluates policies in the sandbox. Any discovered bypasses are logged to Issues with full evidence.
            </p>
          </div>

          <Button
            onClick={launchSimulation}
            disabled={isLaunching || selectedAgentTypes.length === 0}
            className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-10 px-6 gap-2 shadow-2xs shrink-0"
          >
            <Flame className="h-4 w-4 fill-white/20" />
            <span>{isLaunching ? 'Running Simulation...' : 'Run Attack Simulation'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* ============================================================ */}
        {/* ADVANCED CONFIGURATION (COLLAPSIBLE) */}
        {/* ============================================================ */}
        <Card className="shadow-2xs">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center justify-between w-full p-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-slate-500" />
              <span>Advanced Configuration</span>
            </span>
            {showAdvanced ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>

          {showAdvanced && (
            <div className="p-5 pt-0 border-t border-slate-100 space-y-5 text-xs">
              {/* Target Policy */}
              <div className="space-y-1.5 pt-3">
                <label className="font-semibold text-slate-700">Target Risk Policy</label>
                <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select Policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.currentVersionNumber} • {p.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seed & Reproducibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">
                    Deterministic Seed (Reproducibility)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={seed}
                      onChange={(e) => setSeed(parseInt(e.target.value) || 1)}
                      className="h-9 text-xs font-mono font-bold text-blue-700 bg-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={randomizeSeed}
                      className="h-9 gap-1 text-xs"
                      title="Generate Random Seed"
                    >
                      <Dices className="h-4 w-4 text-slate-600" />
                    </Button>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Same seed produces identical synthetic transactions and adversarial decisions.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Traffic Breakdown</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500">Legitimate</span>
                      <Input
                        type="number"
                        value={legitimateCount}
                        onChange={(e) => setLegitimateCount(parseInt(e.target.value) || 100)}
                        className="h-8 text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">Adversarial</span>
                      <Input
                        type="number"
                        value={attackCount}
                        onChange={(e) => setAttackCount(parseInt(e.target.value) || 50)}
                        className="h-8 text-xs font-mono font-bold text-red-600 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Attack Planner Strategy Formulator */}
              <div className="rounded-lg border border-purple-200 bg-purple-50/20 p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-purple-950 text-xs">
                      AI Red-Team Attack Planner (Reasoning Engine)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    onClick={generateAiPlan}
                    disabled={isGeneratingPlan}
                    className="h-7 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1 font-semibold"
                  >
                    {isGeneratingPlan ? (
                      <>
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        <span>Formulating Plan...</span>
                      </>
                    ) : (
                      <>
                        <Bot className="h-3 w-3" />
                        <span>Formulate AI Plan</span>
                      </>
                    )}
                  </Button>
                </div>

                {planError && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-[11px] text-red-700">
                    {planError}
                  </div>
                )}

                {aiPlan ? (
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between border-b border-purple-100 pb-1">
                      <span className="font-semibold text-purple-900">Suggested Strategy:</span>
                      <span className="font-mono text-purple-700 font-bold">{aiPlan.attack_type}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{aiPlan.objective}</p>
                    <div className="rounded bg-white border border-purple-200 p-2.5 space-y-1 font-mono text-[10px]">
                      <div>
                        <span className="text-slate-500 font-sans font-semibold">Strategic Actors: </span>
                        <span className="text-purple-800 font-bold">{aiPlan.actors_count} synthetic identities</span>
                        {aiPlan.shared_device && <span className="text-red-600 font-bold"> • Shared Hardware Device</span>}
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans font-semibold">Volume: </span>
                        <span className="text-purple-800 font-bold">{aiPlan.transaction_count} txns ({aiPlan.duration_minutes}m)</span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-sans font-semibold">Rationale: </span>
                        <span className="text-slate-700 font-sans">{aiPlan.reasoning}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Let AI analyze the target policy rules and propose a tailored adversarial bypass vector.
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}

