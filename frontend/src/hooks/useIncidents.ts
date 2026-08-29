import { useState, useEffect } from 'react'
import { incidentRepository } from '@/services/repositories'
import { Incident } from '@/types'

export const useIncidents = (selectedId?: string) => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchIncidents = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await incidentRepository.getIncidents()
      setIncidents(data)
      if (selectedId) {
        const found = data.find((i) => i.id === selectedId)
        if (found) setSelectedIncident(found)
      } else if (data.length > 0) {
        setSelectedIncident(data[0])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load incidents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchIncidents()
  }, [selectedId])

  const filteredIncidents = incidents.filter((inc) => {
    return statusFilter === 'ALL' || inc.status === statusFilter
  })

  return {
    incidents: filteredIncidents,
    selectedIncident,
    setSelectedIncident,
    statusFilter,
    setStatusFilter,
    loading,
    error,
    refetch: fetchIncidents,
  }
}
