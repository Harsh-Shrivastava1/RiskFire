import { useState, useEffect } from 'react'
import { datasetRepository } from '@/services/repositories'
import { SyntheticDataset, DatasetSplitType } from '@/types'

export const useDatasets = () => {
  const [datasets, setDatasets] = useState<SyntheticDataset[]>([])
  const [splitFilter, setSplitFilter] = useState<DatasetSplitType | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDatasets = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await datasetRepository.getDatasets()
      setDatasets(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load synthetic datasets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [])

  const filteredDatasets = datasets.filter((ds) => {
    if (splitFilter === 'ALL') return true
    return ds.splits.some((s) => s.split === splitFilter)
  })

  return {
    datasets: filteredDatasets,
    totalCount: datasets.length,
    splitFilter,
    setSplitFilter,
    loading,
    error,
    refetch: fetchDatasets,
  }
}
