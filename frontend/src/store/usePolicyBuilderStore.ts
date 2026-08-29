import { create } from 'zustand'
import { PolicyCategory, PolicyRule, PolicyRuleType, RuleAction } from '@/types'

export interface PolicyDraft {
  name: string
  description: string
  category: PolicyCategory
  priority: number
  rules: PolicyRule[]
}

interface PolicyBuilderState {
  draft: PolicyDraft
  setName: (name: string) => void
  setDescription: (description: string) => void
  setCategory: (category: PolicyCategory) => void
  setPriority: (priority: number) => void
  addRule: (rule: Omit<PolicyRule, 'id' | 'policyVersionId' | 'sequenceOrder'>) => void
  updateRule: (ruleId: string, updates: Partial<PolicyRule>) => void
  removeRule: (ruleId: string) => void
  toggleRule: (ruleId: string) => void
  reorderRules: (fromIndex: number, toIndex: number) => void
  resetDraft: () => void
}

const initialDraft: PolicyDraft = {
  name: 'POL-CUSTOM-001 (Distributed Defense Rule)',
  description: 'Proactively caps transaction rate per account and flags rapid multi-account device switching.',
  category: 'VELOCITY',
  priority: 1,
  rules: [
    {
      id: 'rule-draft-1',
      policyVersionId: 'pv-draft',
      name: 'Account Frequency Ceiling',
      ruleType: 'VELOCITY_ACCOUNT',
      category: 'VELOCITY',
      parameters: { maxTransactions: 3, windowMinutes: 10 },
      action: 'BLOCK',
      isEnabled: true,
      sequenceOrder: 1,
      description: 'IF Transactions COUNT > 3 WITHIN 10 minutes FOR Account THEN BLOCK',
    },
    {
      id: 'rule-draft-2',
      policyVersionId: 'pv-draft',
      name: 'Hardware Fingerprint Aggregate Limit',
      ruleType: 'VELOCITY_DEVICE',
      category: 'VELOCITY',
      parameters: { maxTransactions: 6, windowMinutes: 10 },
      action: 'BLOCK',
      isEnabled: true,
      sequenceOrder: 2,
      description: 'IF Transactions COUNT > 6 WITHIN 10 minutes FOR Device THEN BLOCK',
    },
    {
      id: 'rule-draft-3',
      policyVersionId: 'pv-draft',
      name: 'Shipping Address Account Cluster Flag',
      ruleType: 'IDENTITY_ADDRESS_REUSE',
      category: 'IDENTITY',
      parameters: { maxAccounts: 3, windowMinutes: 10 },
      action: 'FLAG',
      isEnabled: true,
      sequenceOrder: 3,
      description: 'IF Distinct Accounts >= 3 FOR Address WITHIN 10 minutes THEN FLAG',
    },
  ],
}

export const usePolicyBuilderStore = create<PolicyBuilderState>((set) => ({
  draft: initialDraft,
  setName: (name) => set((state) => ({ draft: { ...state.draft, name } })),
  setDescription: (description) => set((state) => ({ draft: { ...state.draft, description } })),
  setCategory: (category) => set((state) => ({ draft: { ...state.draft, category } })),
  setPriority: (priority) => set((state) => ({ draft: { ...state.draft, priority } })),
  addRule: (ruleData) =>
    set((state) => {
      const newRule: PolicyRule = {
        ...ruleData,
        id: `rule-draft-${Date.now()}`,
        policyVersionId: 'pv-draft',
        sequenceOrder: state.draft.rules.length + 1,
      }
      return {
        draft: {
          ...state.draft,
          rules: [...state.draft.rules, newRule],
        },
      }
    }),
  updateRule: (ruleId, updates) =>
    set((state) => ({
      draft: {
        ...state.draft,
        rules: state.draft.rules.map((r) => (r.id === ruleId ? { ...r, ...updates } : r)),
      },
    })),
  removeRule: (ruleId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        rules: state.draft.rules.filter((r) => r.id !== ruleId),
      },
    })),
  toggleRule: (ruleId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        rules: state.draft.rules.map((r) => (r.id === ruleId ? { ...r, isEnabled: !r.isEnabled } : r)),
      },
    })),
  reorderRules: (fromIndex, toIndex) =>
    set((state) => {
      const rules = [...state.draft.rules]
      const [moved] = rules.splice(fromIndex, 1)
      rules.splice(toIndex, 0, moved)
      return {
        draft: {
          ...state.draft,
          rules: rules.map((r, idx) => ({ ...r, sequenceOrder: idx + 1 })),
        },
      }
    }),
  resetDraft: () => set({ draft: initialDraft }),
}))
