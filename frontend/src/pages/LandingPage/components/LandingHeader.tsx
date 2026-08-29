import React, { useState, useEffect } from 'react'
import { Shield, Menu, X } from 'lucide-react'
import { cn } from '@/utils/cn'

export const LandingHeader: React.FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      const yOffset = -72 // Offset for sticky header height
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full transition-all duration-200',
        'bg-white/95 backdrop-blur-md border-b',
        scrolled ? 'border-slate-200 shadow-2xs py-3' : 'border-slate-200/80 py-4'
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="flex items-center gap-2.5 group cursor-pointer"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs group-hover:bg-slate-800 transition-colors shrink-0">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900">
                RiskFire
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium text-slate-500 pl-2 border-l border-slate-200 tracking-normal">
                Payment Risk Intelligence
              </span>
            </div>
          </a>
        </div>

        {/* Right Nav Items (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-600">
          <button
            onClick={() => scrollToSection('how-it-works')}
            className="hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            How It Works
          </button>
          <button
            onClick={() => scrollToSection('metrics')}
            className="hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            Metrics
          </button>
          <button
            onClick={() => scrollToSection('comparison')}
            className="hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            Comparison
          </button>
          <button
            onClick={() => scrollToSection('simulation')}
            className="hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            Attack Path
          </button>
          <button
            onClick={() => scrollToSection('security')}
            className="hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            Security
          </button>
        </nav>

        {/* Mobile Hamburger Toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 shadow-lg">
          <nav className="flex flex-col space-y-1.5 text-sm font-medium text-slate-700">
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="text-left py-2 px-2.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('metrics')}
              className="text-left py-2 px-2.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Metrics
            </button>
            <button
              onClick={() => scrollToSection('comparison')}
              className="text-left py-2 px-2.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Policy Comparison
            </button>
            <button
              onClick={() => scrollToSection('simulation')}
              className="text-left py-2 px-2.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Attack Path
            </button>
            <button
              onClick={() => scrollToSection('security')}
              className="text-left py-2 px-2.5 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              Security Evidence
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
