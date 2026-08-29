import React from 'react'
import { Sliders, Layers, FlaskConical, FileCheck2 } from 'lucide-react'

interface PrincipleItem {
  title: string
  description: string
  icon: React.ElementType
}

const principles: PrincipleItem[] = [
  {
    title: 'Deterministic',
    description: 'Same seed and workload produce reproducible results across test runs.',
    icon: Sliders,
  },
  {
    title: 'Policy-Scoped',
    description: 'Every metric and bypass is strictly tied to a specific policy and version.',
    icon: Layers,
  },
  {
    title: 'Synthetic',
    description: 'Testing happens inside a safe, controlled synthetic simulation environment.',
    icon: FlaskConical,
  },
  {
    title: 'Verifiable',
    description: 'Results are backed by scenario-level evidence, benchmarks, and audit logs.',
    icon: FileCheck2,
  },
]

export const TrustPrinciplesSection: React.FC = () => {
  return (
    <section className="py-8 sm:py-10 border-b border-slate-200/80 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {principles.map((p, idx) => {
            const Icon = p.icon
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-lg bg-white border border-slate-200/70 shadow-2xs"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-blue-600 border border-blue-100 shrink-0 mt-0.5">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono">
                    {p.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal">
                    {p.description}
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
