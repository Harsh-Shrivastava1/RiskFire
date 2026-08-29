import React from 'react'
import { ShieldAlert, ShieldCheck, AlertTriangle, Info, TrendingUp, AlertCircle } from 'lucide-react'

export const MetricsSection: React.FC = () => {
  return (
    <section id="metrics" className="py-14 sm:py-20 border-b border-slate-200/80 bg-slate-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            EVALUATION METRICS
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            See the risk behind the policy
          </h2>
          <p className="text-sm text-slate-600">
            RiskFire translates raw simulation outputs into clear, empirical metrics that security and risk leaders can act on immediately.
          </p>
        </div>

        {/* 4 Primary Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1 */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  METRIC 01
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  Held-out Recall
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Attack Detection Rate
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                How much of the tested adversarial activity the policy successfully detected and prevented.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-emerald-600">
                94.2%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Benchmark: &gt;90%</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  METRIC 02
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/60">
                  Successful Bypasses
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Attacks That Got Through
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Simulated attack transactions that evaded the evaluated policy rules without triggering controls.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-amber-600">
                195 <span className="text-xs font-normal text-slate-500 font-sans">txns</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">5.8% bypass rate</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  METRIC 03
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200/60">
                  Customer Friction
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                False Alarms
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Legitimate, benign transactions incorrectly blocked or flagged, causing customer checkout friction.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-slate-800">
                1.8%
              </span>
              <span className="text-[11px] text-slate-400 font-mono">FPR Target: &lt;2.0%</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  METRIC 04
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200/60">
                  Simulated Exposure
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Potential Loss Exposed
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Simulated financial volume associated with successful adversarial bypasses in test workloads.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono text-rose-600">
                ₹7,84,504
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Gross value at risk</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Note */}
        <div className="mt-8 flex items-start gap-2.5 p-3.5 rounded-lg bg-blue-50/50 border border-blue-100 text-slate-600 text-xs leading-relaxed max-w-3xl mx-auto">
          <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-800 font-semibold">Synthetic Evaluation Scope:</strong> All metric values and exposure sums are computed strictly within synthetic simulation workloads to measure relative policy effectiveness. They are not historical claims or predictions of live payment losses.
          </p>
        </div>
      </div>
    </section>
  )
}
