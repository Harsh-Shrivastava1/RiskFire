import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const FinalCtaSection: React.FC = () => {
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
    <section className="py-16 sm:py-24 bg-white border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-8 sm:p-12 text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            See what your payment policies miss.
          </h2>

          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Run RiskFire's deterministic security testing workflow, uncover hidden bypasses, and inspect the evidence behind every result.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="group relative inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer border border-blue-600 hover:border-blue-700 min-w-[190px]"
            >
              <span>Log In to Platform</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" />
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('how-it-works')}
              className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-300 hover:border-slate-400 shadow-2xs hover:shadow-xs transition-all duration-150 cursor-pointer min-w-[190px]"
            >
              <span>How RiskFire Works</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
