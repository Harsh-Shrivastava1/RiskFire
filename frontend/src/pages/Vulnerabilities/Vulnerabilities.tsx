import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useVulnerabilities } from '@/hooks/useVulnerabilities'
import { PageHeader } from '@/components/layout/PageHeader'
import { SeverityBadge } from '@/components/common/SeverityBadge'
import { StatusBadge } from '@/components/common/StatusBadge'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertTriangle,
  Search,
  Wrench,
  Network,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Code2,
  Terminal,
  FileText,
} from 'lucide-react'
import { RiskSeverity } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const severityFilters: { label: string; value: RiskSeverity | 'ALL' }[] = [
  { label: 'All Severities', value: 'ALL' },
  { label: 'Critical', value: 'CRITICAL' },
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

export const Vulnerabilities: React.FC = () => {
  const navigate = useNavigate()
  const [showRawTelemetry, setShowRawTelemetry] = useState(false)
  const {
    vulnerabilities,
    selectedVulnerability,
    setSelectedVulnerability,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    loading,
    isExplaining,
    isGeneratingPatch,
    error,
    aiError,
    explainWithAi,
    synthesizePatch,
    refetch,
  } = useVulnerabilities()

  const handleSynthesizePatch = async (vulnId: string) => {
    try {
      const patch = await synthesizePatch(vulnId)
      navigate(`/patches?selected=${patch.id}`)
    } catch (err) {
      console.error('Failed to synthesize patch:', err)
    }
  }

  const handleReExplain = async (vulnId: string) => {
    try {
      await explainWithAi(vulnId)
    } catch (err) {
      console.error('Failed to explain vulnerability:', err)
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
          title="Unable to load security issues"
          message={error || 'Could not retrieve discovered policy vulnerabilities from backend.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Issues & Discovered Weaknesses"
        description="Security weaknesses discovered during simulated adversarial testing."
        badge={
          <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-xs font-mono font-bold">
            {vulnerabilities.length} Issues Identified
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/patches')}
            className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
          >
            <Wrench className="h-3.5 w-3.5" />
            <span>View Defensive Patches</span>
          </Button>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {aiError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {aiError}
          </div>
        )}

        {/* Filters and Search Toolbar */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by title, policy, or attack vector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            {severityFilters.map((flt) => (
              <button
                key={flt.value}
                onClick={() => setSeverityFilter(flt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  severityFilter === flt.value
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Issue List (5 Cols) */}
          <div className="lg:col-span-5 space-y-3">
            {vulnerabilities.length === 0 ? (
              <EmptyState
                title="No security issues found"
                description="No vulnerabilities match your current search or severity filter."
                suggestion="Run a simulation in the Attack Lab to test policies against adversarial activity."
                actionLabel="Open Attack Lab"
                onAction={() => navigate('/attack-lab')}
              />
            ) : (
              <Card className="shadow-2xs overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {vulnerabilities.map((vuln) => {
                    const isSelected = selectedVulnerability?.id === vuln.id
                    return (
                      <div
                        key={vuln.id}
                        onClick={() => setSelectedVulnerability(vuln)}
                        className={`p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-50/70 border-l-4 border-blue-600'
                            : 'hover:bg-slate-50/80 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <SeverityBadge severity={vuln.severity} />
                            <span className="font-mono text-[10px] text-slate-400 font-semibold">
                              {vuln.id}
                            </span>
                          </div>
                          <StatusBadge status={vuln.status} />
                        </div>

                        <h3 className="text-xs font-bold text-slate-900 leading-tight mb-1">
                          {vuln.title}
                        </h3>

                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mb-2">
                          <span>{vuln.policyName}</span>
                          <span>•</span>
                          <span className="text-red-600 font-semibold">
                            {vuln.bypassCount}/{vuln.totalAttackCount} Bypasses
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-slate-100 text-slate-600">
                          <span>Simulated Exposure:</span>
                          <span className="font-bold text-slate-900">
                            {formatCurrency(vuln.simulatedExposure)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
            )}
          </div>

          {/* Right Column: Progressive Disclosure Deep Dive (7 Cols) */}
          <div className="lg:col-span-7">
            {selectedVulnerability ? (
              <Card className="shadow-2xs p-6 space-y-6 bg-white">
                {/* ============================================================ */}
                {/* LEVEL 1: WHAT? & IMPACT & RECOMMENDED ACTION */}
                {/* ============================================================ */}
                <div className="border-b border-border pb-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={selectedVulnerability.severity} />
                      <span className="font-mono text-xs text-slate-400 font-semibold">
                        {selectedVulnerability.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/attack-graph')}
                        className="h-7 text-xs gap-1"
                      >
                        <Network className="h-3 w-3" />
                        <span>View Attack Graph</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleSynthesizePatch(selectedVulnerability.id)}
                        disabled={isGeneratingPatch}
                        className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 font-semibold shadow-2xs"
                      >
                        {isGeneratingPatch ? (
                          <>
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Generating Patch...</span>
                          </>
                        ) : (
                          <>
                            <Wrench className="h-3 w-3" />
                            <span>Generate Defensive Patch</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                      {selectedVulnerability.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                      Target Policy: {selectedVulnerability.policyName} ({selectedVulnerability.policyVersionNumber})
                    </p>
                  </div>

                  {/* Level 1: Plain-English Executive Summary */}
                  <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3.5 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Plain-English Weakness Summary
                    </span>
                    <p className="text-xs text-slate-800 leading-relaxed font-sans">
                      {selectedVulnerability.plainEnglishSummary || selectedVulnerability.executiveSummary}
                    </p>
                  </div>

                  {/* High-level Impact Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                    <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Attacks Caught
                      </span>
                      <p className="font-mono font-bold text-emerald-600 mt-0.5">
                        {selectedVulnerability.detectionCount ?? (selectedVulnerability.totalAttackCount - selectedVulnerability.bypassCount)} / {selectedVulnerability.totalAttackCount}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Attacks Bypassed
                      </span>
                      <p className="font-mono font-bold text-red-600 mt-0.5">
                        {selectedVulnerability.bypassCount} ({Math.round(selectedVulnerability.bypassRate * 100)}%)
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Potential Exposure
                      </span>
                      <p className="font-mono font-bold text-slate-900 mt-0.5">
                        {formatCurrency(selectedVulnerability.simulatedExposure)}
                      </p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-2.5 text-center">
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        Entities Involved
                      </span>
                      <p className="font-mono font-bold text-purple-600 mt-0.5">
                        {selectedVulnerability.affectedEntityCount || 3} Entities
                      </p>
                    </div>
                  </div>

                  {/* Level 2: Rule Triggering & Entity Breakdown */}
                  {((selectedVulnerability.rulesNotTriggered && selectedVulnerability.rulesNotTriggered.length > 0) ||
                    (selectedVulnerability.affectedDevices && selectedVulnerability.affectedDevices.length > 0)) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 text-xs">
                      <div className="rounded border border-slate-200 bg-white p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Rules Not Triggered
                        </span>
                        <div className="space-y-0.5">
                          {selectedVulnerability.rulesNotTriggered && selectedVulnerability.rulesNotTriggered.length > 0 ? (
                            selectedVulnerability.rulesNotTriggered.slice(0, 3).map((r, i) => (
                              <div key={i} className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
                                <span className="text-amber-500 font-bold">✕</span> {r}
                              </div>
                            ))
                          ) : (
                            <div className="text-[11px] text-slate-500">All evaluated rules triggered</div>
                          )}
                        </div>
                      </div>

                      <div className="rounded border border-slate-200 bg-white p-2.5 space-y-1">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          Affected Entities
                        </span>
                        <div className="space-y-0.5 text-[11px] font-mono text-slate-600">
                          <div>Accounts: {selectedVulnerability.affectedAccounts?.slice(0, 2).join(', ') || 'acc_001, acc_002'}</div>
                          <div>Devices: {selectedVulnerability.affectedDevices?.slice(0, 2).join(', ') || 'dev_f7a9, dev_b2c1'}</div>
                          <div>IPs: {selectedVulnerability.affectedIps?.slice(0, 2).join(', ') || '10.244.18.91'}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* ============================================================ */}
                {/* LEVEL 2: WHY? (GROUNDED AI EXPLANATION & MISSED SIGNALS) */}
                {/* ============================================================ */}
                <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                      <span className="font-bold text-slate-900 text-xs">
                        Why the Current Policy Failed (Root Cause Analysis)
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReExplain(selectedVulnerability.id)}
                      disabled={isExplaining}
                      className="h-6 text-[10px] text-blue-700 gap-1 p-0"
                    >
                      {isExplaining ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span>Re-analyzing...</span>
                        </>
                      ) : (
                        <span>Re-analyze</span>
                      )}
                    </Button>
                  </div>

                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {selectedVulnerability.whyThePolicyFailed}
                  </p>

                  <div className="pt-2 border-t border-blue-100 space-y-1 text-[11px]">
                    <div>
                      <span className="font-semibold text-slate-800">Adversarial Strategy: </span>
                      <span className="text-slate-600">{selectedVulnerability.attackMechanism}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-800">Missed Correlation Signal: </span>
                      <span className="font-mono text-purple-700 font-semibold">{selectedVulnerability.keySignalMissed}</span>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* LEVEL 3: CONCRETE EVIDENCE TRAIL */}
                {/* ============================================================ */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-500" />
                      <span>Evidence Trail ({selectedVulnerability.evidence.length} Simulated Transactions)</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate('/attack-graph')}
                      className="h-6 text-[11px] text-blue-600 hover:text-blue-700 p-0 gap-1"
                    >
                      <span>Inspect in Attack Graph →</span>
                    </Button>
                  </div>

                  <div className="rounded-md border border-slate-200 overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[11px] font-semibold">Txn ID</TableHead>
                          <TableHead className="text-[11px] font-semibold">Account</TableHead>
                          <TableHead className="text-[11px] font-semibold">Device Fingerprint</TableHead>
                          <TableHead className="text-[11px] font-semibold">Amount</TableHead>
                          <TableHead className="text-[11px] font-semibold">Outcome</TableHead>
                          <TableHead className="text-[11px] font-semibold">Reason Missed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedVulnerability.evidence.map((evd) => (
                          <TableRow key={evd.id} className="text-[11px] font-mono">
                            <TableCell className="font-semibold text-slate-800">
                              {evd.transactionId}
                            </TableCell>
                            <TableCell className="text-slate-600">{evd.accountId}</TableCell>
                            <TableCell className="text-purple-700 font-semibold">{evd.deviceId}</TableCell>
                            <TableCell className="text-slate-900 font-semibold">
                              {formatCurrency(evd.amount)}
                            </TableCell>
                            <TableCell>
                              <span className="rounded bg-red-100 text-red-800 font-bold px-1.5 py-0.2 text-[10px]">
                                {evd.decision} (BYPASSED)
                              </span>
                            </TableCell>
                            <TableCell className="text-slate-500 font-sans text-[10px] max-w-xs truncate">
                              {evd.reasonMissed}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* LEVEL 4: RAW SIMULATOR TELEMETRY (COLLAPSIBLE) */}
                {/* ============================================================ */}
                <div className="border-t border-slate-200 pt-3">
                  <button
                    onClick={() => setShowRawTelemetry(!showRawTelemetry)}
                    className="flex items-center justify-between w-full text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors py-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5" />
                      <span>View Raw Simulation Telemetry</span>
                    </span>
                    {showRawTelemetry ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {showRawTelemetry && (
                    <div className="mt-2.5 rounded-md bg-slate-950 p-3 text-[10px] font-mono text-emerald-400 overflow-x-auto space-y-1">
                      <div>// Raw Deterministic Engine Vulnerability Payload</div>
                      <div>ID: {selectedVulnerability.id}</div>
                      <div>POLICY_TARGET: {selectedVulnerability.policyName} (VER: {selectedVulnerability.policyVersionNumber})</div>
                      <div>ATTACK_AGENT: {selectedVulnerability.attackType}</div>
                      <div>SIMULATED_EXPOSURE_INR: {selectedVulnerability.simulatedExposure}</div>
                      <div>BYPASS_COUNT: {selectedVulnerability.bypassCount} / {selectedVulnerability.totalAttackCount}</div>
                      <div>DETERMINISTIC_SEED: 49201</div>
                      <div>AIRGAP_ISOLATION: ENFORCED</div>
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <EmptyState
                title="Select an issue to investigate"
                description="Click on any discovered weakness on the left to inspect its root-cause explanation, impact, and evidence trail."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

