import React, { useState, useEffect } from 'react'
import { Flame, Check, Sparkles } from 'lucide-react'

export interface FireDrillExecutionAnimationProps {
  isOpen: boolean
  policyName: string
  policyVersion?: string
  seed?: number
}

interface StepInfo {
  label: string
  title: string
  counter: string
  progress: number
}

const STEPS: StepInfo[] = [
  {
    label: 'Attack Scenarios',
    title: 'Initializing synthetic sandbox & attack vectors',
    counter: '0 / 3,200 prepared',
    progress: 15,
  },
  {
    label: 'Synthetic Txns',
    title: 'Generating synthetic transactions',
    counter: '1,248 / 3,200 synthesized',
    progress: 42,
  },
  {
    label: 'Policy Evaluation',
    title: 'Evaluating policy decisions against rules',
    counter: '2,104 / 3,200 evaluated',
    progress: 74,
  },
  {
    label: 'Risk Decisions',
    title: 'Analyzing bypasses & calculating exposure',
    counter: '3,200 / 3,200 finalized',
    progress: 95,
  },
]

export const FireDrillExecutionAnimation: React.FC<FireDrillExecutionAnimationProps> = ({
  isOpen,
  policyName,
  policyVersion = 'v1.0.0',
  seed = 49201,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0)
  const [elapsedMs, setElapsedMs] = useState<number>(0)

  useEffect(() => {
    if (!isOpen) {
      setCurrentStepIdx(0)
      setElapsedMs(0)
      return
    }

    const interval = setInterval(() => {
      setElapsedMs((prev) => prev + 100)
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    // Simple 4-step progression:
    // 0 - 800ms: Attack Scenarios
    // 800 - 1800ms: Synthetic Txns
    // 1800 - 2800ms: Policy Evaluation
    // 2800ms+: Risk Decisions & Finalizing
    if (elapsedMs < 800) {
      setCurrentStepIdx(0)
    } else if (elapsedMs < 1800) {
      setCurrentStepIdx(1)
    } else if (elapsedMs < 2800) {
      setCurrentStepIdx(2)
    } else {
      setCurrentStepIdx(3)
    }
  }, [isOpen, elapsedMs])

  if (!isOpen) return null

  const currentStep = STEPS[currentStepIdx] || STEPS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xl text-slate-900 font-sans space-y-5 my-auto">
        {/* Header with Fire Icon */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-orange-600 shadow-2xs">
            <Flame className="h-6 w-6 fill-orange-500/20 animate-pulse" />
          </div>

          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center justify-center gap-1.5">
              <span>Running Fire Drill</span>
              <span className="inline-flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
            </h2>
            <p className="text-xs text-slate-500 max-w-sm">
              Testing policy against synthetic adversarial transactions
            </p>
          </div>

          {/* Scope metadata */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1 font-mono text-[11px]">
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-slate-700">
              <span className="text-slate-400 font-sans font-medium text-[10px] mr-1">POLICY:</span>
              <span className="font-semibold text-slate-800">{policyName}</span>{' '}
              <span className="text-slate-400">({policyVersion})</span>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-700">
              <span className="text-slate-400 font-sans font-medium text-[10px] mr-1">SEED:</span>
              <span className="font-bold text-slate-800">#{seed}</span>
            </div>
          </div>
        </div>

        {/* Simple 4-Step Pipeline */}
        <div className="py-2">
          <div className="relative flex items-center justify-between">
            {/* Connecting Track Line */}
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 z-0" />
            <div
              className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 z-0"
              style={{
                width: `${(currentStepIdx / (STEPS.length - 1)) * 88}%`,
              }}
            />

            {/* 4 Nodes */}
            {STEPS.map((step, idx) => {
              const isPast = idx < currentStepIdx
              const isCurrent = idx === currentStepIdx

              return (
                <div key={step.label} className="relative z-10 flex flex-col items-center space-y-1.5">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${
                      isPast
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-blue-600 text-white ring-4 ring-blue-100 shadow-2xs animate-pulse'
                        : 'bg-white border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPast ? (
                      <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-semibold text-center whitespace-nowrap ${
                      isCurrent
                        ? 'text-blue-700'
                        : isPast
                        ? 'text-emerald-700'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/60">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${currentStep.progress}%` }}
            />
          </div>

          {/* Current execution description & counter */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <span className="font-medium text-slate-700 truncate pr-2">
              {currentStep.title}
            </span>
            <span className="font-mono font-bold text-slate-900 shrink-0">
              {currentStep.counter}
            </span>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-blue-500" />
            <span>Deterministic simulation in progress</span>
          </span>
          <span className="font-mono font-semibold text-slate-500">
            SYNTHETIC SANDBOX
          </span>
        </div>
      </div>
    </div>
  )
}
