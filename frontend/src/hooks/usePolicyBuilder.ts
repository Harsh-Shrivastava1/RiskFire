import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { policyRepository } from '@/services/repositories'
import { PolicyCategory, PolicyRule, PolicyRuleType, RuleAction, RiskPolicy } from '@/types'

export const usePolicyBuilder = () => {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<PolicyCategory>('VELOCITY')
  const [rules, setRules] = useState<PolicyRule[]>([
    {
      id: `rule-${Date.now()}`,
      policyVersionId: 'temp-pv',
      name: 'Account Velocity Constraint',
      ruleType: 'VELOCITY_ACCOUNT',
      category: 'VELOCITY',
      parameters: { maxCount: 3, windowMinutes: 10 },
      action: 'BLOCK',
      isEnabled: true,
      sequenceOrder: 1,
      description: 'Block account if > 3 transactions occur within a 10-minute window.',
    },
  ])
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const addRule = () => {
    const newRule: PolicyRule = {
      id: `rule-${Date.now()}`,
      policyVersionId: 'temp-pv',
      name: 'New Rule Constraint',
      ruleType: 'VELOCITY_DEVICE',
      category: category,
      parameters: { maxCount: 6, windowMinutes: 10 },
      action: 'BLOCK',
      isEnabled: true,
      sequenceOrder: rules.length + 1,
      description: 'Secondary hardware rate limit.',
    }
    setRules([...rules, newRule])
  }

  const updateRule = (index: number, updated: Partial<PolicyRule>) => {
    const newRules = [...rules]
    newRules[index] = { ...newRules[index], ...updated }
    setRules(newRules)
  }

  const removeRule = (index: number) => {
    if (rules.length <= 1) return
    setRules(rules.filter((_, i) => i !== index))
  }

  const validate = () => {
    const errors: string[] = []
    if (!name.trim()) errors.push('Policy name is required.')
    if (!description.trim()) errors.push('Policy description is required.')
    if (rules.length === 0) errors.push('At least one policy rule must be configured.')
    setValidationErrors(errors)
    return errors.length === 0
  }

  const savePolicy = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await policyRepository.createPolicy({
        name,
        description,
        category,
        ruleCount: rules.length,
        isActive: true,
        versions: [
          {
            id: `pv-${Date.now()}`,
            policyId: `pol-${Date.now()}`,
            versionNumber: 'v1.0',
            status: 'ACTIVE',
            rules,
            createdAt: new Date().toISOString(),
            createdBy: 'Arjun Mehta',
            notes: 'Initial policy configuration created via PolicyBuilder.',
          },
        ],
      })
      setSaving(false)
      navigate('/policies')
    } catch (err) {
      console.error(err)
      setSaving(false)
    }
  }

  return {
    name,
    setName,
    description,
    setDescription,
    category,
    setCategory,
    rules,
    addRule,
    updateRule,
    removeRule,
    savePolicy,
    saving,
    validationErrors,
  }
}
