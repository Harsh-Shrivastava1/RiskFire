import { useState, useEffect } from 'react'
import { patchRepository } from '@/services/repositories'
import { PolicyPatch, PatchStatus } from '@/types'

export const usePatches = (selectedId?: string) => {
  const [patches, setPatches] = useState<PolicyPatch[]>([])
  const [selectedPatch, setSelectedPatch] = useState<PolicyPatch | null>(null)
  const [statusFilter, setStatusFilter] = useState<PatchStatus | 'ALL'>('ALL')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPatches = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await patchRepository.getPatches()
      setPatches(data)
      if (selectedId) {
        const found = data.find((p) => p.id === selectedId)
        if (found) setSelectedPatch(found)
        else if (data.length > 0) setSelectedPatch(data[0])
      } else if (data.length > 0) {
        setSelectedPatch(data[0])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch policy patches')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatches()
  }, [selectedId])

  const evaluatePatch = async (patchId: string, split: string = 'held_out', seed: number = 49201) => {
    setActionLoading(true)
    try {
      const updated = await patchRepository.evaluatePatch(patchId, split, seed)
      setPatches((prev) => prev.map((p) => (p.id === patchId ? updated : p)))
      setSelectedPatch(updated)
      return updated
    } catch (err: any) {
      console.error('Failed to evaluate patch:', err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const iteratePatch = async (patchId: string, feedbackNotes?: string, targetSplit: string = 'held_out') => {
    setActionLoading(true)
    try {
      const newCandidate = await patchRepository.iteratePatch(patchId, feedbackNotes, targetSplit)
      setPatches((prev) => [newCandidate, ...prev])
      setSelectedPatch(newCandidate)
      return newCandidate
    } catch (err: any) {
      console.error('Failed to iterate patch:', err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const simulatePatch = async (patchId: string) => {
    return await evaluatePatch(patchId, 'held_out')
  }

  const approvePatch = async (patchId: string, notes?: string) => {
    setActionLoading(true)
    try {
      const updated = await patchRepository.approvePatch(patchId, notes)
      setPatches((prev) => prev.map((p) => (p.id === patchId ? updated : p)))
      setSelectedPatch(updated)
      return updated
    } catch (err: any) {
      console.error(err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const rejectPatch = async (patchId: string, reason?: string) => {
    setActionLoading(true)
    try {
      const updated = await patchRepository.rejectPatch(patchId, reason)
      setPatches((prev) => prev.map((p) => (p.id === patchId ? updated : p)))
      setSelectedPatch(updated)
      return updated
    } catch (err: any) {
      console.error(err)
      throw err
    } finally {
      setActionLoading(false)
    }
  }

  const filteredPatches = patches.filter((p) => {
    return statusFilter === 'ALL' || p.status === statusFilter
  })

  // Candidates for the same vulnerability
  const relatedCandidates = selectedPatch
    ? patches.filter((p) => p.vulnerabilityId === selectedPatch.vulnerabilityId)
    : []

  return {
    patches: filteredPatches,
    allPatches: patches,
    relatedCandidates,
    selectedPatch,
    setSelectedPatch,
    statusFilter,
    setStatusFilter,
    loading,
    actionLoading,
    error,
    simulatePatch,
    evaluatePatch,
    iteratePatch,
    approvePatch,
    rejectPatch,
    refetch: fetchPatches,
  }
}
