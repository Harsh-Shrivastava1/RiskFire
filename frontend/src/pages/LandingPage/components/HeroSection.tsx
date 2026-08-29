import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldAlert, Sparkles, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const HeroSection: React.FC = () => {
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
    <section className="min-h-[calc(100vh-65px)] flex flex-col justify-center items-center text-center py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-200/80 bg-white relative">
      <div className="max-w-4xl mx-auto w-full space-y-7 sm:space-y-8">
        {/* Status Label */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/90 bg-blue-50/80 px-4 py-1.5 text-xs font-mono font-semibold text-blue-700 shadow-2xs">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span>SYNTHETIC PAYMENT SECURITY TESTING</span>
          </div>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.12]">
          Find the payment risks your policies miss.
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto font-normal">
          RiskFire tests payment security policies against controlled synthetic adversarial activity, identifies weaknesses, measures exposure, and helps teams verify defensive improvements.
        </p>

        {/* Action CTAs */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group relative inline-flex items-center justify-center gap-2 h-12 px-7 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all duration-150 cursor-pointer border border-blue-600 hover:border-blue-700 min-w-[170px]"
          >
            <span>Log In</span>
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

        {/* Trust Statement */}
        <div className="pt-3 text-xs sm:text-sm text-slate-400 font-medium flex items-center justify-center gap-2.5 flex-wrap">
          <span>Deterministic testing</span>
          <span>•</span>
          <span>Reproducible results</span>
          <span>•</span>
          <span>No live payment traffic</span>
        </div>
      </div>
    </section>
  )
}
