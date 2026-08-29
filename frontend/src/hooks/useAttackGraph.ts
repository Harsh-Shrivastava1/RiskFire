import { useState, useEffect } from 'react'
import { graphRepository } from '@/services/repositories'
import { AttackGraphData, GraphNodeData } from '@/types'

export const useAttackGraph = (simulationId?: string) => {
  const [graphData, setGraphData] = useState<AttackGraphData | null>(null)
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGraph = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await graphRepository.getAttackGraph(simulationId)
      setGraphData(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to load attack graph topology')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGraph()
  }, [simulationId])

  return {
    graphData,
    selectedNode,
    setSelectedNode,
    loading,
    error,
    refetch: fetchGraph,
  }
}
