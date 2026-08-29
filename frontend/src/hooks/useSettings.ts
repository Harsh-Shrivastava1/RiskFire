import { useState } from 'react'
import { useUiStore } from '@/store/useUiStore'

export interface PlatformSettings {
  userName: string
  userRole: string
  userEmail: string
  merchantName: string
  merchantId: string
  merchantCategory: string
  baselineRiskProfile: 'LOW' | 'MEDIUM' | 'HIGH'
  defaultSimulationSeed: number
  defaultSyntheticTransactions: number
  defaultLookbackMinutes: number
  aiProvider: string
  aiModel: string
  aiTemperature: number
  syntheticIsolationMode: boolean
  auditLogRetentionDays: number
  twoFactorEnforced: boolean
}

export const useSettings = () => {
  const { userName, userRole, userEmail, setUserName } = useUiStore()

  const [settings, setSettings] = useState<PlatformSettings>({
    userName: userName || 'Harsh Shrivastava',
    userRole: userRole || 'Merchant Admin',
    userEmail: userEmail || 'harshshrivasatava1@gmail.com',
    merchantName: 'Acme Payments India Pvt Ltd',
    merchantId: 'm-dev-01',
    merchantCategory: 'Digital Goods & Quick Commerce',
    baselineRiskProfile: 'MEDIUM',
    defaultSimulationSeed: 49201,
    defaultSyntheticTransactions: 3200,
    defaultLookbackMinutes: 10,
    aiProvider: 'Groq API (AIProvider Abstraction)',
    aiModel: 'openai/gpt-oss-120b',
    aiTemperature: 0.3,
    syntheticIsolationMode: true,
    auditLogRetentionDays: 90,
    twoFactorEnforced: true,
  })

  const [isSaved, setIsSaved] = useState(false)

  const updateSetting = <K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setIsSaved(false)
  }

  const saveSettings = async () => {
    if (settings.userName) {
      setUserName(settings.userName)
    }
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 4000)
  }

  return {
    settings,
    updateSetting,
    saveSettings,
    isSaved,
  }
}
