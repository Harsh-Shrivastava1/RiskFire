import React from 'react'
import { ShieldCheck, Lock, Server, Sparkles } from 'lucide-react'

export const SafetySection: React.FC = () => {
  return (
    <section id="safety" className="py-12 sm:py-16 border-b border-slate-200/80 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-blue-200/90 bg-blue-50/50 p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700 border border-blue-200 shrink-0 shadow-2xs">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1.5 max-w-2xl">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 font-mono">
                  ZERO LIVE TRAFFIC RISK
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900">
                  Built for safe security testing
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  RiskFire operates inside a controlled synthetic testing environment. Transactions, entities, accounts, device fingerprints, and exposure calculations are simulated. No real customer credentials or live payment gateway networks are accessed.
                </p>
              </div>
            </div>

            {/* Quick Guarantees Chips */}
            <div className="flex flex-col gap-2 shrink-0 self-start md:self-auto border-t md:border-t-0 pt-4 md:pt-0 border-blue-200/60">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Lock className="h-3.5 w-3.5 text-blue-600" />
                <span>Zero customer data exposure</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <Server className="h-3.5 w-3.5 text-blue-600" />
                <span>Isolated sandbox compute</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                <span>No live gateway integration needed</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
