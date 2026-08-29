import React from 'react'
import { GitBranch, Sliders, Search, History } from 'lucide-react'

interface ProofPillar {
  title: string
  subtitle: string
  description: string
  icon: React.ElementType
}

const pillars: ProofPillar[] = [
  {
    title: 'Policy Lineage',
    subtitle: 'POL-SCOPED AUDITING',
    description: 'Know exactly which policy ruleset, version tag, and commit hash produced every test result.',
    icon: GitBranch,
  },
  {
    title: 'Deterministic Evaluation',
    subtitle: 'REPRODUCIBLE SEEDING',
    description: 'Use fixed seeds and structured synthetic datasets for perfectly reproducible security testing.',
    icon: Sliders,
  },
  {
    title: 'Scenario-Level Evidence',
    subtitle: 'TRANSACTION-LEVEL TRACES',
    description: 'Inspect individual attack scenarios, payload parameters, rule matches, and bypass signatures.',
    icon: Search,
  },
  {
    title: 'Audit History',
    subtitle: 'IMMUTABLE TIMELINE',
    description: 'Track all simulation runs, policy comparisons, and defensive patch actions across your workspace.',
    icon: History,
  },
]

export const SecurityProofSection: React.FC = () => {
  return (
    <section id="security" className="py-14 sm:py-20 border-b border-slate-200/80 bg-slate-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            SECURITY PROOF
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Built for evidence, not guesswork
          </h2>
          <p className="text-sm text-slate-600">
            Every simulation result, vulnerability score, and comparative benchmark is verifiable with deep evidentiary traces.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 mb-3.5">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                    {pillar.subtitle}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 mt-1 mb-1.5">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
