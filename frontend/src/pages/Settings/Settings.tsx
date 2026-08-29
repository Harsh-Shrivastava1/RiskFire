import React, { useState } from 'react'
import { useSettings } from '@/hooks/useSettings'
import { PageHeader } from '@/components/layout/PageHeader'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import {
  User,
  ShieldCheck,
  Cpu,
  Lock,
  Save,
  CheckCircle2,
  Building,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react'

export const Settings: React.FC = () => {
  const { settings, updateSetting, saveSettings, isSaved } = useSettings()
  const [showAiDetails, setShowAiDetails] = useState(false)

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Settings"
        description="Configure merchant environment profiles, default simulation parameters, and sandbox security boundaries."
        badge={
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-700">
            MERCHANT ID: {settings.merchantId}
          </span>
        }
        actions={
          <Button
            size="sm"
            onClick={saveSettings}
            className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
          >
            <Save className="h-3.5 w-3.5" />
            <span>{isSaved ? 'Settings Saved!' : 'Save Changes'}</span>
          </Button>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {isSaved && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-3.5 text-xs text-emerald-900 flex items-center justify-between shadow-2xs transition-all">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span className="font-medium">
                Profile and platform settings successfully updated.
              </span>
            </div>
            <span className="text-[11px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              SAVED
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          {/* Section 1: Profile */}
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <User className="h-4 w-4 text-blue-600" />
                <span>1. Operator Profile</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Personalize your operator identity and review access role privileges.
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Display Name</label>
                  <Input
                    type="text"
                    value={settings.userName}
                    onChange={(e) => updateSetting('userName', e.target.value)}
                    placeholder="Enter your name..."
                    className="h-9 text-xs font-medium"
                  />
                  <span className="text-[10px] text-slate-400">
                    Visible across the executive audit trail and top navigation.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Account Role</label>
                  <div className="h-9 rounded-md border border-slate-200 bg-slate-50 px-3 flex items-center justify-between text-slate-700">
                    <span className="font-medium">{settings.userRole}</span>
                    <span className="rounded bg-blue-100 text-blue-800 text-[10px] font-mono font-bold px-1.5 py-0.5">
                      Full Write
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Authorized to simulate, approve patches, and deploy policies.
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Work Email</label>
                <Input
                  type="email"
                  value={settings.userEmail}
                  disabled
                  className="h-9 text-xs bg-slate-50 text-slate-500 font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  size="sm"
                  onClick={saveSettings}
                  className="h-8 text-xs bg-slate-900 hover:bg-slate-800 text-white font-semibold gap-1.5"
                >
                  <Save className="h-3 w-3" />
                  <span>Update Profile</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Merchant Environment */}
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building className="h-4 w-4 text-slate-700" />
                <span>2. Merchant Environment</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Organization details for this synthetic payment risk environment.
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Merchant Legal Entity</label>
                  <Input
                    type="text"
                    value={settings.merchantName}
                    onChange={(e) => updateSetting('merchantName', e.target.value)}
                    className="h-9 text-xs font-medium"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Merchant Identifier</label>
                  <Input
                    type="text"
                    value={settings.merchantId}
                    disabled
                    className="h-9 text-xs font-mono bg-slate-50 text-slate-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    Used to identify this synthetic merchant environment.
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700">Industry / Merchant Category</label>
                <Input
                  type="text"
                  value={settings.merchantCategory}
                  onChange={(e) => updateSetting('merchantCategory', e.target.value)}
                  className="h-9 text-xs font-medium"
                />
                <span className="text-[10px] text-slate-400">
                  Calibrates default synthetic entity distribution and transaction velocities.
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Deterministic Simulation Defaults */}
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-slate-700" />
                <span>3. Simulation Defaults</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Default parameters used when triggering automated red-team simulations and fire drills.
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Deterministic Seed</label>
                  <Input
                    type="number"
                    value={settings.defaultSimulationSeed}
                    onChange={(e) => updateSetting('defaultSimulationSeed', parseInt(e.target.value) || 1)}
                    className="h-9 text-xs font-mono font-bold text-blue-700"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight block">
                    Used to reproduce the exact same test.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Synthetic Transactions</label>
                  <Input
                    type="number"
                    value={settings.defaultSyntheticTransactions}
                    onChange={(e) => updateSetting('defaultSyntheticTransactions', parseInt(e.target.value) || 100)}
                    className="h-9 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight block">
                    Number of transactions generated during a test.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700">Velocity Lookback Window (Min)</label>
                  <Input
                    type="number"
                    value={settings.defaultLookbackMinutes}
                    onChange={(e) => updateSetting('defaultLookbackMinutes', parseInt(e.target.value) || 1)}
                    className="h-9 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 leading-tight block">
                    Time window used by velocity rules.
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4: AI Reasoning */}
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-purple-600" />
                  <span>4. AI Reasoning</span>
                </CardTitle>
                <span className="rounded bg-purple-100 text-purple-800 font-mono text-[10px] font-bold px-2 py-0.5 border border-purple-200">
                  CONNECTED
                </span>
              </div>
              <p className="text-xs text-slate-500">
                LLM reasoning provider for attack planning, vulnerability explanations, and patch formulation.
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">AI Provider</span>
                  <div className="font-mono font-bold text-slate-800">Groq API</div>
                  <span className="text-[10px] text-slate-500">Provider Abstraction Layer</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Model</span>
                  <div className="font-mono font-bold text-purple-700">openai/gpt-oss-120b</div>
                  <span className="text-[10px] text-slate-500">High-capacity reasoning model</span>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Structured Output</span>
                  <div className="font-mono font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Validated</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Strict Pydantic Schema</span>
                </div>
              </div>

              {/* Collapsible Advanced Details */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiDetails(!showAiDetails)}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <span>{showAiDetails ? 'Hide technical provider details' : 'Show advanced provider details'}</span>
                  {showAiDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>

                {showAiDetails && (
                  <div className="mt-3 p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs text-slate-600">
                    <p className="font-medium text-slate-800">
                      AI Provider Architecture (ADR-002):
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-600">
                      <li>AI proposes strategies and patches; deterministic engines prove and evaluate them.</li>
                      <li>AI outputs must strictly validate against Pydantic schemas before downstream consumption.</li>
                      <li>All AI calls are logged with cryptographic input hashes in the audit table.</li>
                      <li>The provider can be swapped (e.g. OpenAI, Anthropic) without altering core business logic.</li>
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Security & Sandbox */}
          <Card className="shadow-2xs border-slate-200">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Lock className="h-4 w-4 text-slate-800" />
                <span>5. Security & Sandbox Boundary</span>
              </CardTitle>
              <p className="text-xs text-slate-500">
                Architectural guarantees ensuring isolation from production payment infrastructure.
              </p>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-lg border border-emerald-200 bg-emerald-50/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950">Synthetic Sandbox</span>
                    <span className="rounded bg-emerald-200 text-emerald-900 font-mono text-[9px] font-bold px-1.5 py-0.2">
                      AIRGAPPED
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800/80 leading-relaxed">
                    Zero live payment gateway access. All entities, accounts, and transactions are deterministically synthesized.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Immutable Audit Trail</span>
                    <span className="rounded bg-slate-200 text-slate-800 font-mono text-[9px] font-bold px-1.5 py-0.2">
                      ACTIVE
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    All simulations, patch proposals, and human approvals are permanently hashed with SHA-256 signatures.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Seeded Reproducibility</span>
                    <span className="rounded bg-slate-200 text-slate-800 font-mono text-[9px] font-bold px-1.5 py-0.2">
                      VERIFIED
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Seeded pseudo-random number generators ensure that any scenario or benchmark can be recreated identically.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
