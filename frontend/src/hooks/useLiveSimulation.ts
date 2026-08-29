import { useState, useEffect, useRef } from 'react'
import { simulationRepository } from '@/services/repositories'
import { SimulationEvent } from '@/types'

export type SimulationPhase =
  | 'INITIALIZATION'
  | 'ENTITY_POOL'
  | 'ATTACK_EXECUTION'
  | 'RISK_EVALUATION'
  | 'VULNERABILITY_ANALYSIS'
  | 'EXPOSURE_CALCULATION'
  | 'COMPLETED'

export interface ScenarioInfo {
  id: string
  name: string
  activity: string
}

export interface PipelineTxn {
  id: string
  accountId: string
  deviceId: string
  amount: number
  decision: 'BLOCKED' | 'FLAGGED' | 'BYPASSED' | 'EVALUATING'
  ruleTriggered: string
}

const canonicalScenarios: ScenarioInfo[] = [
  { id: 'SCN-01', name: 'Rapid Card Testing Burst', activity: 'Testing low-value card authorization frequency thresholds' },
  { id: 'SCN-02', name: 'High-Value Midnight Drain', activity: 'Testing off-hours transaction ceiling constraints' },
  { id: 'SCN-03', name: 'Distributed Device Rotation', activity: 'Testing rate-limits across spoofed user-agent pools' },
  { id: 'SCN-04', name: 'Coordinated Syndicate Ring', activity: 'Testing multi-account identity fragmentation behaviors' },
  { id: 'SCN-05', name: 'Promo Voucher Replay Loop', activity: 'Testing promo coupon redemption velocity bounds' },
]

export const useLiveSimulation = (simulationId?: string) => {
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [events, setEvents] = useState<SimulationEvent[]>([])
  const [currentPhase, setCurrentPhase] = useState<SimulationPhase>('COMPLETED')
  const [processedCount, setProcessedCount] = useState(3200)
  const [totalCount, setTotalCount] = useState(3200)
  const [bypassesCount, setBypassesCount] = useState(0)
  const [simulatedExposure, setSimulatedExposure] = useState(0)
  const [activePolicyName, setActivePolicyName] = useState('Core Merchant Velocity & High-Value Guard')
  const [activeSeed, setActiveSeed] = useState(49201)
  const [activeScenario, setActiveScenario] = useState<ScenarioInfo>(canonicalScenarios[0])
  const [currentPipelineTxn, setCurrentPipelineTxn] = useState<PipelineTxn>({
    id: 'TXN-8492',
    accountId: 'ACC-1842',
    deviceId: 'DEV-029',
    amount: 38500,
    decision: 'BYPASSED',
    ruleTriggered: 'POL-VELOCITY-001',
  })

  const timerRef = useRef<any>(null)

  useEffect(() => {
    const targetId = simulationId || 'sim-142'
    let isCancelled = false

    // Fetch real simulation run and real events
    Promise.all([
      simulationRepository.getSimulationById(targetId),
      simulationRepository.getSimulationEvents(targetId),
    ])
      .then(([sim, evts]) => {
        if (isCancelled) return
        if (sim) {
          setActivePolicyName(sim.policyName || 'Core Merchant Velocity & High-Value Guard')
          setActiveSeed(sim.seed || 49201)
          const targetTotal = sim.totalTransactions || 3200
          const finalBypasses = sim.bypassesFound || 0
          const finalExposure = sim.simulatedExposure || 0
          setTotalCount(targetTotal)

          if (sim.status === 'RUNNING' || window.location.search.includes('live=true')) {
            // Live mode: start interactive step-through
            setIsRunning(true)
            setCurrentPhase('INITIALIZATION')
            setProcessedCount(0)
            setBypassesCount(0)
            setSimulatedExposure(0)

            let step = 0
            const totalSteps = 40
            const stepInterval = 250 // ms

            timerRef.current = setInterval(() => {
              step++
              const progressRatio = Math.min(step / totalSteps, 1)
              const currentTxns = Math.floor(progressRatio * targetTotal)
              setProcessedCount(currentTxns)
              setBypassesCount(Math.floor(progressRatio * finalBypasses))
              setSimulatedExposure(Math.floor(progressRatio * finalExposure))

              // Update Phase
              if (progressRatio < 0.15) {
                setCurrentPhase('INITIALIZATION')
              } else if (progressRatio < 0.3) {
                setCurrentPhase('ENTITY_POOL')
              } else if (progressRatio < 0.6) {
                setCurrentPhase('ATTACK_EXECUTION')
              } else if (progressRatio < 0.8) {
                setCurrentPhase('RISK_EVALUATION')
              } else if (progressRatio < 0.92) {
                setCurrentPhase('VULNERABILITY_ANALYSIS')
              } else if (progressRatio < 1) {
                setCurrentPhase('EXPOSURE_CALCULATION')
              } else {
                setCurrentPhase('COMPLETED')
                setIsRunning(false)
                setProcessedCount(targetTotal)
                setBypassesCount(finalBypasses)
                setSimulatedExposure(finalExposure)
                if (timerRef.current) clearInterval(timerRef.current)
              }

              // Rotate Scenario & Pipeline Activity
              const scnIdx = Math.floor((progressRatio * canonicalScenarios.length) % canonicalScenarios.length)
              setActiveScenario(canonicalScenarios[scnIdx])

              const isBypass = step % 4 === 0
              setCurrentPipelineTxn({
                id: `TXN-${1000 + step * 47}`,
                accountId: `ACC-${2000 + (step % 8) * 111}`,
                deviceId: `DEV-${String((step % 12) + 1).padStart(3, '0')}`,
                amount: 1500 + (step * 850) % 65000,
                decision: isBypass ? 'BYPASSED' : step % 2 === 0 ? 'BLOCKED' : 'FLAGGED',
                ruleTriggered: isBypass ? 'POLICY_LIMIT_EVADED' : 'RULE_VELOCITY_CEILING',
              })
            }, stepInterval)
          } else {
            // Already completed
            setProcessedCount(targetTotal)
            setBypassesCount(finalBypasses)
            setSimulatedExposure(finalExposure)
            setCurrentPhase('COMPLETED')
            setIsRunning(false)
          }
        }

        if (evts && evts.length > 0) {
          setEvents(evts)
        }
      })
      .catch((err) => {
        console.error('Failed to load live simulation data:', err)
      })

    return () => {
      isCancelled = true
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [simulationId])

  const togglePause = () => setIsPaused(!isPaused)
  const stopSimulation = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRunning(false)
    setCurrentPhase('COMPLETED')
    setProcessedCount(totalCount)
  }

  const progressPercent = totalCount > 0 ? Math.min(100, Math.round((processedCount / totalCount) * 100)) : 100

  return {
    isRunning,
    isPaused,
    currentPhase,
    processedCount,
    totalCount,
    progressPercent,
    bypassesCount,
    simulatedExposure,
    activePolicyName,
    activeSeed,
    activeScenario,
    currentPipelineTxn,
    events,
    togglePause,
    stopSimulation,
  }
}
