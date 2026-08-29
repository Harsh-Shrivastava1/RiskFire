import React from 'react'
import { useAuditLog, AuditActorFilter } from '@/hooks/useAuditLog'
import { PageHeader } from '@/components/layout/PageHeader'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { EmptyState } from '@/components/common/EmptyState'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  FileText,
  Search,
  Lock,
  User,
  Bot,
  Cpu,
  ShieldCheck,
  Hash,
} from 'lucide-react'
import { formatDate } from '@/utils/formatters'

const actorFilters: { label: string; value: AuditActorFilter }[] = [
  { label: 'All Logged Actions', value: 'ALL' },
  { label: 'User Operations', value: 'USER' },
  { label: 'AI Agent Actions', value: 'AI_AGENT' },
  { label: 'System Engine', value: 'SYSTEM' },
]

export const AuditLog: React.FC = () => {
  const {
    logs,
    totalCount,
    actorFilter,
    setActorFilter,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch,
  } = useAuditLog()

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
        title="Audit Log"
        description="Immutable record of policy changes, simulation executions, and patch approvals."
        badge={
          <div className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-0.5 text-xs font-mono font-bold text-slate-700">
            <Lock className="h-3 w-3" />
            <span>APPEND ONLY</span>
          </div>
        }
      />

      <div className="px-6 space-y-4 w-full">
        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by action, actor, or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto pb-1 sm:pb-0">
            {actorFilters.map((flt) => (
              <button
                key={flt.value}
                onClick={() => setActorFilter(flt.value)}
                className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  actorFilter === flt.value
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Table */}
        {logs.length === 0 ? (
          <EmptyState
            title="No audit log entries found"
            description="No log records match your active search query or actor filter."
            actionLabel="Reset Search"
            onAction={() => {
              setActorFilter('ALL')
              setSearchQuery('')
            }}
          />
        ) : (
          <Card className="shadow-2xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold">Action Performed</TableHead>
                  <TableHead className="text-xs font-semibold">Actor Type</TableHead>
                  <TableHead className="text-xs font-semibold">Actor Name</TableHead>
                  <TableHead className="text-xs font-semibold">Target Entity</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-xs">
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell className="font-mono text-slate-500 text-[11px] whitespace-nowrap">
                      {formatDate(log.timestamp)}
                    </TableCell>

                    <TableCell className="font-semibold text-slate-900 font-mono">
                      {log.action}
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.actorType === 'USER'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.actorType === 'AI_AGENT'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.actorType === 'USER' ? (
                          <User className="h-3 w-3" />
                        ) : log.actorType === 'AI_AGENT' ? (
                          <Bot className="h-3 w-3" />
                        ) : (
                          <Cpu className="h-3 w-3" />
                        )}
                        <span>{log.actorType}</span>
                      </span>
                    </TableCell>

                    <TableCell className="font-medium text-slate-800">
                      {log.actorName}
                    </TableCell>

                    <TableCell className="font-mono text-slate-600">
                      <div>{log.entityType}</div>
                      <span className="text-[10px] text-slate-400 font-normal">{log.entityName || log.entityId}</span>
                    </TableCell>

                    <TableCell>
                      <span className="font-mono text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {log.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  )
}
