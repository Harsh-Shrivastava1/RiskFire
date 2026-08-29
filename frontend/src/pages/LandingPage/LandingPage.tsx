import React, { useEffect } from 'react'
import { LandingHeader } from './components/LandingHeader'
import { HeroSection } from './components/HeroSection'
import { TrustPrinciplesSection } from './components/TrustPrinciplesSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { MetricsSection } from './components/MetricsSection'
import { PolicyComparisonSection } from './components/PolicyComparisonSection'
import { SimulationPipelineSection } from './components/SimulationPipelineSection'
import { SafetySection } from './components/SafetySection'
import { SecurityProofSection } from './components/SecurityProofSection'
import { FinalCtaSection } from './components/FinalCtaSection'
import { LandingFooter } from './components/LandingFooter'

export const LandingPage: React.FC = () => {
  useEffect(() => {
    // Update document title for public landing
    document.title = 'RiskFire | Payment Risk Intelligence & Synthetic Adversarial Testing'
  }, [])

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* 1. Header */}
      <LandingHeader />

      <main className="flex-1 w-full">
        {/* 2. Hero & Realistic Dashboard Preview */}
        <HeroSection />

        {/* 3. Trust / Product Principles */}
        <TrustPrinciplesSection />

        {/* 4. How It Works (4-step workflow) */}
        <HowItWorksSection />

        {/* 5. What RiskFire Measures (4 core metric cards) */}
        <MetricsSection />

        {/* 6. Policy Comparison (Same conditions. Fair comparison.) */}
        <PolicyComparisonSection />

        {/* 7. Simulation Pipeline (Watch the attack path) */}
        <SimulationPipelineSection />

        {/* 8. Safety & Sandbox Guarantee */}
        <SafetySection />

        {/* 9. Security Evidence (4 proof pillars) */}
        <SecurityProofSection />

        {/* 10. Final Call to Action */}
        <FinalCtaSection />
      </main>

      {/* 11. Minimal Enterprise Footer */}
      <LandingFooter />
    </div>
  )
}

export default LandingPage
