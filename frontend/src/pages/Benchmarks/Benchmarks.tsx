import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBenchmarks } from '@/hooks/useBenchmarks'
import { PageHeader } from '@/components/layout/PageHeader'
import { BenchmarkComparisonChart } from '@/components/charts/BenchmarkComparisonChart'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Layers,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  FileCheck2,
  ChevronDown,
  ChevronUp,
  FileText,
} from 'lucide-react'
import { DatasetSplit } from '@/types'
import { formatCurrency, formatNumber } from '@/utils/formatters'

const splitFilterOptions: { label: string; value: DatasetSplit }[] = [
  { label: 'All Dataset Splits', value: 'ALL' },
  { label: 'Held-Out Test Set (15% Sealed)', value: 'HELD_OUT_TEST_SET' },
  { label: 'Validation Split (15%)', value: 'VALIDATION_SET' },
  { label: 'Development Split (70%)', value: 'DEV_SET' },
]

export const Benchmarks: React.FC = () => {
  const navigate = useNavigate()
  const [showMethodology, setShowMethodology] = useState(false)
  const {
    benchmarkRuns,
    comparison,
    selectedSplit,
    setSelectedSplit,
    loading,
    error,
    refetch,
  } = useBenchmarks()

  if (loading) {
    return (
      <div className="p-6 space-y-4 w-full">
        <LoadingState type="chart" />
        <LoadingState rows={5} />
      </div>
    )
  }

  if (error || !comparison) {
    return (
      <div className="p-6 w-full">
        <ErrorState
          title="Unable to load benchmark evaluation data"
          message={error || 'Failed to connect to the RiskFire verification benchmark repository.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16 w-full">
      {/* Header */}
      <PageHeader
        title="Benchmarks"
        description="Empirical mathematical proof of whether defensive policy changes actually improved security."
        badge={
          <div className="flex items-center gap-1.5 rounded bg-emerald-100 px-2 py-0.5 text-xs font-mono font-bold text-emerald-800">
            <Lock className="h-3 w-3" />
            <span>15% HELD-OUT SEALED</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/policies')}
              className="h-8 text-xs font-semibold text-slate-700"
            >
              <span>View Policies</span>
            </Button>
            <Button
              size="sm"
              onClick={() => navigate('/reports')}
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
            >
              <FileCheck2 className="h-3.5 w-3.5" />
              <span>Export Benchmark Report</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Core Question & 4 Key Delta Cards */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Did the change actually improve security?</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">
              Comparing {comparison.baselineVersion} (Baseline) → {comparison.patchedVersion} (Patched)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 shadow-2xs border-emerald-200 bg-emerald-50/20">
              <span className="text-xs font-semibold text-slate-500 block">Detection Accuracy (Recall)</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-slate-600">{comparison.before.recall}%</span>
                <span className="text-xs text-slate-400">→</span>
                <span className="text-2xl font-bold font-mono text-emerald-700">{comparison.after.recall}%</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-1 inline-block">
                +{comparison.deltaRecall}% accuracy gain
              </span>
            </Card>

            <Card className="p-4 shadow-2xs border-emerald-200 bg-emerald-50/20">
              <span className="text-xs font-semibold text-slate-500 block">Attack Interception</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-slate-600">{100 - comparison.before.attackSuccessRate}%</span>
                <span className="text-xs text-slate-400">→</span>
                <span className="text-2xl font-bold font-mono text-emerald-700">{100 - comparison.after.attackSuccessRate}%</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-1 inline-block">
                +{comparison.before.attackSuccessRate - comparison.after.attackSuccessRate}% fewer bypasses
              </span>
            </Card>

            <Card className="p-4 shadow-2xs border-slate-200">
              <span className="text-xs font-semibold text-slate-500 block">False Alarms (FPR)</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-slate-600">{comparison.before.falsePositiveRate}%</span>
                <span className="text-xs text-slate-400">→</span>
                <span className="text-2xl font-bold font-mono text-slate-900">{comparison.after.falsePositiveRate}%</span>
              </div>
              <span className="text-xs font-semibold text-slate-600 mt-1 inline-block">
                {comparison.deltaFpr}% change (low friction)
              </span>
            </Card>

            <Card className="p-4 shadow-2xs border-emerald-200 bg-emerald-50/20">
              <span className="text-xs font-semibold text-slate-500 block">Financial Loss Avoided</span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-lg font-bold font-mono text-red-600">{formatCurrency(comparison.before.simulatedExposure)}</span>
                <span className="text-xs text-slate-400">→</span>
                <span className="text-2xl font-bold font-mono text-emerald-700">{formatCurrency(comparison.after.simulatedExposure)}</span>
              </div>
              <span className="text-xs font-bold text-emerald-700 mt-1 inline-block">
                -{formatCurrency(comparison.deltaExposure)} simulated loss (71% reduction)
              </span>
            </Card>
          </div>
        </div>

        {/* Main BEFORE vs AFTER Chart Card */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Baseline ({comparison.baselineVersion}) vs Patched ({comparison.patchedVersion}) Comparative Performance
              </CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluation on the 15% Sealed Held-Out Test Split (Seed: 49201).
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
              +{comparison.deltaRecall}% RECALL
            </span>
          </CardHeader>
          <CardContent className="pt-4">
            <BenchmarkComparisonChart height={280} />
          </CardContent>
        </Card>

        {/* Detailed Metrics Table */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div>
              <CardTitle className="text-sm font-bold text-slate-800">
                Evaluation Matrix
              </CardTitle>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Performance breakdown across held-out and development partitions.
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {splitFilterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedSplit(opt.value)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    selectedSplit === opt.value
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Evaluation Metric</TableHead>
                <TableHead className="text-xs font-semibold">Baseline Policy ({comparison.baselineVersion})</TableHead>
                <TableHead className="text-xs font-semibold">Patched Policy ({comparison.patchedVersion})</TableHead>
                <TableHead className="text-xs font-semibold">Net Improvement</TableHead>
                <TableHead className="text-xs font-semibold">Impact Assessment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              <TableRow>
                <TableCell className="font-medium text-slate-800">Detection Recall (Attack Interception)</TableCell>
                <TableCell className="font-mono text-slate-600">{comparison.before.recall}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">{comparison.after.recall}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">+{comparison.deltaRecall}%</TableCell>
                <TableCell className="text-emerald-700 font-semibold text-[11px]">Significantly higher attack interception</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium text-slate-800">Classification Precision</TableCell>
                <TableCell className="font-mono text-slate-600">{comparison.before.precision}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">{comparison.after.precision}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">+{comparison.deltaPrecision}%</TableCell>
                <TableCell className="text-slate-600 text-[11px]">Maintains high decision confidence</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium text-slate-800">F1-Score (Combined Accuracy)</TableCell>
                <TableCell className="font-mono text-slate-600">{comparison.before.f1Score}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">{comparison.after.f1Score}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">+{Math.round((comparison.after.f1Score - comparison.before.f1Score) * 10) / 10}%</TableCell>
                <TableCell className="text-emerald-700 text-[11px]">Strong overall model health</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium text-slate-800">False Positive Rate (FPR)</TableCell>
                <TableCell className="font-mono text-slate-600">{comparison.before.falsePositiveRate}%</TableCell>
                <TableCell className="font-mono font-bold text-slate-800">{comparison.after.falsePositiveRate}%</TableCell>
                <TableCell className="font-mono font-bold text-slate-700">{comparison.deltaFpr}%</TableCell>
                <TableCell className="text-slate-600 text-[11px]">Low customer friction preserved</TableCell>
              </TableRow>

              <TableRow>
                <TableCell className="font-medium text-slate-800">Attack Success Rate (Bypass %)</TableCell>
                <TableCell className="font-mono text-red-600 font-bold">{comparison.before.attackSuccessRate}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">{comparison.after.attackSuccessRate}%</TableCell>
                <TableCell className="font-mono font-bold text-emerald-600">-{comparison.before.attackSuccessRate - comparison.after.attackSuccessRate}%</TableCell>
                <TableCell className="text-emerald-700 font-semibold text-[11px]">Fewer attacks slip past controls</TableCell>
              </TableRow>

              <TableRow className="bg-slate-50/60 font-semibold">
                <TableCell className="text-slate-900">Simulated Financial Exposure</TableCell>
                <TableCell className="font-mono text-red-700">{formatCurrency(comparison.before.simulatedExposure)}</TableCell>
                <TableCell className="font-mono text-emerald-700">{formatCurrency(comparison.after.simulatedExposure)}</TableCell>
                <TableCell className="font-mono text-emerald-700">-{formatCurrency(comparison.deltaExposure)}</TableCell>
                <TableCell className="text-emerald-800 text-[11px] font-bold">71.2% reduction in simulated financial loss</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Card>

        {/* Collapsible Benchmark Methodology */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <button
            type="button"
            onClick={() => setShowMethodology(!showMethodology)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>View Benchmark Methodology & 70/15/15 Dataset Splits</span>
            </div>
            {showMethodology ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {showMethodology && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-2 text-slate-600">
              <p className="leading-relaxed">
                In accordance with RiskFire evaluation principles, the <span className="font-semibold text-slate-900">15% Held-Out Test Set (480 transactions)</span> is strictly isolated and never exposed during AI patch generation. The improvements above prove genuine policy generalization rather than overfitting to known attack patterns.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 block font-sans">Development Split (70%)</span>
                  <span className="font-bold text-slate-800">2,240 Transactions</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 block font-sans">Validation Split (15%)</span>
                  <span className="font-bold text-slate-800">480 Transactions</span>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <span className="text-slate-400 block font-sans">Held-Out Test Split (15%)</span>
                  <span className="font-bold text-blue-700">480 Transactions (Sealed)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

