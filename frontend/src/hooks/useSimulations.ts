import { useState, useEffect } from 'react'
import { simulationRepository } from '@/services/repositories'
import { SimulationRun, SimulationStatus } from '@/types'

export const useSimulations = () => {
  const [simulations, setSimulations] = useState<SimulationRun[]>([])
  const [statusFilter, setStatusFilter] = useState<SimulationStatus | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSimulations = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await simulationRepository.getSimulations()
      setSimulations(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch simulations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSimulations()
  }, [])

  const filteredSimulations = simulations.filter((sim) => {
    const matchesStatus = statusFilter === 'ALL' || sim.status === statusFilter
    const matchesSearch =
      sim.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sim.seed.toString().includes(searchQuery)
    return matchesStatus && matchesSearch
  })

  return {
    simulations: filteredSimulations,
    totalCount: simulations.length,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    loading,
    error,
    refetch: fetchSimulations,
  }
}
