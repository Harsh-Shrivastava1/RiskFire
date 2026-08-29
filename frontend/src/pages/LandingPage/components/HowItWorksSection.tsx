import React from 'react'
import { ShieldCheck, Play, BarChart3, Scale } from 'lucide-react'

interface StepItem {
  number: string
  title: string
  description: string
  detail: string
  icon: React.ElementType
}

const steps: StepItem[] = [
  {
    number: '01',
    title: 'Choose a policy',
    description: 'Select the payment security policy and version you want to evaluate.',
    detail: 'Scope evaluation to specific rule sets, threshold configurations, or candidate patches.',
    icon: ShieldCheck,
  },
  {
    number: '02',
    title: 'Run adversarial testing',
    description: 'RiskFire executes controlled synthetic attack scenarios against the policy.',
    detail: 'Generates deterministic transaction streams matching canonical fraud topologies.',
    icon: Play,
  },
  {
    number: '03',
    title: 'Measure what got through',
    description: 'Review detection, bypasses, false alarms, exposure, and discovered weaknesses.',
    detail: 'Inspect transaction-by-transaction traces and calculated potential simulated exposure.',
    icon: BarChart3,
  },
  {
    number: '04',
    title: 'Compare and improve',
    description: 'Compare policies under the same workload to verify defensive improvements.',
    detail: 'Prove whether tightened rules actually reduce risk without increasing merchant friction.',
    icon: Scale,
  },
]

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-14 sm:py-20 border-b border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            METHODOLOGY
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            From policy to verified risk
          </h2>
          <p className="text-sm text-slate-600">
            A continuous, deterministic 4-step workflow to stress-test payment security controls before adversaries find the gaps.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div
                key={idx}
                className="relative rounded-xl border border-slate-200/80 bg-slate-50/40 p-5 hover:border-slate-300 hover:bg-white transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xl font-bold font-mono text-slate-300">
                      {step.number}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">
                    {step.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200/60 text-[11px] text-slate-500">
                  {step.detail}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
