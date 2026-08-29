import React, { useState } from 'react'
import { useAttackGraph } from '@/hooks/useAttackGraph'
import { PageHeader } from '@/components/layout/PageHeader'
import { AttackFlowGraph } from '@/components/graphs/AttackFlowGraph'
import { SimulationDisclaimer } from '@/components/common/SimulationDisclaimer'
import { LoadingState } from '@/components/common/LoadingState'
import { ErrorState } from '@/components/common/ErrorState'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Network,
  Share2,
  Filter,
  ShieldAlert,
  Smartphone,
  MapPin,
  CreditCard,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const filterCategories = [
  { label: 'All Entities (24)', type: 'ALL' },
  { label: 'Devices (4)', type: 'DEVICE' },
  { label: 'Accounts (12)', type: 'ACCOUNT' },
  { label: 'IP Subnets (5)', type: 'IP' },
  { label: 'Card Tokens (3)', type: 'CARD' },
]

export const AttackGraph: React.FC = () => {
  const { graphData, selectedNode, setSelectedNode, loading, error, refetch } = useAttackGraph()
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [activeScenario, setActiveScenario] = useState('SCN-VELOCITY-001')

  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <LoadingState type="chart" rows={5} />
      </div>
    )
  }

  if (error || !graphData) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <ErrorState
          title="Unable to load attack topology"
          message={error || 'Failed to render entity graph relationship data.'}
          onRetry={refetch}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        title="Attack Graph"
        description="Visual map of connections between simulated accounts, devices, and cards."
        badge={
          <span className="rounded bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-mono font-bold">
            {graphData.nodes.length} Entities • {graphData.edges.length} Links
          </span>
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            className="h-8 gap-1 text-xs"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Reset View</span>
          </Button>
        }
      />

      <div className="px-6 space-y-6 w-full">
        {/* Friendly Top Summary Card */}
        <Card className="p-4 shadow-2xs border-blue-200 bg-blue-50/40">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-100 text-blue-700 shrink-0">
              <Network className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">
                Attack Topology Summary
              </span>
              <p className="text-xs font-semibold text-slate-900 mt-0.5">
                24 coordinated entities, 4 device clusters, and 1 shared card token across 3 merchant routes.
              </p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Adversaries bypassed individual account velocity limits by spreading 12 transactions across 4 synthetic accounts linked to a single hardware fingerprint (<span className="font-mono text-purple-700 font-bold">DEV-9102-FP89</span>).
              </p>
            </div>
          </div>
        </Card>

        {/* Entity Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {filterCategories.map((cat) => (
            <button
              key={cat.type}
              onClick={() => setSelectedFilter(cat.type)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedFilter === cat.type
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Key Anchor Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <Card className="p-3 shadow-2xs border-purple-200 bg-purple-50/20 flex items-center gap-3">
            <div className="p-2 rounded bg-purple-100 text-purple-700">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700">
                Shared Hardware Anchor
              </span>
              <p className="font-bold text-slate-800 font-mono">DEV-9102-FP89</p>
              <p className="text-[10px] text-slate-500">4 accounts linked to 1 device</p>
            </div>
          </Card>

          <Card className="p-3 shadow-2xs border-amber-200 bg-amber-50/20 flex items-center gap-3">
            <div className="p-2 rounded bg-amber-100 text-amber-700">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-700">
                Delivery Address Cluster
              </span>
              <p className="font-bold text-slate-800 font-mono">ADDR-BLR-KORAMANGALA</p>
              <p className="text-[10px] text-slate-500">Shared across all 4 accounts</p>
            </div>
          </Card>

          <Card className="p-3 shadow-2xs border-red-200 bg-red-50/20 flex items-center gap-3">
            <div className="p-2 rounded bg-red-100 text-red-700">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-red-700">
                Policy Weakness Discovered
              </span>
              <p className="font-bold text-slate-800 font-mono">POL-VELOCITY-001</p>
              <p className="text-[10px] text-slate-500">Missing device rate limiter</p>
            </div>
          </Card>
        </div>

        {/* Interactive React Flow Attack Canvas */}
        <Card className="shadow-2xs p-3 bg-white">
          <AttackFlowGraph data={graphData} onSelectNode={setSelectedNode} />
        </Card>

        {/* Collapsible Advanced Graph Settings */}
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
          <button
            type="button"
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className="flex items-center justify-between w-full text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>View Advanced Graph Settings & Physics Controls</span>
            </div>
            {showAdvancedSettings ? (
              <ChevronUp className="h-4 w-4 text-slate-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-500" />
            )}
          </button>

          {showAdvancedSettings && (
            <div className="mt-3 pt-3 border-t border-slate-200 text-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Active Scenario</label>
                  <select
                    value={activeScenario}
                    onChange={(e) => setActiveScenario(e.target.value)}
                    className="w-full h-8 text-xs rounded border border-slate-200 bg-white px-2"
                  >
                    <option value="SCN-VELOCITY-001">SCN-VELOCITY-001 (Multi-Account Device Velocity)</option>
                    <option value="SCN-REFUND-002">SCN-REFUND-002 (Rapid Refund & Chargeback Ring)</option>
                    <option value="SCN-CARD-003">SCN-CARD-003 (Card Testing Across Subnets)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Degree Centrality Cutoff</label>
                  <div className="font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded">
                    Minimum degree: ≥ 2 links
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600">Layout Engine</label>
                  <div className="font-mono text-xs text-slate-700 bg-white border border-slate-200 p-1.5 rounded">
                    D3 Force-Directed Simulation
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

