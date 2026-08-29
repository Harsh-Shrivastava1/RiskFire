import React, { useState, useCallback } from 'react'
import {
  ReactFlow,
  Controls,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  Node,
  Edge,
  NodeChange,
  EdgeChange,
  Connection,
  addEdge,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { AttackGraphData, GraphNodeData } from '@/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Shield, Smartphone, Globe, MapPin, CreditCard, AlertTriangle, CheckCircle, Info } from 'lucide-react'

interface AttackFlowGraphProps {
  data: AttackGraphData
  onSelectNode?: (node: GraphNodeData | null) => void
}

const getNodeIcon = (type: string) => {
  switch (type) {
    case 'ACCOUNT':
      return <Shield className="h-3.5 w-3.5 text-blue-600" />
    case 'DEVICE':
      return <Smartphone className="h-3.5 w-3.5 text-purple-600" />
    case 'IP':
      return <Globe className="h-3.5 w-3.5 text-slate-600" />
    case 'ADDRESS':
      return <MapPin className="h-3.5 w-3.5 text-amber-600" />
    case 'PAYMENT_INSTRUMENT':
      return <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
    case 'TRANSACTION':
      return <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
    default:
      return <Info className="h-3.5 w-3.5 text-slate-600" />
  }
}

export const AttackFlowGraph: React.FC<AttackFlowGraphProps> = ({ data, onSelectNode }) => {
  const [selectedNode, setSelectedNode] = useState<GraphNodeData | null>(null)

  // Map graph nodes to React Flow format
  const initialNodes: Node[] = data.nodes.map((n) => {
    let borderColor = 'border-slate-300'
    let bgColor = 'bg-white'

    if (n.data.isAdversarial) {
      borderColor = 'border-red-500 ring-2 ring-red-100'
      bgColor = 'bg-red-50/50'
    } else if (n.data.isShared) {
      borderColor = 'border-purple-500 ring-1 ring-purple-100'
      bgColor = 'bg-purple-50/40'
    }

    return {
      id: n.id,
      position: { x: n.position.x, y: n.position.y },
      data: {
        label: (
          <div className="flex flex-col text-left">
            <div className="flex items-center gap-1.5 mb-1">
              {getNodeIcon(n.data.entityType)}
              <span className="text-[10px] font-bold font-mono text-slate-500 uppercase">
                {n.data.entityType}
              </span>
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate">{n.data.label}</span>
            {n.data.metadata?.deviceFingerprint && (
              <span className="text-[9px] font-mono text-purple-700 truncate mt-0.5">
                {n.data.metadata.deviceFingerprint}
              </span>
            )}
            {n.data.metadata?.addressHash && (
              <span className="text-[9px] font-mono text-amber-700 truncate mt-0.5">
                {n.data.metadata.addressHash}
              </span>
            )}
          </div>
        ),
        rawNode: n.data,
      },
      style: {
        background: '#ffffff',
        border: '1px solid #cbd5e1',
        borderRadius: '8px',
        padding: '8px 12px',
        width: 170,
        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.05)',
      },
      className: `${borderColor} ${bgColor}`,
    }
  })

  // Map graph edges to React Flow format
  const initialEdges: Edge[] = data.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    label: e.label,
    animated: e.animated,
    style: e.style || {
      stroke: e.animated ? '#dc2626' : '#94a3b8',
      strokeWidth: e.animated ? 2.5 : 1.5,
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: e.animated ? '#dc2626' : '#94a3b8',
    },
    labelStyle: { fontSize: 10, fill: e.animated ? '#dc2626' : '#64748b', fontWeight: 600 },
  }))

  const [nodes, setNodes] = useState<Node[]>(initialNodes)
  const [edges, setEdges] = useState<Edge[]>(initialEdges)

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  )

  const handleNodeClick = (_: React.MouseEvent, node: Node) => {
    const raw = (node.data as any)?.rawNode as GraphNodeData
    setSelectedNode(raw)
    onSelectNode?.(raw)
  }

  return (
    <div className="relative h-[550px] w-full rounded-lg border border-border bg-slate-50/50 overflow-hidden">
      {/* Top Legend */}
      <div className="absolute left-3 top-3 z-10 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white/90 p-2 shadow-2xs backdrop-blur-xs text-[11px]">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
          <span className="font-medium text-slate-700">Adversarial Flow</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-purple-600" />
          <span className="font-medium text-slate-700">Shared Hardware/Infra</span>
        </div>
        <span className="text-slate-300">|</span>
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="font-medium text-slate-700">Target Accounts</span>
        </div>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Background color="#cbd5e1" gap={16} size={1} />
        <Controls showInteractive={false} className="bg-white border-slate-200 shadow-2xs" />
      </ReactFlow>

      {/* Node Inspector Drawer */}
      {selectedNode && (
        <Card className="absolute right-3 top-3 bottom-3 z-10 w-80 overflow-y-auto border border-slate-200 bg-white p-4 shadow-md">
          <div className="flex items-center justify-between border-b border-border pb-2.5">
            <div className="flex items-center gap-1.5">
              {getNodeIcon(selectedNode.entityType)}
              <span className="font-semibold text-xs text-slate-900">
                {selectedNode.entityType} Node Details
              </span>
            </div>
            <button
              onClick={() => {
                setSelectedNode(null)
                onSelectNode?.(null)
              }}
              className="text-xs text-slate-400 hover:text-slate-700 font-mono"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3 py-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Label</span>
              <p className="font-semibold text-slate-800 text-sm">{selectedNode.label}</p>
            </div>

            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400">Identifier</span>
              <p className="font-mono text-slate-600">{selectedNode.identifier || selectedNode.id}</p>
            </div>

            {selectedNode.isShared && (
              <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-[10px]">
                Shared Collusion Point
              </Badge>
            )}

            {selectedNode.isAdversarial && (
              <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] ml-1">
                Adversarial Actor
              </Badge>
            )}

            <div className="rounded bg-slate-50 p-2.5 space-y-1.5 border border-slate-100 font-mono text-[11px]">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-sans block mb-1">
                Topology Attributes
              </span>
              <div className="flex justify-between">
                <span className="text-slate-500">Connections:</span>
                <span className="text-slate-800 font-semibold">{selectedNode.connectionCount}</span>
              </div>
              {Object.entries(selectedNode.metadata || {}).map(([key, val]) => (
                <div key={key} className="flex justify-between">
                  <span className="text-slate-500">{key}:</span>
                  <span className="text-slate-800 font-semibold truncate max-w-[140px]">
                    {String(val)}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed border-t border-border pt-2">
              Cross-entity relationships calculated by Deterministic AttackGraphEngine.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
