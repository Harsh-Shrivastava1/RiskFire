import { useState, useEffect } from 'react'
import { auditRepository } from '@/services/repositories'
import { AuditLogEntry } from '@/types'

export type AuditActorFilter = 'ALL' | 'USER' | 'SYSTEM' | 'AI_AGENT'

export const useAuditLog = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [actorFilter, setActorFilter] = useState<AuditActorFilter>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await auditRepository.getAuditLogs()
      setLogs(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch audit log trail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const filteredLogs = logs.filter((log) => {
    const matchesActor = actorFilter === 'ALL' || log.actorType === actorFilter
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entityId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.entityName && log.entityName.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchesActor && matchesSearch
  })

  return {
    logs: filteredLogs,
    totalCount: logs.length,
    actorFilter,
    setActorFilter,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch: fetchLogs,
  }
}
