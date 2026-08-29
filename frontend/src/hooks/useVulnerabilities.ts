import { useState, useEffect } from 'react'
import { vulnerabilityRepository, patchRepository } from '@/services/repositories'
import { Vulnerability, RiskSeverity } from '@/types'

export const useVulnerabilities = (selectedId?: string) => {
  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([])
  const [selectedVulnerability, setSelectedVulnerability] = useState<Vulnerability | null>(null)
  const [severityFilter, setSeverityFilter] = useState<RiskSeverity | 'ALL'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [isExplaining, setIsExplaining] = useState(false)
  const [isGeneratingPatch, setIsGeneratingPatch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const fetchVulnerabilities = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await vulnerabilityRepository.getVulnerabilities()
      setVulnerabilities(data)
      if (selectedId) {
        const found = data.find((v) => v.id === selectedId)
        if (found) setSelectedVulnerability(found)
      } else if (data.length > 0) {
        setSelectedVulnerability(data[0])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch vulnerabilities')
    } finally {
      setLoading(false)
    }
  }

  const explainWithAi = async (vulnId: string) => {
    setIsExplaining(true)
    setAiError(null)
    try {
      const exp = await vulnerabilityRepository.explainVulnerability(vulnId)
      if (selectedVulnerability && selectedVulnerability.id === vulnId) {
        setSelectedVulnerability({
          ...selectedVulnerability,
          whyThePolicyFailed: exp.why_the_policy_failed || exp.whyThePolicyFailed || selectedVulnerability.whyThePolicyFailed,
          attackMechanism: exp.attack_mechanism || exp.attackMechanism || selectedVulnerability.attackMechanism,
          keySignalMissed: exp.key_signal_missed || exp.keySignalMissed || selectedVulnerability.keySignalMissed,
          contributingFactors: exp.contributing_factors || exp.contributingFactors || selectedVulnerability.contributingFactors,
        })
      }
      return exp
    } catch (err: any) {
      setAiError(err?.message || 'Failed to explain vulnerability with AI')
      throw err
    } finally {
      setIsExplaining(false)
    }
  }

  const synthesizePatch = async (vulnId: string) => {
    setIsGeneratingPatch(true)
    setAiError(null)
    try {
      const newPatch = await patchRepository.generatePatch(vulnId)
      return newPatch
    } catch (err: any) {
      setAiError(err?.message || 'Failed to generate policy patch with AI')
      throw err
    } finally {
      setIsGeneratingPatch(false)
    }
  }

  useEffect(() => {
    fetchVulnerabilities()
  }, [selectedId])

  const filteredVulnerabilities = vulnerabilities.filter((v) => {
    const matchesSeverity = severityFilter === 'ALL' || v.severity === severityFilter
    const matchesSearch =
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.policyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.vulnerabilityType.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSeverity && matchesSearch
  })

  return {
    vulnerabilities: filteredVulnerabilities,
    selectedVulnerability,
    setSelectedVulnerability,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    loading,
    isExplaining,
    isGeneratingPatch,
    error,
    aiError,
    explainWithAi,
    synthesizePatch,
    refetch: fetchVulnerabilities,
  }
}
