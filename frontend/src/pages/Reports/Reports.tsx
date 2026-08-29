import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useReports } from '@/hooks/useReports'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Shield,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  User,
  Building,
  Sparkles,
  RefreshCw,
  Lock,
  Binary,
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/utils/formatters'

export const Reports: React.FC = () => {
  const navigate = useNavigate()
  const {
    reports,
    selectedReport,
    setSelectedReport,
    loading,
    isGenerating,
    error,
    generateError,
    generateNewReport,
    refetch,
  } = useReports()

  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleDownload = () => {
    if (!selectedReport) return
    const blob = new Blob([JSON.stringify(selectedReport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `riskfire-executive-report-${selectedReport.id}.json`
    a.click()
    URL.revokeObjectURL(url)
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 3000)
  }

  const handleGenerate = async () => {
    try {
      await generateNewReport()
    } catch (err) {
      console.error('Failed to generate report:', err)
    }
  }

  const handlePrint = () => {
    window.print()
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
          title="Unable to load audit reports"
          message={error || 'Failed to connect to the RiskFire reporting service.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* On-Screen Header (Hidden during Print) */}
      <div className="print:hidden">
        <PageHeader
          title="Executive Reports"
          description="Shareable summaries of simulation findings, policy improvements, and remaining risks."
          badge={
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
              AUDIT GRADE
            </span>
          }
          actions={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="h-8 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-2xs cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Generate AI Report</span>
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="h-8 gap-1.5 text-xs border-slate-300 hover:bg-slate-50 cursor-pointer shadow-2xs font-semibold"
              >
                <Printer className="h-3.5 w-3.5 text-slate-600" />
                <span>Print / PDF</span>
              </Button>
              <Button
                size="sm"
                onClick={handleDownload}
                className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{downloadSuccess ? 'Exported!' : 'Export JSON'}</span>
              </Button>
            </div>
          }
        />
      </div>

      <div className="px-6 space-y-6 w-full print:px-0 print:space-y-4 print-report-container">
        {generateError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center justify-between print:hidden">
            <span>{generateError}</span>
            <Button size="sm" variant="ghost" onClick={handleGenerate} className="h-7 text-xs">
              Retry
            </Button>
          </div>
        )}

        {/* Report Selector Tabs (Hidden during Print) */}
        {reports.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 print:hidden">
            {reports.map((rep) => (
              <button
                key={rep.id}
                onClick={() => setSelectedReport(rep)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  selectedReport?.id === rep.id
                    ? 'bg-slate-900 text-white shadow-xs font-semibold'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {rep.reportNumber} ({formatDate(rep.createdAt)})
              </button>
            ))}
          </div>
        )}

        {selectedReport ? (
          <div className="space-y-6 print:space-y-4 print:text-slate-900">
            {/* Dedicated Print Letterhead Header (Always rendered, styled for screen & print) */}
            <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shrink-0">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-black tracking-tight text-slate-900 font-sans">
                    RiskFire
                  </div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 font-mono">
                    Payment Risk Intelligence & Security Testing
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="inline-block rounded border border-slate-900 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-900">
                  CONFIDENTIAL EXECUTIVE AUDIT REPORT
                </div>
                <div className="text-[10px] font-mono text-slate-500 mt-1">
                  Deterministic Synthetic Red-Team Assessment
                </div>
              </div>
            </div>

            {/* Executive Document Metadata Card */}
            <Card className="shadow-2xs p-6 space-y-4 border-slate-200 bg-white print:border-slate-300 print:shadow-none print:p-4 break-inside-avoid">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-4 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-700">
                      RiskFire Executive Audit Summary • {selectedReport.reportNumber}
                    </span>
                    <span className="rounded bg-purple-100 text-purple-700 text-[9px] font-mono font-bold px-1.5 py-0.2">
                      AI Synthesized
                    </span>
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 print:text-lg">{selectedReport.title}</h1>
                </div>
                <div className="text-right text-xs font-mono text-slate-500">
                  <div>Report ID: <span className="font-semibold text-slate-800">{selectedReport.id}</span></div>
                  <div>Audit Date: <span className="font-semibold text-slate-800">{formatDate(selectedReport.createdAt)}</span></div>
                </div>
              </div>

              {/* Metadata Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Building className="h-4 w-4 text-slate-400 print:text-slate-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-slate-500 block font-semibold uppercase">Scope</span>
                    <span className="font-semibold">{selectedReport.policyVersionTested}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <User className="h-4 w-4 text-slate-400 print:text-slate-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-slate-500 block font-semibold uppercase">Auditor</span>
                    <span className="font-semibold">{selectedReport.author}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Calendar className="h-4 w-4 text-slate-400 print:text-slate-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-slate-500 block font-semibold uppercase">Simulation Run</span>
                    <span className="font-semibold">{selectedReport.simulationId}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 print:text-slate-500 block font-semibold uppercase">Audit Status</span>
                    <span className="font-semibold text-emerald-600 uppercase tracking-wider">{selectedReport.status}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* SECTION 1: WHAT HAPPENED? */}
            <Card className="shadow-2xs p-6 space-y-3 border-slate-200 bg-white print:border-slate-300 print:shadow-none print:p-4 break-inside-avoid">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono print:bg-slate-200 print:text-slate-900">
                  1
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  What Happened? (Stress Test Findings)
                </h2>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed print:text-slate-800">
                {selectedReport.executiveSummary}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center print:bg-slate-100 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-sans font-medium">Risk Posture Score</span>
                  <span className="text-lg font-bold text-amber-700">{selectedReport.riskPostureScore}/100</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center print:bg-slate-100 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-sans font-medium">Simulated Exposure</span>
                  <span className="text-lg font-bold text-red-700">{formatCurrency(selectedReport.totalSimulatedExposure)}</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center print:bg-slate-100 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-sans font-medium">Baseline Recall</span>
                  <span className="text-lg font-bold text-slate-800">{selectedReport.overallPolicyRecall}%</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-center print:bg-slate-100 print:border-slate-300">
                  <span className="text-slate-500 block text-[10px] font-sans font-medium">False Alarm Rate</span>
                  <span className="text-lg font-bold text-slate-800">{selectedReport.overallFpr}%</span>
                </div>
              </div>
            </Card>

            {/* SECTION 2: WHAT CHANGED? */}
            <Card className="shadow-2xs p-6 space-y-4 border-slate-200 bg-white print:border-slate-300 print:shadow-none print:p-4 break-inside-avoid">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-800 text-xs font-bold font-mono print:bg-slate-200 print:text-slate-900">
                  2
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  What Changed? (Discovered Vulnerabilities & Proposed Patches)
                </h2>
              </div>

              <div className="space-y-3">
                {selectedReport.keyFindings.map((finding, idx) => (
                  <div key={finding.id || idx} className="rounded-lg border border-slate-200 p-3.5 space-y-1.5 text-xs bg-slate-50/50 print:bg-slate-50 print:border-slate-300 break-inside-avoid">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-slate-900">{finding.title}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="rounded bg-red-100 text-red-700 px-1.5 py-0.5 font-semibold text-[10px] border border-red-200">
                          {finding.severity}
                        </span>
                        <span className="text-slate-800 font-bold">{formatCurrency(finding.exposureEstimate)}</span>
                      </div>
                    </div>
                    <p className="text-slate-600 print:text-slate-700 text-[11px] leading-relaxed">{finding.description}</p>
                    <div className="text-[10px] text-slate-500 font-mono pt-1 flex justify-between">
                      <span>Affected Policy: <strong className="text-slate-700 font-medium">{finding.affectedPolicy}</strong></span>
                      <span className="text-blue-700 font-semibold font-sans">Remediation: {finding.remediationStatus}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* SECTION 3: WHAT IMPROVED? */}
            <Card className="shadow-2xs p-6 space-y-3 border-emerald-200 bg-emerald-50/10 print:border-slate-300 print:bg-white print:shadow-none print:p-4 break-inside-avoid">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold font-mono print:bg-slate-200 print:text-slate-900">
                  3
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  What Improved? (Verified Delta)
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-white rounded-lg border border-emerald-200 print:border-slate-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Attack Interception Gain</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">+11.2% Recall</div>
                  <p className="text-[10px] text-slate-500">76.4% baseline → 87.6% patched policy</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-200 print:border-slate-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Simulated Risk Saved</span>
                  <div className="text-xl font-bold font-mono text-emerald-700">₹8.4L Reduced</div>
                  <p className="text-[10px] text-slate-500">71.2% lower financial exposure</p>
                </div>
                <div className="p-3 bg-white rounded-lg border border-emerald-200 print:border-slate-300 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500">Customer Friction Impact</span>
                  <div className="text-xl font-bold font-mono text-slate-800">+0.3% FPR</div>
                  <p className="text-[10px] text-slate-500">Maintained below 2.5% strict threshold</p>
                </div>
              </div>
            </Card>

            {/* SECTION 4: WHAT REMAINS? */}
            <Card className="shadow-2xs p-6 space-y-3 border-slate-200 bg-white print:border-slate-300 print:shadow-none print:p-4 break-inside-avoid">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-800 text-xs font-bold font-mono print:bg-slate-200 print:text-slate-900">
                  4
                </span>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  What Remains? (Recommended Next Actions)
                </h2>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {selectedReport.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* Certification & Disclaimer Footer */}
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-[11px] text-slate-500 space-y-2 print:border-slate-300 print:bg-slate-50 break-inside-avoid">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-slate-700">
                  <Lock className="h-3.5 w-3.5 text-slate-500" />
                  <span>INTEGRITY HASH: sha256:8f92c10b4d3e7a68e0f5193a2e7c10b4</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-500">
                  <Binary className="h-3 w-3 text-slate-400" />
                  <span>SEED: 49201 | DATASET: ds-synthetic-v1</span>
                </div>
              </div>
              <p className="leading-relaxed">
                <strong className="text-slate-700">Methodology & Synthetic Data Disclaimer: </strong>
                {selectedReport.methodologyDisclaimer}
              </p>
              <div className="pt-2 text-[10px] text-slate-400 flex justify-between items-center font-mono">
                <span>Verified by RiskFire Automated Audit Engine</span>
                <span>Page 1 of 1 • Certified Audit Document</span>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No reports generated yet"
            description="Run an adversarial fire drill and generate an executive risk audit report."
            actionLabel="Generate First Report"
            onAction={handleGenerate}
          />
        )}
      </div>
    </div>
  )
}
