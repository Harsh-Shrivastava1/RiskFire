import { useState, useEffect } from 'react'
import { policyRepository } from '@/services/repositories'
import { RiskPolicy, PolicyCategory } from '@/types'

export const usePolicies = () => {
  const [policies, setPolicies] = useState<RiskPolicy[]>([])
  const [selectedCategory, setSelectedCategory] = useState<PolicyCategory | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPolicies = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await policyRepository.getPolicies()
      setPolicies(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch policies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPolicies()
  }, [])

  const togglePolicy = async (id: string, currentActive: boolean) => {
    try {
      await policyRepository.updatePolicy(id, { isActive: !currentActive })
      setPolicies((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !currentActive } : p))
      )
    } catch (err: any) {
      console.error(err)
    }
  }

  const filteredPolicies = policies.filter((policy) => {
    const matchesCategory =
      selectedCategory === 'ALL' || policy.category === selectedCategory
    const matchesSearch =
      policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return {
    policies: filteredPolicies,
    totalCount: policies.length,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    togglePolicy,
    loading,
    error,
    refetch: fetchPolicies,
  }
}
