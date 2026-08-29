import React from 'react'
import { Flame, ArrowRight, ShieldCheck, AlertTriangle, FileCode, CheckCircle2 } from 'lucide-react'

export const SimulationPipelineSection: React.FC = () => {
  return (
    <section id="simulation" className="py-14 sm:py-20 border-b border-slate-200/80 bg-slate-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 font-mono">
            FIRE DRILL SIMULATION
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Watch the attack path
          </h2>
          <p className="text-sm text-slate-600">
            Trace every synthetic transaction through the deterministic simulation pipeline from adversarial generation to policy enforcement.
          </p>
        </div>

        {/* Pipeline Flow Container */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative items-stretch">
          {/* Stage 1 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">01 STAGE</span>
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono mb-1">
                Attack Scenario
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Selected threat pattern is generated from deterministic seed.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
              <div className="font-semibold text-blue-700">SCN-04</div>
              <div className="text-[10px] text-slate-500 truncate">Syndicate Ring</div>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">02 STAGE</span>
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono mb-1">
                Synthetic Payload
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Transaction emitted with fingerprint, velocity, and entity IDs.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
              <div className="font-semibold text-slate-900">₹38,500.00</div>
              <div className="text-[10px] text-slate-500">ACC-1842 • DEV-029</div>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">03 STAGE</span>
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono mb-1">
                Policy Engine
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Rules evaluate velocity windows, risk scores, and thresholds.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
              <div className="font-semibold text-slate-900">RULE-VEL-03</div>
              <div className="text-[10px] text-slate-500">Window &gt; 5 txns/min</div>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">04 STAGE</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono mb-1">
                Enforcement
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Deterministic decision rendered with rule match telemetry.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-mono text-emerald-800">
              <div className="font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                BLOCKED
              </div>
              <div className="text-[10px] text-emerald-700">Latency: 1.4ms</div>
            </div>
          </div>

          {/* Stage 5 */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">05 STAGE</span>
                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              </div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 font-mono mb-1">
                Evidence Log
              </h3>
              <p className="text-xs text-slate-600 mb-3">
                Full trace recorded for audit, vulnerability scoring, and diffing.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700">
              <div className="font-semibold text-slate-900">AUD-9201-44</div>
              <div className="text-[10px] text-slate-500">Trace Verified</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
