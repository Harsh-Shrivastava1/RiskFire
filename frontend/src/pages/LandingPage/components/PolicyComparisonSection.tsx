import React from 'react'
import { Scale, Check, ArrowRight, ShieldCheck, Database, Hash, Sparkles } from 'lucide-react'

export const PolicyComparisonSection: React.FC = () => {
  return (
    <section id="comparison" className="py-14 sm:py-20 border-b border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            HEAD-TO-HEAD BENCHMARKING
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Same conditions. Fair comparison.
          </h2>
          <p className="text-sm text-slate-600">
            Eliminate subjective debates over rule changes. Compare any two policy versions against the identical synthetic workload to verify true defensive lift.
          </p>
        </div>

        {/* Evaluation Ground Truth Meta Banner */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 font-mono uppercase text-[11px]">
              EVALUATION CONTROL CONDITIONS:
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap text-[11px] font-mono">
            <span className="text-slate-700 font-medium">Dataset: <strong className="text-slate-900">ds-synthetic-v1</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-medium">Seed: <strong className="text-slate-900">49201</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-medium">Volume: <strong className="text-slate-900">3,200 synthetic txns</strong></span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-700 font-medium">10 Canonical Scenarios</span>
          </div>
        </div>

        {/* Side-by-Side Comparison Container */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Policy A */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  BASELINE POLICY A
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Core Merchant Velocity & High-Value Guard
                </h3>
                <span className="text-[11px] font-mono text-slate-400">pol-vel-01 (v1.0.0)</span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                Baseline
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Attack Detection</span>
                <div className="text-xl font-bold font-mono text-slate-800 mt-1">88.4%</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">False Alarms</span>
                <div className="text-xl font-bold font-mono text-slate-800 mt-1">1.8%</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Successful Bypasses</span>
                <div className="text-xl font-bold font-mono text-slate-800 mt-1">42 txns</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70">
                <span className="text-[11px] text-slate-500 font-medium">Simulated Exposure</span>
                <div className="text-xl font-bold font-mono text-slate-800 mt-1">₹18,45,000</div>
              </div>
            </div>
          </div>

          {/* Policy B (Winner) */}
          <div className="rounded-xl border-2 border-emerald-500/80 bg-emerald-50/10 p-5 shadow-xs space-y-4 relative">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 font-mono">
                  CANDIDATE POLICY B
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-0.5">
                  Candidate Tightened Guard Policy
                </h3>
                <span className="text-[11px] font-mono text-slate-400">pol-tight-02 (v2.1.0)</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                <Check className="h-3 w-3 stroke-[3]" />
                Recommended
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-white border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Attack Detection</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">+5.7%</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-1">94.1%</div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">False Alarms</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">-0.1%</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">1.7%</div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Successful Bypasses</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">-30 txns</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">12 txns</div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-emerald-200/70 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-600 font-medium">Simulated Exposure</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-600">-77.2%</span>
                </div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-1">₹4,20,000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Deterministic Winner Statement */}
        <div className="mt-6 p-4 rounded-xl border border-slate-200 bg-slate-50/70 text-center space-y-1">
          <p className="text-xs font-semibold text-slate-800">
            Policy recommendation is determined strictly by deterministic evaluation math, not subjective opinion.
          </p>
          <p className="text-[11px] text-slate-500">
            Both policies are evaluated using the exact same dataset, random seed, transaction workload, and canonical adversarial scenarios.
          </p>
        </div>
      </div>
    </section>
  )
}
