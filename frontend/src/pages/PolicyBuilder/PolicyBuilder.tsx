import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePolicyBuilder } from '@/hooks/usePolicyBuilder'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Code,
} from 'lucide-react'
import { PolicyCategory, PolicyRuleType, RuleAction } from '@/types'

const ruleTypeOptions: { label: string; value: PolicyRuleType; category: PolicyCategory }[] = [
  { label: 'Transactions per Account in Window (Velocity)', value: 'VELOCITY_ACCOUNT', category: 'VELOCITY' },
  { label: 'Transactions per Device in Window (Velocity)', value: 'VELOCITY_DEVICE', category: 'VELOCITY' },
  { label: 'Transactions per Payment Instrument in Window', value: 'VELOCITY_INSTRUMENT', category: 'VELOCITY' },
  { label: 'Transactions per Shipping Address in Window', value: 'VELOCITY_ADDRESS', category: 'VELOCITY' },
  { label: 'Transactions per IP in Window', value: 'VELOCITY_IP', category: 'VELOCITY' },
  { label: 'Maximum Single Transaction Amount (INR)', value: 'AMOUNT_MAX', category: 'AMOUNT' },
  { label: 'Rolling 24h Account Amount Ceiling (INR)', value: 'AMOUNT_DAILY', category: 'AMOUNT' },
  { label: 'Minimum Account Age Requirement (Days)', value: 'IDENTITY_ACCOUNT_AGE', category: 'IDENTITY' },
  { label: 'Max Distinct Devices per Account', value: 'IDENTITY_DEVICE_COUNT', category: 'IDENTITY' },
  { label: 'Max Cards per Account (Instrument)', value: 'INSTRUMENT_CARDS_PER_ACCOUNT', category: 'PAYMENT_INSTRUMENT' },
  { label: 'Refund-to-Order Ratio Threshold (%)', value: 'REFUND_RATIO', category: 'REFUNDS' },
  { label: 'First-Order Coupon Frequency Limit', value: 'PROMOTION_COUPON', category: 'PROMOTIONS' },
  { label: 'Rapid Account Switching Velocity', value: 'BEHAVIOR_RAPID_SWITCH', category: 'BEHAVIORAL' },
]

export const PolicyBuilder: React.FC = () => {
  const navigate = useNavigate()
  const [showJsonSchema, setShowJsonSchema] = useState(false)
  const {
    name,
    setName,
    description,
    setDescription,
    category,
    setCategory,
    rules,
    addRule,
    updateRule,
    removeRule,
    savePolicy,
    saving,
    validationErrors,
  } = usePolicyBuilder()

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Policy Builder"
        description="Create and customize payment risk evaluation rules."
        badge={
          <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-mono font-bold text-blue-700">
            DRAFT v1.0
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/policies')}
              className="h-8 gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </Button>
            <Button
              size="sm"
              onClick={savePolicy}
              disabled={saving}
              className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Validating...' : 'Save Policy'}</span>
            </Button>
          </div>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Validation Errors Alert */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="text-xs">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Validation Errors</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                {validationErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form: Metadata & Rules Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Section 1: Policy Name & Objective */}
            <Card className="shadow-2xs p-5 space-y-4 bg-white">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800">1. Policy Identity</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Policy Name *</label>
                  <Input
                    type="text"
                    placeholder="e.g., Device Velocity & High-Risk Amount Safeguard"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Policy Category</label>
                    <Select
                      value={category}
                      onValueChange={(val) => setCategory(val as PolicyCategory)}
                    >
                      <SelectTrigger className="h-9 text-xs">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VELOCITY">Velocity Controls</SelectItem>
                        <SelectItem value="AMOUNT">Amount Thresholds</SelectItem>
                        <SelectItem value="IDENTITY">Identity Signals</SelectItem>
                        <SelectItem value="PAYMENT_INSTRUMENT">Payment Instruments</SelectItem>
                        <SelectItem value="REFUNDS">Refund Patterns</SelectItem>
                        <SelectItem value="PROMOTIONS">Promotion Safeguards</SelectItem>
                        <SelectItem value="BEHAVIORAL">Behavioral Profiling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Execution Mode</label>
                    <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-700 font-medium text-xs">
                      Deterministic Sandbox Mode
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Description & Rationale *</label>
                  <Textarea
                    placeholder="Describe what payment risks this policy prevents in plain English..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    className="text-xs"
                  />
                </div>
              </div>
            </Card>

            {/* Section 2: Rule Definitions */}
            <Card className="shadow-2xs p-5 space-y-4 bg-white">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-800">2. Evaluation Rules</h3>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRule}
                  className="h-7 text-xs gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Rule</span>
                </Button>
              </div>

              <div className="space-y-3">
                {rules.map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 space-y-3 relative text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-800">
                          {idx + 1}
                        </span>
                        <span>Rule #{idx + 1}</span>
                      </span>

                      {rules.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRule(idx)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remove Rule"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">Condition (When)</label>
                        <Select
                          value={rule.ruleType}
                          onValueChange={(val) =>
                            updateRule(idx, { ruleType: val as PolicyRuleType })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ruleTypeOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">Action (Then)</label>
                        <Select
                          value={rule.action}
                          onValueChange={(val) =>
                            updateRule(idx, { action: val as RuleAction })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BLOCK">Block Transaction</SelectItem>
                            <SelectItem value="FLAG">Require Step-Up (OTP / Review)</SelectItem>
                            <SelectItem value="MONITOR">Log Telemetry Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Parameters Customization */}
                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">
                          Threshold Count
                        </label>
                        <Input
                          type="number"
                          value={rule.parameters?.maxCount || 3}
                          onChange={(e) =>
                            updateRule(idx, {
                              parameters: {
                                ...rule.parameters,
                                maxCount: parseInt(e.target.value) || 1,
                              },
                            })
                          }
                          className="h-8 text-xs bg-white font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-slate-600">
                          Time Window (Minutes)
                        </label>
                        <Input
                          type="number"
                          value={rule.parameters?.windowMinutes || 10}
                          onChange={(e) =>
                            updateRule(idx, {
                              parameters: {
                                ...rule.parameters,
                                windowMinutes: parseInt(e.target.value) || 1,
                              },
                            })
                          }
                          className="h-8 text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Collapsible JSON Schema View */}
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowJsonSchema(!showJsonSchema)}
                className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-blue-600" />
                  <span>View JSON Schema & Engine AST</span>
                </div>
                {showJsonSchema ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>

              {showJsonSchema && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-md font-mono text-[11px] overflow-x-auto max-h-60">
                    {JSON.stringify({ name, description, category, rules }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Live Policy Summary */}
          <div className="space-y-6">
            <Card className="shadow-2xs sticky top-20 bg-white p-5 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-border pb-3">
                <Eye className="h-4 w-4 text-slate-500" />
                <h3 className="text-sm font-bold text-slate-800">Policy Summary</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Policy Name</span>
                  <p className="font-bold text-slate-800">
                    {name || 'Untitled Draft Policy'}
                  </p>
                </div>

                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Category</span>
                  <p className="font-mono text-slate-700 font-semibold">{category}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Configured Rules ({rules.length})
                  </span>
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-2.5 space-y-1.5 text-[11px]">
                    {rules.map((r, i) => (
                      <div key={i} className="text-slate-700 flex items-start gap-1">
                        <span className="font-bold text-blue-600 shrink-0">{i + 1}.</span>
                        <div>
                          <span className="font-medium">{r.ruleType.split('_')[0]} limit: </span>
                          <span className="text-slate-500">max {r.parameters?.maxCount || 3} / {r.parameters?.windowMinutes || 10}m → </span>
                          <span className="font-bold text-red-600">{r.action}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={savePolicy}
                  disabled={saving}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold h-9 shadow-2xs mt-2"
                >
                  {saving ? 'Publishing...' : 'Save & Publish Policy'}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

