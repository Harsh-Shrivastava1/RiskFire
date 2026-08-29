import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useIncidents } from '@/hooks/useIncidents'
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
  ShieldAlert,
  Search,
  CheckCircle2,
  Wrench,
  Flame,
  ArrowRight,
  Clock,
  User,
} from 'lucide-react'
import { Incident } from '@/types'
import { formatCurrency, formatDate } from '@/utils/formatters'

const incidentStatusOptions = [
  { label: 'All Incidents', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'Investigating', value: 'INVESTIGATING' },
  { label: 'Mitigated', value: 'MITIGATED' },
  { label: 'Resolved', value: 'RESOLVED' },
]

export const Incidents: React.FC = () => {
  const navigate = useNavigate()
  const {
    incidents,
    selectedIncident,
    setSelectedIncident,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    refetch,
  } = useIncidents()

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <LoadingState rows={6} />
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
        title="Simulation Incidents"
        description="Historical archive of policy breach events triggered during automated adversarial stress testing."
        badge={
          <span className="rounded bg-red-100 text-red-700 px-2 py-0.5 text-xs font-mono font-bold">
            {incidents.length} Incidents
          </span>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {incidentStatusOptions.map((opt) => (
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

        {/* Split Master-Detail Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 5 Cols: Incident List */}
          <div className="lg:col-span-5 space-y-3">
            {incidents.length === 0 ? (
              <EmptyState
                title="No incidents found"
                description="No simulation breach events match the selected status filter."
                actionLabel="Clear Filter"
                onAction={() => setStatusFilter('ALL')}
              />
            ) : (
              incidents.map((inc) => {
                const isSelected = selectedIncident?.id === inc.id
                return (
                  <Card
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className={`p-4 cursor-pointer transition-all shadow-2xs ${
                      isSelected
                        ? 'border-blue-600 ring-1 ring-blue-500 bg-blue-50/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-900 line-clamp-1">
                        {inc.title}
                      </span>
                      <SeverityBadge severity={inc.severity} />
                    </div>

                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {inc.summary}
                    </p>

                    <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-100 pt-2">
                      <StatusBadge status={inc.status} />
                      <span>{formatDate(inc.detectedAt)}</span>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Right 7 Cols: Incident Detail */}
          <div className="lg:col-span-7">
            {selectedIncident ? (
              <Card className="shadow-2xs p-5 space-y-5">
                <div className="border-b border-border pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <SeverityBadge severity={selectedIncident.severity} />
                      <StatusBadge status={selectedIncident.status} />
                      <span className="font-mono text-xs text-slate-400 font-semibold">
                        {selectedIncident.id}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate('/patches')}
                      className="h-7 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 font-semibold"
                    >
                      <Wrench className="h-3 w-3" />
                      <span>View Patch</span>
                    </Button>
                  </div>

                  <h2 className="text-base font-bold text-slate-900">
                    {selectedIncident.title}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    Affects: {selectedIncident.affectedPolicyName} • Simulation ID: {selectedIncident.simulationId}
                  </p>
                </div>

                {/* Details */}
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                  <div className="space-y-1">
                    <span className="font-semibold text-slate-800">Incident Narrative</span>
                    <p className="text-slate-600 text-[11px] leading-relaxed">
                      {selectedIncident.summary}
                    </p>
                  </div>

                  {selectedIncident.vulnerabilityTitle && (
                    <div className="space-y-1 pt-2 border-t border-slate-200">
                      <span className="font-semibold text-slate-800">Associated Vulnerability</span>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {selectedIncident.vulnerabilityTitle}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-md border border-slate-200 p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Assigned Investigator</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedIncident.owner}</p>
                  </div>
                  <div className="rounded-md border border-slate-200 p-3">
                    <span className="text-[10px] uppercase font-semibold text-slate-400">Detection Timestamp</span>
                    <p className="font-mono text-slate-800 mt-0.5">{formatDate(selectedIncident.detectedAt)}</p>
                  </div>
                </div>

                {/* Timeline */}
                {selectedIncident.timeline && selectedIncident.timeline.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-semibold text-slate-800 text-xs block">
                      Incident Timeline & Milestones
                    </span>
                    <div className="rounded-md border border-slate-200 divide-y divide-border text-[11px]">
                      {selectedIncident.timeline.map((evt) => (
                        <div key={evt.id} className="p-3 flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-slate-800">{evt.title}</div>
                            <p className="text-slate-500 text-[10px] mt-0.5">{evt.description}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {formatDate(evt.timestamp)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ) : (
              <EmptyState
                title="Select an incident"
                description="Click on any logged incident on the left to inspect its root-cause analysis."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
