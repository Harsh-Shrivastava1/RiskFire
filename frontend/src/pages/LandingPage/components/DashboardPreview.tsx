import React from 'react'
import {
  ShieldAlert,
  Layers,
  Database,
  Hash,
  TrendingUp,
} from 'lucide-react'

export const DashboardPreview: React.FC = () => {
  return (
    <div className="w-full rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs transition-all">
      {/* Top Header Bar / Policy Scoping */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100/80 shrink-0">
            <Layers className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                EVALUATION SCOPE
              </span>
              <span className="rounded bg-slate-100 text-slate-700 text-[10px] font-bold font-mono px-1.5 py-0.2 border border-slate-200/70">
                v1.0.0
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.2 border border-emerald-200/70">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                TESTED
              </span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-0.5 truncate">
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                Core Merchant Velocity & High-Value Guard
              </span>
              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                (pol-vel-01)
              </span>
            </div>
          </div>
        </div>

        {/* Dataset & Seed Meta */}
        <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200/70 text-[11px] font-mono text-slate-600 shrink-0">
          <div className="flex items-center gap-1 text-slate-500">
            <Database className="h-3 w-3 text-slate-400" />
            <span className="text-slate-400">Dataset:</span>
            <span className="font-semibold text-slate-800">ds-synthetic-v1</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-slate-500">
            <Hash className="h-3 w-3 text-slate-400" />
            <span className="text-slate-400">Seed:</span>
            <span className="font-semibold text-slate-800">49201</span>
          </div>
        </div>
      </div>

      {/* Main Posture Score Box */}
      <div className="mt-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 p-3.5 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-800 shrink-0 border border-amber-200 shadow-2xs mt-0.5">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 font-mono">
                  CURRENT RISK POSTURE
                </span>
                <span className="rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.2 border border-amber-200">
                  Elevated Risk
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 font-mono">
                  67
                </span>
                <span className="text-xs font-semibold text-slate-400 font-mono">/ 100</span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5 max-w-md leading-relaxed">
                Weaknesses found allowing simulated attacks to bypass controls, exposing <span className="font-mono font-semibold text-slate-800">₹7,84,504</span> potential simulated exposure.
              </p>
            </div>
          </div>

          <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-amber-200/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Evaluation Run</span>
            <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
              3,200 txns
            </span>
          </div>
        </div>
      </div>

      {/* 4 Core Metric Cards (2x2 Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3.5">
        {/* Metric 1 */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">
              Attack detection rate
            </span>
            <span className="inline-flex items-center gap-0.5 rounded bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold px-1.5 py-0.2 border border-emerald-200/60">
              <TrendingUp className="h-2.5 w-2.5" />
              Held-Out
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-emerald-600 mt-1">
            94.2%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Recall on test split</span>
            <span className="font-mono text-slate-400">Coverage: 100%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">
              Attacks that got through
            </span>
            <span className="inline-flex items-center gap-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-mono font-bold px-1.5 py-0.2 border border-amber-200/60">
              Bypasses
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-amber-600 mt-1">
            195 <span className="text-xs font-normal text-slate-500 font-sans">txns</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Across 10 attack classes</span>
            <span className="font-mono text-slate-400">5.8% bypass</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">
              False alarms
            </span>
            <span className="inline-flex items-center gap-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono font-bold px-1.5 py-0.2 border border-slate-200/60">
              FPR
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            1.8%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Legitimate friction</span>
            <span className="font-mono text-slate-400">22 / 1,200 benign</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-lg border border-slate-200/80 bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-600">
              Potential loss exposed
            </span>
            <span className="inline-flex items-center gap-0.5 rounded bg-rose-50 text-rose-700 text-[10px] font-mono font-bold px-1.5 py-0.2 border border-rose-200/60">
              Exposure
            </span>
          </div>
          <div className="text-xl font-bold font-mono text-rose-600 mt-1">
            ₹7,84,504
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center justify-between">
            <span>Simulated gross value</span>
            <span className="font-mono text-slate-400">Unprevented</span>
          </div>
        </div>
      </div>
    </div>
  )
}
