import { useState, useEffect } from 'react'
import { benchmarkRepository } from '@/services/repositories'
import { BenchmarkRun, BenchmarkComparison, DatasetSplit } from '@/types'

export const useBenchmarks = () => {
  const [benchmarkRuns, setBenchmarkRuns] = useState<BenchmarkRun[]>([])
  const [comparison, setComparison] = useState<BenchmarkComparison | null>(null)
  const [selectedSplit, setSelectedSplit] = useState<DatasetSplit | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBenchmarks = async () => {
    setLoading(true)
    setError(null)
    try {
      const [runs, comp] = await Promise.all([
        benchmarkRepository.getBenchmarkRuns(),
        benchmarkRepository.getComparison(),
      ])
      setBenchmarkRuns(runs)
      setComparison(comp)
    } catch (err: any) {
      setError(err?.message || 'Failed to load benchmark evaluations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBenchmarks()
  }, [])

  const filteredRuns = benchmarkRuns.filter((run) => {
    return selectedSplit === 'ALL' || run.datasetSplit === selectedSplit
  })

  return {
    benchmarkRuns: filteredRuns,
    comparison,
    selectedSplit,
    setSelectedSplit,
    loading,
    error,
    refetch: fetchBenchmarks,
  }
}
