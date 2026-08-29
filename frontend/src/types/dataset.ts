import { DatasetSplitType, UUID } from './common'

export interface DatasetSplitStats {
  split: DatasetSplitType
  percentage: number
  totalRecords: number
  legitimateCount: number
  adversarialCount: number
  accountsCount: number
  devicesCount: number
  isIsolated: boolean
  lastUpdated: string
}

export interface SyntheticDataset {
  id: UUID
  name: string
  version: string
  totalRecords: number
  generationSeed: number
  createdAt: string
  status: 'ACTIVE' | 'ARCHIVED' | 'GENERATING'
  splits: DatasetSplitStats[]
  description: string
}
