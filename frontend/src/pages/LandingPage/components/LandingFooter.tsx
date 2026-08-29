import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'

export const LandingFooter: React.FC = () => {
  const navigate = useNavigate()

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -72
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <footer className="bg-white border-t border-slate-200/80 py-12 text-slate-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 pb-8 border-b border-slate-100">
          {/* Brand Col */}
          <div className="space-y-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-white shrink-0 shadow-2xs">
                <Shield className="h-3.5 w-3.5 text-blue-400" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900">
                RiskFire
              </span>
              <span className="text-[10px] font-mono font-medium text-slate-400 pl-1.5 border-l border-slate-200">
                Payment Risk Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Payment risk intelligence through controlled adversarial testing and deterministic policy verification.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap gap-8 text-xs font-medium">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Platform
              </span>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Command Center
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/policies')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Policy Manager
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => navigate('/simulations')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Simulations & Fire Drills
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Product
              </span>
              <ul className="space-y-1.5">
                <li>
                  <button
                    onClick={() => scrollToSection('how-it-works')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('metrics')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Metrics
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('comparison')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Policy Comparison
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => scrollToSection('security')}
                    className="hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Security Proof
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Environment
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 max-w-[200px]">
                <div className="font-semibold text-slate-900">Synthetic Sandbox</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Isolated Seed Execution</div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Disclaimer & Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400">
          <p className="max-w-xl text-center sm:text-left leading-relaxed">
            RiskFire's security evaluations use synthetic data and simulated transactions. Results are intended for testing and analysis and do not represent real financial losses.
          </p>
          <div className="font-mono shrink-0">
            RiskFire • Synthetic Security Testing Environment
          </div>
        </div>
      </div>
    </footer>
  )
}
