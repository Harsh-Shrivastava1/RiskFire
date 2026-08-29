import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Flame, ShieldCheck, Cpu, ArrowRight, Layers, CheckCircle2, AlertCircle } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { policyRepository, simulationRepository } from '@/services/repositories'
import { RiskPolicy } from '@/types'
import { FireDrillExecutionAnimation } from '@/components/simulations/FireDrillExecutionAnimation'

export const FireDrillModal: React.FC = () => {
  const { fireDrillModalOpen, setFireDrillModalOpen } = useUiStore()
  const [policies, setPolicies] = useState<RiskPolicy[]>([])
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('')
  const [difficulty, setDifficulty] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('HIGH')
  const [isLaunching, setIsLaunching] = useState(false)
  const [launchError, setLaunchError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (fireDrillModalOpen && !isLaunching) {
      setLaunchError(null)
      policyRepository.getPolicies().then((list) => {
        setPolicies(list)
        if (list.length > 0 && !selectedPolicyId) {
          const active = list.find((p) => p.isActive) || list[0]
          setSelectedPolicyId(active.id)
        }
      }).catch((err) => {
        console.error('Failed to load policies for fire drill:', err)
      })
    }
  }, [fireDrillModalOpen, isLaunching])

  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0]
  const { addAlert } = useNotificationStore()

  const handleLaunch = async () => {
    if (isLaunching) return
    setIsLaunching(true)
    setLaunchError(null)

    const startedAt = Date.now()
    const minAnimationTime = 3000

    try {
      const run = await simulationRepository.triggerFireDrill(selectedPolicy?.id || 'pol-vel-01')

      // Maintain professional 3s animation duration if API returns quickly
      const elapsed = Date.now() - startedAt
      if (elapsed < minAnimationTime) {
        await new Promise((resolve) => setTimeout(resolve, minAnimationTime - elapsed))
      }

      addAlert({
        title: 'Red-Team Fire Drill Launched',
        description: `Adversarial stress test triggered against ${selectedPolicy?.name || 'Active Policy'}.`,
        timestamp: 'Just now',
        type: 'simulation',
        source: `Simulation #${run.id || 'LIVE'}`,
        route: `/simulations/live?id=${run.id}`,
      })

      setIsLaunching(false)
      setFireDrillModalOpen(false)
      navigate(`/simulations/live?id=${run.id}`)
    } catch (err: any) {
      console.error('Fire drill launch error:', err)
      setIsLaunching(false)
      setLaunchError(err?.message || err?.detail || 'Failed to trigger fire drill')
    }
  }

  return (
    <>
      <Dialog
        open={fireDrillModalOpen && !isLaunching}
        onOpenChange={(open) => {
          if (!isLaunching) {
            setFireDrillModalOpen(open)
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-orange-100 text-orange-700">
                <Flame className="h-5 w-5 fill-orange-500/20" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900">
                  Launch Automated Red-Team Fire Drill
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Full-loop adversarial simulation, vulnerability discovery, patch synthesis & held-out benchmarking.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {launchError && (
            <div className="rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{launchError}</span>
            </div>
          )}

          <div className="space-y-4 py-2 text-xs">
            {/* Target Policy */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Target Risk Policy</label>
              {policies.length > 1 ? (
                <Select value={selectedPolicyId} onValueChange={setSelectedPolicyId}>
                  <SelectTrigger className="h-9 text-xs bg-white">
                    <SelectValue placeholder="Select Policy" />
                  </SelectTrigger>
                  <SelectContent>
                    {policies.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.currentVersionNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-blue-600" />
                      <span className="font-semibold text-slate-800">
                        {selectedPolicy?.name || 'Account Velocity Baseline'}
                      </span>
                    </div>
                    <span className="font-mono text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      {selectedPolicy?.currentVersionNumber || 'v1.0'} ACTIVE
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {selectedPolicy?.description || 'Rule: 3 transactions per account / 10 minutes (Amount threshold: ₹50,000).'}
                  </p>
                </div>
              )}
            </div>

            {/* Adversarial Complexity */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-700">Adversarial Agent Complexity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['LOW', 'MEDIUM', 'HIGH'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`flex flex-col items-center justify-center rounded-md border p-2 text-center transition-all ${
                      difficulty === level
                        ? 'border-blue-600 bg-blue-50/60 font-semibold text-blue-800 ring-1 ring-blue-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs">{level}</span>
                    <span className="text-[10px] text-slate-400">
                      {level === 'HIGH' ? 'Multi-vector collusion' : level === 'MEDIUM' ? 'Paced fragmentation' : 'Single bypass'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Automated Pipeline Steps Preview */}
            <div className="rounded-md border border-slate-200 bg-slate-50/50 p-3 space-y-2">
              <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5" /> Pipeline Execution Sequence
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>1. Generate 3,200 synthetic txns</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>2. AI plans distributed attack</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>3. Deterministic policy eval</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>4. Calculate synthetic exposure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>5. AI proposes defensive patch</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  <span>6. Replay & Held-Out Benchmark</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setFireDrillModalOpen(false)}
              disabled={isLaunching}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleLaunch}
              disabled={isLaunching}
              className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
            >
              <Flame className="h-4 w-4" />
              <span>{isLaunching ? 'Starting Engine...' : 'Execute Fire Drill Run'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple, compact professional execution transition overlay */}
      <FireDrillExecutionAnimation
        isOpen={isLaunching}
        policyName={selectedPolicy?.name || 'Core Merchant Velocity & High-Value Guard'}
        policyVersion={selectedPolicy?.currentVersionNumber || 'v1.0.0'}
        seed={49201}
      />
    </>
  )
}


