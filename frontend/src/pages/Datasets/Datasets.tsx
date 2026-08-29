import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useDatasets } from '@/hooks/useDatasets'
import { PageHeader } from '@/components/layout/PageHeader'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  Database,
  Lock,
  Flame,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { DatasetSplitType } from '@/types'
import { formatNumber, formatDate } from '@/utils/formatters'

const splitFilterOptions: { label: string; value: DatasetSplitType | 'ALL' }[] = [
  { label: 'All Datasets', value: 'ALL' },
  { label: 'Held-Out Test Set (15% Sealed)', value: 'held_out' },
  { label: 'Validation Split (15%)', value: 'validation' },
  { label: 'Development Split (70%)', value: 'development' },
]

export const Datasets: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, totalCount, splitFilter, setSplitFilter, loading, error, refetch } = useDatasets()

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingState rows={5} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorState message={error} onRetry={refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Datasets"
        description="Synthetic payment datasets partitioned into 70% Development, 15% Validation, and 15% Sealed Held-Out Test splits."
        badge={
          <span className="rounded bg-blue-100 text-blue-800 px-2 py-0.5 text-xs font-mono font-bold">
            {totalCount} Datasets
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={() => navigate('/attack-lab')}
            className="h-8 gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
          >
            <Flame className="h-3.5 w-3.5" />
            <span>Generate New Run</span>
          </Button>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Dataset Split Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Card className="p-4 shadow-2xs border-blue-200 bg-blue-50/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-blue-900">Development Split (70%)</span>
              <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                2,240 TXNS
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Exposed to red-team attack planner and vulnerability discovery engine.
            </p>
          </Card>

          <Card className="p-4 shadow-2xs border-purple-200 bg-purple-50/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-900">Validation Split (15%)</span>
              <span className="font-mono text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                480 TXNS
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Used for hyperparameter tuning and threshold calibration during patch synthesis.
            </p>
          </Card>

          <Card className="p-4 shadow-2xs border-emerald-200 bg-emerald-50/20 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center gap-1">
                <Lock className="h-3.5 w-3.5 text-emerald-600" />
                <span>Held-Out Test Set (15%)</span>
              </span>
              <span className="font-mono text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                480 TXNS SEALED
              </span>
            </div>
            <p className="text-slate-500 text-[11px]">
              Strictly sealed. Used solely for post-patch generalization proof.
            </p>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {splitFilterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSplitFilter(opt.value)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                splitFilter === opt.value
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Datasets Table */}
        <Card className="shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold">Dataset ID & Name</TableHead>
                <TableHead className="text-xs font-semibold">Version</TableHead>
                <TableHead className="text-xs font-semibold">Seed</TableHead>
                <TableHead className="text-xs font-semibold">Total Records</TableHead>
                <TableHead className="text-xs font-semibold">Partition Splits</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold">Created At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {datasets.map((ds) => (
                <TableRow key={ds.id} className="hover:bg-slate-50/60 transition-colors">
                  <TableCell className="font-medium text-slate-900">
                    <div className="font-semibold text-slate-800">{ds.name}</div>
                    <span className="font-mono text-[10px] text-slate-400">{ds.id}</span>
                  </TableCell>

                  <TableCell className="font-mono text-slate-700">
                    {ds.version}
                  </TableCell>

                  <TableCell className="font-mono text-blue-700 font-bold">
                    {ds.generationSeed}
                  </TableCell>

                  <TableCell className="font-mono text-slate-800 font-bold">
                    {formatNumber(ds.totalRecords)} txns
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {ds.splits.map((s) => (
                        <span
                          key={s.split}
                          className={`font-mono text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            s.split === 'held_out'
                              ? 'bg-emerald-100 text-emerald-800'
                              : s.split === 'validation'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {s.split} ({s.percentage}%)
                        </span>
                      ))}
                    </div>
                  </TableCell>

                  <TableCell>
                    <span className="font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      {ds.status}
                    </span>
                  </TableCell>

                  <TableCell className="text-slate-500 font-mono text-[11px]">
                    {formatDate(ds.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  )
}
