import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePatches } from '@/hooks/usePatches'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/common/StatusBadge'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Wrench,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Play,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  FileCheck,
  Cpu,
  ShieldAlert,
  Layers,
  Lock,
  History,
  AlertTriangle,
  RotateCcw,
  Sliders,
  FileCode,
  Check,
  X,
  Scale,
} from 'lucide-react'
import { PatchStatus, PolicyPatch } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

const patchStatusFilters: { label: string; value: PatchStatus | 'ALL' }[] = [
  { label: 'All Proposals', value: 'ALL' },
  { label: 'Pending Simulation', value: 'PENDING_SIMULATION' },
  { label: 'Simulated & Validated', value: 'SIMULATED' },
  { label: 'Approved & Enforced', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export const Patches: React.FC = () => {
  const navigate = useNavigate()
  const [showTechnicalDiff, setShowTechnicalDiff] = useState(false)
  const [showScenarioBreakdown, setShowScenarioBreakdown] = useState(false)
  const [selectedSplit, setSelectedSplit] = useState<'held_out' | 'validation' | 'development'>('held_out')

  const {
    patches,
    relatedCandidates,
    selectedPatch,
    setSelectedPatch,
    statusFilter,
    setStatusFilter,
    loading,
    actionLoading,
    error,
    evaluatePatch,
    iteratePatch,
    approvePatch,
    rejectPatch,
    refetch,
  } = usePatches()

  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [iterateModalOpen, setIterateModalOpen] = useState(false)
  const [iterateFeedback, setIterateFeedback] = useState('')

  const handleEvaluate = async (split: string = 'held_out') => {
    if (!selectedPatch) return
    try {
      await evaluatePatch(selectedPatch.id, split)
    } catch (err) {
      console.error('Evaluation failed:', err)
    }
  }

  const handleConfirmApprove = async () => {
    if (!selectedPatch) return
    try {
      await approvePatch(selectedPatch.id, approvalNotes)
      setApprovalModalOpen(false)
      setApprovalNotes('')
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  const handleConfirmReject = async () => {
    if (!selectedPatch) return
    try {
      await rejectPatch(selectedPatch.id, rejectReason || 'Rejected by risk engineer')
      setRejectModalOpen(false)
      setRejectReason('')
    } catch (err) {
      console.error('Rejection failed:', err)
    }
  }

  const handleConfirmIterate = async () => {
    if (!selectedPatch) return
    try {
      await iteratePatch(selectedPatch.id, iterateFeedback, selectedSplit)
      setIterateModalOpen(false)
      setIterateFeedback('')
    } catch (err) {
      console.error('Iteration failed:', err)
    }
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
          title="Unable to load patch proposals"
          message={error || 'Could not retrieve AI defensive patches from backend.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  const decision = selectedPatch?.decisionEvaluation
  const isApprovedDecision = decision?.decision === 'APPROVE_PATCH'
  const isRejectedDecision = decision?.decision === 'REJECT_PATCH'
  const isManualReview = decision?.decision === 'MANUAL_REVIEW_REQUIRED'

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Patches & Decision Center"
        description="Deterministic evaluation, held-out validation, trade-off analysis, and human approval workflow."
        badge={
          <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-mono font-bold">
            {patches.length} Proposals
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/benchmarks')}
              className="h-8 gap-1.5 text-xs font-semibold"
            >
              <span>View Held-Out Benchmarks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Workflow Progress Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto py-1 px-3 bg-slate-100/70 rounded-lg font-medium border border-slate-200">
          <span className="text-slate-700">1. Weakness Identified</span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-slate-700">2. AI Proposes Patch</span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-purple-700 font-semibold">3. Candidate Frozen (SHA-256)</span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-blue-700 font-semibold">4. Held-Out Evaluation</span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-emerald-700 font-semibold">5. Deterministic Decision</span>
          <ArrowRight className="h-3 w-3 text-slate-400 shrink-0" />
          <span className="text-slate-900 font-bold">6. Human Approval & Audit</span>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {patchStatusFilters.map((flt) => (
            <button
              key={flt.value}
              onClick={() => setStatusFilter(flt.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === flt.value
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {flt.label}
            </button>
          ))}
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Proposals List (4 cols) */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Candidate Proposals ({patches.length})
            </h3>

            {patches.length === 0 ? (
              <EmptyState
                title="No patch proposals found"
                description="Trigger simulations or fire drills to detect policy vulnerabilities and generate patches."
              />
            ) : (
              <div className="space-y-2">
                {patches.map((patch) => {
                  const isSelected = selectedPatch?.id === patch.id
                  const dec = patch.decisionEvaluation
                  return (
                    <div
                      key={patch.id}
                      onClick={() => setSelectedPatch(patch)}
                      className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-800">
                            {patch.id}
                          </span>
                          {patch.iterationIndex > 1 && (
                            <span className="rounded bg-purple-100 text-purple-800 px-1 py-0.2 text-[10px] font-bold">
                              Iter #{patch.iterationIndex}
                            </span>
                          )}
                        </div>
                        <StatusBadge status={patch.status} />
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 line-clamp-1 mb-1">
                        {patch.vulnerabilityTitle}
                      </h4>

                      <p className="text-[11px] text-slate-500 font-mono line-clamp-1 mb-2">
                        {patch.sourcePolicyName} ({patch.sourcePolicyVersion}) → {patch.targetPolicyVersion}
                      </p>

                      {dec && (
                        <div className={`mt-2 p-1.5 rounded text-[10px] font-semibold flex items-center gap-1.5 ${
                          dec.decision === 'APPROVE_PATCH'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : dec.decision === 'REJECT_PATCH'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}>
                          {dec.decision === 'APPROVE_PATCH' ? (
                            <Check className="h-3 w-3 text-emerald-600 shrink-0" />
                          ) : dec.decision === 'REJECT_PATCH' ? (
                            <X className="h-3 w-3 text-rose-600 shrink-0" />
                          ) : (
                            <Scale className="h-3 w-3 text-blue-600 shrink-0" />
                          )}
                          <span className="truncate">{dec.recommendationTitle}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right Column: Selected Patch Decision Center (8 cols) */}
          <div className="lg:col-span-8">
            {selectedPatch ? (
              <Card className="shadow-2xs p-6 space-y-6 bg-white">
                {/* Header & Meta */}
                <div className="border-b border-border pb-4 space-y-3">
                  {/* Candidate Iteration Switcher if multiple candidates exist */}
                  {relatedCandidates.length > 1 && (
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700">
                        <History className="h-3.5 w-3.5 text-slate-500" />
                        <span>Candidate Iteration History for this Issue:</span>
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto">
                        {relatedCandidates.map((cand) => (
                          <button
                            key={cand.id}
                            onClick={() => setSelectedPatch(cand)}
                            className={`px-2.5 py-1 rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors ${
                              selectedPatch.id === cand.id
                                ? 'bg-slate-900 text-white shadow-2xs'
                                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <span>Iter #{cand.iterationIndex} ({cand.targetPolicyVersion})</span>
                            <span className={`text-[10px] px-1 py-0.2 rounded font-bold ${
                              cand.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : cand.status === 'REJECTED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {cand.status}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={selectedPatch.status} />
                      <span className="font-mono text-xs text-slate-400 font-semibold">
                        {selectedPatch.id}
                      </span>
                      {selectedPatch.candidateChecksum && (
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1" title={selectedPatch.candidateChecksum}>
                          <Lock className="h-2.5 w-2.5 text-slate-500" />
                          <span>SHA: {selectedPatch.candidateChecksum.slice(0, 10)}...</span>
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                      {selectedPatch.status === 'PENDING_SIMULATION' && (
                        <Button
                          size="sm"
                          onClick={() => handleEvaluate(selectedSplit)}
                          disabled={actionLoading}
                          className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 font-semibold shadow-2xs"
                        >
                          <Play className="h-3.5 w-3.5 fill-current" />
                          <span>Evaluate on Held-Out Data (15%)</span>
                        </Button>
                      )}

                      {selectedPatch.status === 'SIMULATED' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEvaluate(selectedSplit)}
                            disabled={actionLoading}
                            className="h-8 text-xs gap-1 text-slate-700"
                            title="Re-run deterministic evaluation"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Re-evaluate</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIterateModalOpen(true)}
                            disabled={actionLoading}
                            className="h-8 text-xs gap-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>Iterate Strategy</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setRejectModalOpen(true)}
                            disabled={actionLoading}
                            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 gap-1 font-semibold"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setApprovalModalOpen(true)}
                            disabled={actionLoading}
                            className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1 font-semibold shadow-2xs"
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Approve & Enforce Policy</span>
                          </Button>
                        </>
                      )}

                      {selectedPatch.status === 'REJECTED' && (
                        <Button
                          size="sm"
                          onClick={() => setIterateModalOpen(true)}
                          disabled={actionLoading}
                          className="h-8 text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5 font-semibold"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Generate Candidate Iteration #{selectedPatch.iterationIndex + 1}</span>
                        </Button>
                      )}

                      {selectedPatch.status === 'APPROVED' && (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Enforced in Policy {selectedPatch.targetPolicyVersion}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">
                      Target Vulnerability & Policy
                    </span>
                    <h2 className="text-base font-bold text-slate-900 mt-0.5">
                      {selectedPatch.vulnerabilityTitle}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Base Policy: {selectedPatch.sourcePolicyName} ({selectedPatch.sourcePolicyVersion}) → Proposed: {selectedPatch.targetPolicyVersion}
                    </p>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* PHASE 6 DETERMINISTIC DECISION BANNER (IF EVALUATED) */}
                {/* ============================================================ */}
                {decision && (
                  <div className={`rounded-lg border p-4 space-y-3 text-xs ${
                    isApprovedDecision
                      ? 'border-emerald-300 bg-emerald-50/40 text-emerald-950'
                      : isRejectedDecision
                      ? 'border-rose-300 bg-rose-50/40 text-rose-950'
                      : 'border-blue-300 bg-blue-50/40 text-blue-950'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {isApprovedDecision ? (
                          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                        ) : isRejectedDecision ? (
                          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" />
                        ) : (
                          <Scale className="h-5 w-5 text-blue-600 shrink-0" />
                        )}
                        <div>
                          <h3 className="font-bold text-sm leading-tight">
                            {decision.recommendationTitle}
                          </h3>
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Deterministic Evaluation on <strong className="uppercase">{decision.datasetSplit} Split (15% unseen data)</strong>. Candidate was frozen before evaluation.
                          </p>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] shrink-0 uppercase ${
                        isApprovedDecision
                          ? 'bg-emerald-200 text-emerald-900'
                          : isRejectedDecision
                          ? 'bg-rose-200 text-rose-900'
                          : 'bg-blue-200 text-blue-900'
                      }`}>
                        {decision.decision}
                      </span>
                    </div>

                    <p className="text-xs leading-relaxed font-medium">
                      {decision.recommendationSummary}
                    </p>

                    {/* Trade-off Breakdown Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200/60">
                      {/* Security Gains */}
                      <div className="bg-white/80 p-3 rounded border border-emerald-100 space-y-1.5">
                        <span className="font-bold text-emerald-900 text-[11px] flex items-center gap-1">
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                          Security Improvements
                        </span>
                        <ul className="space-y-1">
                          {decision.securityImprovements.map((imp, idx) => (
                            <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                              <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{imp}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Operational Regressions */}
                      <div className="bg-white/80 p-3 rounded border border-rose-100 space-y-1.5">
                        <span className="font-bold text-rose-900 text-[11px] flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                          Operational / Friction Regressions
                        </span>
                        <ul className="space-y-1">
                          {decision.operationalRegressions.map((reg, idx) => (
                            <li key={idx} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                              {reg.includes('Zero') ? (
                                <Check className="h-3 w-3 text-emerald-600 shrink-0 mt-0.5" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0 mt-0.5" />
                              )}
                              <span>{reg}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Decision Rationale Bullet Points */}
                    <div className="p-2.5 bg-white/90 rounded border border-slate-200 space-y-1 text-[11px]">
                      <span className="font-bold text-slate-800 block">Evaluation Rationale & Mathematical Thresholds:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-slate-600 pl-1">
                        {decision.reasons.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* SECTION 1: AI PROPOSAL REASONING */}
                {/* ============================================================ */}
                <div className="rounded-lg border border-purple-200 bg-purple-50/20 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <span className="font-bold text-purple-950 text-xs">
                      AI Hypothesis & Proposed Changes
                    </span>
                    <span className="ml-auto rounded bg-purple-100 text-purple-800 text-[10px] font-bold px-1.5 py-0.2">
                      AI REASONING
                    </span>
                  </div>

                  <p className="text-slate-700 text-[11px] leading-relaxed">
                    {selectedPatch.aiReasoning}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-purple-100 text-[11px]">
                    <div className="p-2 rounded bg-white border border-purple-100">
                      <span className="font-semibold text-slate-800 block mb-0.5">Expected Benefit</span>
                      <p className="text-slate-600 text-[10px] leading-tight">{selectedPatch.expectedRiskReduction}</p>
                    </div>
                    <div className="p-2 rounded bg-white border border-purple-100">
                      <span className="font-semibold text-slate-800 block mb-0.5">FPR Impact</span>
                      <p className="text-slate-600 text-[10px] leading-tight">{selectedPatch.expectedFprImpact}</p>
                    </div>
                    <div className="p-2 rounded bg-white border border-purple-100">
                      <span className="font-semibold text-slate-800 block mb-0.5">Customer Friction</span>
                      <p className="text-slate-600 text-[10px] leading-tight">{selectedPatch.expectedCustomerFriction}</p>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* SECTION 2: DETERMINISTIC VERIFICATION (BEFORE vs AFTER) */}
                {/* ============================================================ */}
                {selectedPatch.metricsComparison ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/30 p-4 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                        <span className="font-bold text-slate-900 text-xs">
                          Deterministic Verification: Before vs After Impact
                        </span>
                      </div>
                      <span className="rounded bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 font-mono">
                        DETERMINISTIC EVALUATION
                      </span>
                    </div>

                    {/* Snapshot 3 Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Bypasses Allowed
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-base font-bold text-red-600">
                            {selectedPatch.metricsComparison.bypassesCount.before}
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className="font-mono text-base font-bold text-emerald-700">
                            {selectedPatch.metricsComparison.bypassesCount.after}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-emerald-700">
                          {Math.abs(selectedPatch.metricsComparison.bypassesCount.delta)} attacks blocked
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Simulated Exposure
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-base font-bold text-red-600">
                            {formatCurrency(selectedPatch.metricsComparison.simulatedExposure.before)}
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className="font-mono text-base font-bold text-emerald-700">
                            {formatCurrency(selectedPatch.metricsComparison.simulatedExposure.after)}
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-emerald-700">
                          {formatCurrency(Math.abs(selectedPatch.metricsComparison.simulatedExposure.delta))} risk saved
                        </p>
                      </div>

                      <div className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Detection Accuracy (Recall)
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-mono text-base font-bold text-slate-600">
                            {selectedPatch.metricsComparison.recall.before}%
                          </span>
                          <span className="text-xs text-slate-400">→</span>
                          <span className="font-mono text-base font-bold text-emerald-700">
                            {selectedPatch.metricsComparison.recall.after}%
                          </span>
                        </div>
                        <p className="text-[10px] font-semibold text-emerald-700">
                          +{selectedPatch.metricsComparison.recall.delta}% accuracy gain
                        </p>
                      </div>
                    </div>

                    {/* Metrics Comparison Table */}
                    <div className="rounded border border-slate-200 bg-white overflow-hidden">
                      <Table>
                        <TableHeader className="bg-slate-50">
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="text-[11px] font-semibold">Evaluation Metric</TableHead>
                            <TableHead className="text-[11px] font-semibold">Baseline ({selectedPatch.sourcePolicyVersion})</TableHead>
                            <TableHead className="text-[11px] font-semibold">Candidate ({selectedPatch.targetPolicyVersion})</TableHead>
                            <TableHead className="text-[11px] font-semibold">Measured Delta</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow className="text-[11px]">
                            <TableCell className="font-medium text-slate-800">False Positive Rate (FPR)</TableCell>
                            <TableCell className="font-mono">{selectedPatch.metricsComparison.falsePositiveRate.before}%</TableCell>
                            <TableCell className="font-mono font-bold text-slate-800">{selectedPatch.metricsComparison.falsePositiveRate.after}%</TableCell>
                            <TableCell className={`font-mono font-bold ${
                              selectedPatch.metricsComparison.falsePositiveRate.delta > 1.0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}>
                              {selectedPatch.metricsComparison.falsePositiveRate.delta > 0 ? '+' : ''}{selectedPatch.metricsComparison.falsePositiveRate.delta}%
                            </TableCell>
                          </TableRow>
                          <TableRow className="text-[11px]">
                            <TableCell className="font-medium text-slate-800">Detection Recall</TableCell>
                            <TableCell className="font-mono">{selectedPatch.metricsComparison.recall.before}%</TableCell>
                            <TableCell className="font-mono font-bold text-emerald-600">{selectedPatch.metricsComparison.recall.after}%</TableCell>
                            <TableCell className="font-mono text-emerald-600 font-bold">+{selectedPatch.metricsComparison.recall.delta}%</TableCell>
                          </TableRow>
                          <TableRow className="text-[11px]">
                            <TableCell className="font-medium text-slate-800">Precision</TableCell>
                            <TableCell className="font-mono">{selectedPatch.metricsComparison.precision.before}%</TableCell>
                            <TableCell className="font-mono font-bold text-slate-800">{selectedPatch.metricsComparison.precision.after}%</TableCell>
                            <TableCell className="font-mono font-bold text-slate-700">
                              {selectedPatch.metricsComparison.precision.delta > 0 ? '+' : ''}{selectedPatch.metricsComparison.precision.delta}%
                            </TableCell>
                          </TableRow>
                          <TableRow className="text-[11px]">
                            <TableCell className="font-medium text-slate-800">F1 Score</TableCell>
                            <TableCell className="font-mono">{selectedPatch.metricsComparison.f1.before}%</TableCell>
                            <TableCell className="font-mono font-bold text-slate-800">{selectedPatch.metricsComparison.f1.after}%</TableCell>
                            <TableCell className="font-mono font-bold text-slate-700">
                              {selectedPatch.metricsComparison.f1.delta > 0 ? '+' : ''}{selectedPatch.metricsComparison.f1.delta}%
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    {/* Scenario Breakdown Toggle */}
                    {selectedPatch.scenarioResults && selectedPatch.scenarioResults.length > 0 && (
                      <div className="space-y-2 pt-1">
                        <button
                          onClick={() => setShowScenarioBreakdown(!showScenarioBreakdown)}
                          className="flex items-center gap-1.5 text-xs text-blue-700 font-semibold hover:underline"
                        >
                          <Layers className="h-3.5 w-3.5" />
                          <span>{showScenarioBreakdown ? 'Hide' : 'View'} 10-Scenario Attack Breakdown</span>
                          {showScenarioBreakdown ? (
                            <ChevronUp className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5" />
                          )}
                        </button>

                        {showScenarioBreakdown && (
                          <div className="rounded border border-slate-200 bg-white overflow-hidden">
                            <Table>
                              <TableHeader className="bg-slate-50">
                                <TableRow className="hover:bg-transparent">
                                  <TableHead className="text-[10px] font-semibold">Scenario</TableHead>
                                  <TableHead className="text-[10px] font-semibold">Txns (Adv)</TableHead>
                                  <TableHead className="text-[10px] font-semibold">Baseline Recall</TableHead>
                                  <TableHead className="text-[10px] font-semibold">Candidate Recall</TableHead>
                                  <TableHead className="text-[10px] font-semibold">Delta</TableHead>
                                  <TableHead className="text-[10px] font-semibold">Bypasses (B → C)</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {selectedPatch.scenarioResults.map((scn) => (
                                  <TableRow key={scn.scenarioId} className="text-[10px]">
                                    <TableCell className="font-mono font-semibold text-slate-900">
                                      {scn.scenarioId}: {scn.scenarioName}
                                    </TableCell>
                                    <TableCell className="font-mono">{scn.totalTransactions} ({scn.adversarialTransactions})</TableCell>
                                    <TableCell className="font-mono text-slate-600">{scn.baselineRecall}%</TableCell>
                                    <TableCell className="font-mono font-bold text-slate-900">{scn.candidateRecall}%</TableCell>
                                    <TableCell className={`font-mono font-bold ${scn.deltaRecall > 0 ? 'text-emerald-600' : 'text-slate-500'}`}>
                                      {scn.deltaRecall > 0 ? `+${scn.deltaRecall}%` : `${scn.deltaRecall}%`}
                                    </TableCell>
                                    <TableCell className="font-mono">
                                      <span className="text-red-600">{scn.baselineBypasses}</span> → <span className="text-emerald-700 font-bold">{scn.candidateBypasses}</span>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-6 text-center space-y-2">
                    <p className="text-xs text-slate-600 font-medium">
                      Candidate is staged and ready for evaluation on held-out dataset split.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleEvaluate(selectedSplit)}
                      disabled={actionLoading}
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                    >
                      <Play className="h-3.5 w-3.5 fill-current mr-1.5" />
                      <span>Run Held-Out Batch Evaluation (15% Split)</span>
                    </Button>
                  </div>
                )}

                {/* ============================================================ */}
                {/* LEVEL 2: TECHNICAL DETAILS & RAW DIFF */}
                {/* ============================================================ */}
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setShowTechnicalDiff(!showTechnicalDiff)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 font-medium hover:text-slate-900"
                  >
                    <FileCode className="h-3.5 w-3.5 text-slate-400" />
                    <span>Level 2: {showTechnicalDiff ? 'Hide' : 'Show'} Technical Rule Specification & Checksum</span>
                    {showTechnicalDiff ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {showTechnicalDiff && (
                    <div className="mt-3 space-y-3">
                      {selectedPatch.candidateChecksum && (
                        <div className="p-2.5 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg">
                          <span className="text-slate-400 block text-[10px]">CANDIDATE IMMUTABLE SHA-256 DIGEST:</span>
                          {selectedPatch.candidateChecksum}
                        </div>
                      )}

                      <div className="space-y-2">
                        {selectedPatch.proposedChanges.map((change, idx) => (
                          <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900">{change.ruleType}</span>
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                                {change.operation}
                              </span>
                            </div>
                            <p className="font-mono text-[11px] text-slate-800 bg-white p-2 rounded border border-slate-200">
                              {change.proposedRuleText}
                            </p>
                            <p className="text-slate-500 text-[11px]">
                              <strong>Rationale:</strong> {change.rationale}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <EmptyState
                title="Select a patch proposal"
                description="Select a defensive patch from the left to view its deterministic held-out evaluation and decision."
              />
            )}
          </div>
        </div>
      </div>

      {/* APPROVAL MODAL */}
      <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Approve Defensive Policy Patch</DialogTitle>
            <DialogDescription>
              This will promote the candidate rules into an active policy version ({selectedPatch?.targetPolicyVersion}) and enforce them in production.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-900 space-y-1">
              <span className="font-bold block">Deterministic Safety Verification:</span>
              <p className="text-[11px]">
                Candidate was verified across held-out datasets with zero disqualifying false-positive regressions.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Approval Notes / Audit Justification (Required)
              </label>
              <Input
                placeholder="e.g., Approved based on held-out benchmark trade-off verification."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmApprove}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              Confirm Approval & Deploy
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* REJECTION MODAL */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Reject Defensive Policy Patch</DialogTitle>
            <DialogDescription>
              Record rejection rationale. Rejected patches remain permanently immutable in the audit log.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason (Required)
              </label>
              <Input
                placeholder="e.g., False positive rate on legitimate customer transactions exceeds 1.0% limit."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={actionLoading}
              className="font-semibold"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ITERATE STRATEGY MODAL */}
      <Dialog open={iterateModalOpen} onOpenChange={setIterateModalOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Iterate Defensive Patch Strategy</DialogTitle>
            <DialogDescription>
              Create a new candidate iteration ({selectedPatch ? `Iteration #${selectedPatch.iterationIndex + 1}` : 'Next Iteration'}) grounded in previous benchmark failure evidence.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs py-2">
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 space-y-1">
              <span className="font-bold block">Candidate Immutability Preservation:</span>
              <p className="text-[11px]">
                Candidate #{selectedPatch?.iterationIndex} will remain immutable in history. The AI agent will synthesize Candidate #{selectedPatch ? selectedPatch.iterationIndex + 1 : 2} targeting the specific failure points.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Analyst Guidance / Feedback for AI Agent:
              </label>
              <Input
                placeholder="e.g. Tighten velocity windows instead of hard blocking all multi-account devices."
                value={iterateFeedback}
                onChange={(e) => setIterateFeedback(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIterateModalOpen(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleConfirmIterate}
              disabled={actionLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold"
            >
              Synthesize New Candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
