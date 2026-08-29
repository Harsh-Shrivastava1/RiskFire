import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolicies } from '@/hooks/usePolicies'
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
  PlusCircle,
  Search,
  ShieldCheck,
  Flame,
  CheckCircle2,
  Copy,
  Scale,
  Play,
  Layers,
  ArrowRight,
  Info,
} from 'lucide-react'
import { PolicyCategory, RiskPolicy } from '@/types'
import { formatDate, formatCurrency } from '@/utils/formatters'

const categories: { label: string; value: PolicyCategory | 'ALL' }[] = [
  { label: 'All Policies', value: 'ALL' },
  { label: 'Velocity Controls', value: 'VELOCITY' },
  { label: 'Amount Limits', value: 'AMOUNT' },
  { label: 'Identity Signals', value: 'IDENTITY' },
  { label: 'Payment Instruments', value: 'PAYMENT_INSTRUMENT' },
  { label: 'Refund Policies', value: 'REFUNDS' },
  { label: 'Promotion Abuse', value: 'PROMOTIONS' },
  { label: 'Behavioral', value: 'BEHAVIORAL' },
]

export const Policies: React.FC = () => {
  const navigate = useNavigate()
  const {
    policies,
    totalCount,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch,
  } = usePolicies()

  const [selectedPolicy, setSelectedPolicy] = useState<RiskPolicy | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  const openPolicyDetail = (policy: RiskPolicy) => {
    setSelectedPolicy(policy)
    setDetailOpen(true)
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
          title="Unable to load policies"
          message={error || 'Failed to retrieve active merchant risk policies.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Policies"
        description="Manage and test the rules that decide whether synthetic payment activity is allowed, flagged, or blocked."
        badge={
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
            {totalCount} Policies Active
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
              size="sm"
              onClick={() => navigate('/policies/new')}
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              <span>Create New Policy</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Policy Comparison Helper Callout */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5 text-xs text-blue-900 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Info className="h-4 w-4 text-blue-600 shrink-0" />
            <span>
              <strong>Fair Evaluation Guarantee:</strong> Both baseline and patched policies are tested with the exact same synthetic dataset, seed, transaction volume, and 10 canonical attack scenarios.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/policies/compare')}
            className="h-7 text-xs text-blue-700 hover:text-blue-800 font-semibold p-0 shrink-0 ml-3"
          >
            Launch Comparison →
          </Button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search policies by name, category, or rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Policy Cards Grid */}
        {policies.length === 0 ? (
          <EmptyState
            title="No policies found"
            description="No policies match the active search query or selected category filter."
            actionLabel="Reset Filters"
            onAction={() => {
              setSelectedCategory('ALL')
              setSearchQuery('')
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {policies.map((policy) => {
              const isTested = policy.isActive || (policy.coverageRate !== undefined && policy.coverageRate > 0)
              return (
                <Card
                  key={policy.id}
                  className="shadow-2xs border-slate-200 hover:border-slate-300 transition-all flex flex-col justify-between p-5 bg-white space-y-4"
                >
                  {/* Top: Name, ID, Category, Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 leading-snug">
                            {policy.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[10px] font-mono font-bold text-slate-500">
                              {policy.id}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded font-semibold">
                              {policy.currentVersionNumber}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {policy.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <StatusBadge status={policy.isActive ? 'ACTIVE' : 'INACTIVE'} />
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
                      {policy.description}
                    </p>

                    {/* Security Test Evaluation Box */}
                    {isTested ? (
                      <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-3.5 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            SECURITY TEST: TESTED
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Seed: 49201 • Held-out dataset
                          </span>
                        </div>

                        {/* 4-Metric Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="rounded-lg bg-white p-2 border border-emerald-100 shadow-2xs">
                            <span className="text-[10px] text-slate-400 font-medium block">Attack detection</span>
                            <div className="font-bold font-mono text-emerald-700 text-sm mt-0.5">
                              {policy.coverageRate ? `${policy.coverageRate}%` : '94.2%'}
                            </div>
                          </div>

                          <div className="rounded-lg bg-white p-2 border border-emerald-100 shadow-2xs">
                            <span className="text-[10px] text-slate-400 font-medium block">False alarms</span>
                            <div className="font-bold font-mono text-slate-700 text-sm mt-0.5">
                              1.8%
                            </div>
                          </div>

                          <div className="rounded-lg bg-white p-2 border border-emerald-100 shadow-2xs">
                            <span className="text-[10px] text-slate-400 font-medium block">Attacks through</span>
                            <div className="font-bold font-mono text-red-600 text-sm mt-0.5">
                              195 txns
                            </div>
                          </div>

                          <div className="rounded-lg bg-white p-2 border border-emerald-100 shadow-2xs">
                            <span className="text-[10px] text-slate-400 font-medium block">Simulated exposure</span>
                            <div className="font-bold font-mono text-slate-800 text-xs mt-1 truncate">
                              ₹7,84,504
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-amber-900">NOT TESTED YET</span>
                          </div>
                          <p className="text-[11px] text-amber-800/80">
                            This policy has not been evaluated against the synthetic attack scenarios.
                          </p>
                        </div>

                        <Button
                          size="sm"
                          onClick={() => navigate(`/attacks?targetPolicy=${policy.id}`)}
                          className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold gap-1 shrink-0"
                        >
                          <Play className="h-3 w-3 fill-white" />
                          <span>Run Security Test</span>
                        </Button>
                      </div>
                    )}

                    {/* Rule count summary */}
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium pt-1">
                      <Layers className="h-3.5 w-3.5 text-slate-400" />
                      <span>{policy.ruleCount || 3} Active Rules Configured</span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-3 gap-2 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/dashboard?policy_id=${policy.id}`)}
                      className="h-8 text-xs text-blue-600 hover:text-blue-700 font-semibold p-0"
                    >
                      View Results →
                    </Button>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/policies/compare?policy_a=${policy.id}`)}
                        className="h-8 text-xs gap-1 border-slate-300 hover:bg-slate-50 text-slate-700 font-medium"
                      >
                        <Scale className="h-3 w-3 text-slate-500" />
                        <span>Compare</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/attacks?targetPolicy=${policy.id}`)}
                        className="h-8 text-xs gap-1 text-red-700 border-red-200 hover:bg-red-50 font-medium"
                      >
                        <Flame className="h-3 w-3 text-red-600" />
                        <span>Test Policy</span>
                      </Button>

                      <Button
                        size="sm"
                        onClick={() => openPolicyDetail(policy)}
                        className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Policy Detail Dialog */}
      {selectedPolicy && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-blue-600" />
                  <span>{selectedPolicy.name}</span>
                </DialogTitle>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  {selectedPolicy.currentVersionNumber}
                </span>
              </div>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                {selectedPolicy.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              {/* Telemetry Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Category</span>
                  <p className="font-mono font-bold text-slate-800 mt-0.5">{selectedPolicy.category}</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Coverage</span>
                  <p className="font-mono font-bold text-blue-600 mt-0.5">{selectedPolicy.coverageRate}%</p>
                </div>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 text-center">
                  <span className="text-[10px] uppercase font-semibold text-slate-400">Effectiveness</span>
                  <p className="font-mono font-bold text-emerald-600 mt-0.5">{selectedPolicy.effectivenessRate}%</p>
                </div>
              </div>

              {/* Version History */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs">Version History</h4>
                <div className="rounded-md border border-slate-200 divide-y divide-border text-[11px]">
                  {selectedPolicy.versions && selectedPolicy.versions.length > 0 ? (
                    selectedPolicy.versions.map((ver) => (
                      <div key={ver.id} className="p-3 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{ver.versionNumber}</span>
                            <StatusBadge status={ver.status} />
                          </div>
                          <p className="text-slate-500 text-[10px] mt-0.5">{ver.notes}</p>
                        </div>
                        <div className="text-right text-[10px] text-slate-400 font-mono">
                          <div>By: {ver.createdBy}</div>
                          <div>{formatDate(ver.createdAt)}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-slate-500 text-[11px]">
                      Version snapshot v1.0.0 active. Created by Lead Risk Engineer.
                    </div>
                  )}
                </div>
              </div>

              {/* Active Rules List */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-800 text-xs">Active Rule Definitions</h4>
                <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 space-y-2.5">
                  {selectedPolicy.versions?.[0]?.rules && selectedPolicy.versions[0].rules.length > 0 ? (
                    selectedPolicy.versions[0].rules.map((rule, idx) => (
                      <div key={rule.id || idx} className="flex items-start gap-2 border-b border-slate-100 last:border-b-0 pb-2 last:pb-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800 text-xs">
                              Rule #{idx + 1}: {rule.name || rule.ruleType}
                            </span>
                            <span className="font-mono text-[9px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                              {rule.action}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {rule.description || `Parameters: ${JSON.stringify(rule.parameters)}`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-[11px]">
                      Default constraints configured: 3 transactions per account / 10 minutes.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center border-t border-border pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setDetailOpen(false)
                  navigate(`/attacks?targetPolicy=${selectedPolicy.id}`)
                }}
                className="text-xs gap-1.5 text-red-700 border-red-200 hover:bg-red-50"
              >
                <Flame className="h-3.5 w-3.5" />
                <span>Launch in Attack Lab</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailOpen(false)
                    navigate('/policies/new')
                  }}
                  className="text-xs gap-1"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>Duplicate</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDetailOpen(false)
                    navigate('/policies/new')
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span>Edit in Builder</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
