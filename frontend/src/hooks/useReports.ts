import { useState, useEffect } from 'react'
import { reportRepository } from '@/services/repositories'
import { ExecutiveReport } from '@/types'

export const useReports = (selectedId?: string) => {
  const [reports, setReports] = useState<ExecutiveReport[]>([])
  const [selectedReport, setSelectedReport] = useState<ExecutiveReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const fetchReports = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportRepository.getReports()
      setReports(data)
      if (selectedId) {
        const found = data.find((r) => r.id === selectedId)
        if (found) setSelectedReport(found)
      } else if (data.length > 0) {
        setSelectedReport(data[0])
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load executive reports')
    } finally {
      setLoading(false)
    }
  }

  const generateNewReport = async (title?: string) => {
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const newReport = await reportRepository.generateReport({ title })
      setReports((prev) => [newReport, ...prev])
      setSelectedReport(newReport)
      return newReport
    } catch (err: any) {
      setGenerateError(err?.message || 'Failed to generate AI executive report')
      throw err
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [selectedId])

  return {
    reports,
    selectedReport,
    setSelectedReport,
    loading,
    isGenerating,
    error,
    generateError,
    generateNewReport,
    refetch: fetchReports,
  }
}
