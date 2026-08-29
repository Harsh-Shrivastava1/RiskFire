import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { attackRepository, policyRepository, simulationRepository } from '@/services/repositories'
import { AttackAgent, RiskPolicy, AttackAgentType, AttackDifficulty } from '@/types'

export const useAttackLab = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const targetPolicyFromUrl = searchParams.get('targetPolicy') || searchParams.get('target_policy') || searchParams.get('policy_id') || ''

  const [agents, setAgents] = useState<AttackAgent[]>([])
  const [policies, setPolicies] = useState<RiskPolicy[]>([])
  const [selectedPolicyId, setSelectedPolicyId] = useState(targetPolicyFromUrl)
  const [selectedAgentTypes, setSelectedAgentTypes] = useState<AttackAgentType[]>([
    'VELOCITY_ATTACKER',
    'IDENTITY_FRAGMENTER',
  ])
  const [difficulty, setDifficulty] = useState<AttackDifficulty>('HIGH')
  const [seed, setSeed] = useState<number>(49201)
  const [legitimateCount, setLegitimateCount] = useState(2400)
  const [attackCount, setAttackCount] = useState(800)
  const [loading, setLoading] = useState(true)
  const [isLaunching, setIsLaunching] = useState(false)
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false)
  const [aiPlan, setAiPlan] = useState<any | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([attackRepository.getAgents(), policyRepository.getPolicies()]).then(
      ([agentList, policyList]) => {
        setAgents(agentList)
        setPolicies(policyList)
        if (policyList.length > 0) {
          if (targetPolicyFromUrl && policyList.some((p) => p.id === targetPolicyFromUrl)) {
            setSelectedPolicyId(targetPolicyFromUrl)
          } else if (!selectedPolicyId) {
            setSelectedPolicyId(policyList[0].id)
          }
        }
        setLoading(false)
      }
    )
  }, [targetPolicyFromUrl])

  const toggleAgent = (type: AttackAgentType) => {
    if (selectedAgentTypes.includes(type)) {
      if (selectedAgentTypes.length > 1) {
        setSelectedAgentTypes(selectedAgentTypes.filter((t) => t !== type))
      }
    } else {
      setSelectedAgentTypes([...selectedAgentTypes, type])
    }
  }

  const randomizeSeed = () => {
    setSeed(Math.floor(10000 + Math.random() * 90000))
  }

  const generateAiPlan = async () => {
    setIsGeneratingPlan(true)
    setPlanError(null)
    try {
      const selectedPolicy = policies.find((p) => p.id === selectedPolicyId)
      const primaryAgent = selectedAgentTypes[0] || 'IDENTITY_FRAGMENTER'
      const plan = await attackRepository.generateAttackPlan({
        active_policy_names: selectedPolicy ? [selectedPolicy.name] : ['Core Merchant Velocity & High-Value Guard'],
        attack_type: primaryAgent,
        difficulty,
      })
      setAiPlan(plan)
      if (plan.transaction_count) {
        setAttackCount(plan.transaction_count)
      }
    } catch (err: any) {
      setPlanError(err?.message || 'Failed to generate AI attack plan')
    } finally {
      setIsGeneratingPlan(false)
    }
  }

  const [launchError, setLaunchError] = useState<string | null>(null)

  const launchSimulation = async () => {
    setIsLaunching(true)
    setLaunchError(null)
    try {
      const selectedPolicy = policies.find((p) => p.id === selectedPolicyId)
      const sim = await simulationRepository.triggerSimulation({
        policyId: selectedPolicy?.id || 'pol-vel-01',
        policyVersionId: selectedPolicy?.currentVersionId,
        policyName: selectedPolicy?.name,
        seed,
        attackTypes: selectedAgentTypes,
        difficulty,
        legitimateTransactionCount: legitimateCount,
        attackTransactionCount: attackCount,
      })
      setIsLaunching(false)
      navigate(`/simulations/live?id=${sim.id}`)
    } catch (err: any) {
      console.error('Failed to launch simulation:', err)
      setLaunchError(err?.message || 'Failed to launch attack simulation')
      setIsLaunching(false)
    }
  }

  return {
    agents,
    policies,
    selectedPolicyId,
    setSelectedPolicyId,
    selectedAgentTypes,
    toggleAgent,
    difficulty,
    setDifficulty,
    seed,
    setSeed,
    randomizeSeed,
    legitimateCount,
    setLegitimateCount,
    attackCount,
    setAttackCount,
    loading,
    isLaunching,
    launchError,
    isGeneratingPlan,
    aiPlan,
    planError,
    generateAiPlan,
    launchSimulation,
  }
}
