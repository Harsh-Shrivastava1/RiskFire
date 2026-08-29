import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSimulations } from '@/hooks/useSimulations'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Search,
  Flame,
  Activity,
  Layers,
  ShieldAlert,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { SimulationRun, SimulationStatus } from '@/types'
import { formatCurrency, formatNumber, formatDate } from '@/utils/formatters'

const statusOptions: { label: string; value: SimulationStatus | 'ALL' }[] = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Running', value: 'RUNNING' },
  { label: 'Pending', value: 'PENDING' },
]

export const Simulations: React.FC = () => {
  const navigate = useNavigate()
  const {
    simulations,
    totalCount,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch,
  } = useSimulations()

  const [selectedRun, setSelectedRun] = useState<SimulationRun | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const openDetail = (sim: SimulationRun) => {
    setSelectedRun(sim)
    setDetailOpen(true)
  }

  const toggleExpand = (id: string) => {
    setExpandedRowId(expandedRowId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <LoadingState rows={6} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 w-full">
        <ErrorState
          title="Unable to load simulation records"
          message={error || 'Could not connect to the RiskFire simulation archive.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Simulations"
        description="Safely test your payment controls using synthetic adversarial activity."
        badge={
          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
            {totalCount} Total Runs
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/simulations/live')}
              className="h-8 gap-1.5 text-xs"
            >
              <Activity className="h-3.5 w-3.5 text-blue-600" />
              <span>Live Monitor</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/attack-lab')}
              className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
            >
              <Flame className="h-3.5 w-3.5" />
              <span>Run Simulation</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-4 w-full">
        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by Run ID, Policy, or Seed..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            {statusOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Simulations List */}
        {simulations.length === 0 ? (
          <EmptyState
            title="No simulation runs found"
            description="Run a simulation to see how your current payment controls respond to adversarial activity."
            actionLabel="Run Simulation"
            onAction={() => navigate('/attack-lab')}
          />
        ) : (
          <div className="space-y-3">
            {simulations.map((sim) => {
              const isExpanded = expandedRowId === sim.id
              const bypassPct = Math.round((sim.bypassesFound / (sim.attackTransactionsCount || 1)) * 100)

              return (
                <Card
                  key={sim.id}
                  className="shadow-2xs border-slate-200 hover:border-slate-300 transition-all overflow-hidden"
                >
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <StatusBadge status={sim.status} />
                        <span className="font-bold text-xs text-slate-900 font-mono">
                          {sim.id}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          • {sim.policyName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({formatDate(sim.startedAt)})
                        </span>
                      </div>

                      {/* Human Outcome Summary */}
                      <div className="flex items-center gap-3 text-xs text-slate-700 flex-wrap">
                        <span className="font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          {bypassPct}% of simulated attacks bypassed controls ({sim.bypassesFound} bypasses)
                        </span>
                        <span>•</span>
                        <span>
                          Simulated Exposure: <strong className="font-mono text-slate-900">{formatCurrency(sim.simulatedExposure)}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          Volume: <strong className="font-mono text-slate-900">{formatNumber(sim.totalTransactions)} txns</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(sim.id)}
                        className="h-8 text-xs text-slate-600 hover:text-slate-900 gap-1"
                      >
                        <span>Advanced Details</span>
                        {isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(sim)}
                        className="h-8 text-xs font-semibold text-slate-800"
                      >
                        View Results
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => navigate(`/simulations/live?id=${sim.id}`)}
                        className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 font-semibold"
                      >
                        <Activity className="h-3 w-3" />
                        <span>Live Monitor</span>
                      </Button>
                    </div>
                  </div>

                  {/* Collapsible Advanced Details */}
                  {isExpanded && (
                    <div className="bg-slate-50 p-4 border-t border-slate-200/80 text-xs space-y-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-sans">Deterministic Seed</span>
                          <span className="font-bold text-blue-700">{sim.seed}</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-sans">Detection Recall</span>
                          <span className="font-bold text-emerald-700">{sim.detectionRecall}%</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-sans">False Positive Rate</span>
                          <span className="font-bold text-slate-700">{sim.falsePositiveRate}%</span>
                        </div>
                        <div className="bg-white p-2.5 rounded border border-slate-200">
                          <span className="text-slate-400 block text-[10px] font-sans">Partition Split</span>
                          <span className="text-slate-700 font-sans">70% Dev / 15% Val / 15% Test</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <span className="font-semibold text-slate-700 text-[11px]">Adversarial Strategies Evaluated:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {sim.activeAgents.map((ag) => (
                            <span
                              key={ag}
                              className="rounded bg-red-100 text-red-800 text-[10px] font-mono font-bold px-2 py-0.5"
                            >
                              {ag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Simulation Detail Dialog */}
      {selectedRun && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-5 w-5 text-blue-600" />
                  <span>Simulation Run {selectedRun.id}</span>
                </DialogTitle>
                <StatusBadge status={selectedRun.status} />
              </div>
              <DialogDescription className="text-xs text-slate-500 font-mono">
                Deterministic Seed: {selectedRun.seed} • Type: {selectedRun.runType}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Policy Tested:</span>
                  <span className="font-bold text-slate-800">{selectedRun.policyName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Total Synthetic Volume:</span>
                  <span className="text-slate-800">{formatNumber(selectedRun.totalTransactions)} transactions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Adversarial Attacks Attempted:</span>
                  <span className="text-slate-800">{selectedRun.attacksAttempted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Bypasses Allowed:</span>
                  <span className="text-red-600 font-bold">{selectedRun.bypassesFound}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Simulated Exposure:</span>
                  <span className="text-red-700 font-bold">{formatCurrency(selectedRun.simulatedExposure)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">Detection Recall:</span>
                  <span className="text-emerald-600 font-bold">{selectedRun.detectionRecall}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-sans">False Positive Rate:</span>
                  <span className="text-slate-700">{selectedRun.falsePositiveRate}%</span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="font-semibold text-slate-700">Active Adversarial Agents</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedRun.activeAgents.map((agent) => (
                    <span
                      key={agent}
                      className="rounded bg-red-50 border border-red-200 text-red-800 px-2 py-0.5 text-[10px] font-mono font-semibold"
                    >
                      {agent}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailOpen(false)
                  navigate('/vulnerabilities')
                }}
                className="text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>View Discovered Vulnerabilities</span>
              </Button>

              <Button
                size="sm"
                onClick={() => {
                  setDetailOpen(false)
                  navigate(`/simulations/live?id=${selectedRun.id}`)
                }}
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                <span>Open Live Stream Monitor</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

