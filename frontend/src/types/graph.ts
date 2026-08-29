import { UUID } from './common'

export type GraphEntityType = 
  | 'ACCOUNT' 
  | 'DEVICE' 
  | 'IP' 
  | 'ADDRESS' 
  | 'PAYMENT_INSTRUMENT' 
  | 'ORDER' 
  | 'TRANSACTION'

export interface GraphNodeData {
  id: string
  label: string
  entityType: GraphEntityType
  identifier: string
  isAdversarial: boolean
  isShared: boolean
  connectionCount: number
  riskLevel?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL'
  metadata?: Record<string, any>
}

export interface AttackGraphData {
  nodes: Array<{
    id: string
    type: string
    position: { x: number; y: number }
    data: GraphNodeData
  }>
  edges: Array<{
    id: string
    source: string
    target: string
    label?: string
    animated?: boolean
    style?: Record<string, any>
  }>
}
