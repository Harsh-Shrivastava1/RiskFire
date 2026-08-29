import { create } from 'zustand'

export interface SystemAlert {
  id: string
  title: string
  description: string
  timestamp: string
  type: 'critical' | 'patch' | 'simulation' | 'report' | 'info'
  source: string
  read: boolean
  route: string
}

interface NotificationState {
  alerts: SystemAlert[]
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeAlert: (id: string) => void
  clearAll: () => void
  addAlert: (alert: Omit<SystemAlert, 'id' | 'read'>) => void
}

const INITIAL_ALERTS: SystemAlert[] = [
  {
    id: 'alert-1',
    title: 'Critical Vulnerability Identified',
    description: 'Distributed Velocity Bypass via Multi-Account Device Sharing (₹11.8L simulated exposure).',
    timestamp: '5 mins ago',
    type: 'critical',
    source: 'Simulation #142',
    read: false,
    route: '/vulnerabilities',
  },
  {
    id: 'alert-2',
    title: 'AI Defensive Patch Generated',
    description: 'Candidate patch POL-PATCH-2026-08A ready for simulation against baseline.',
    timestamp: '12 mins ago',
    type: 'patch',
    source: 'Patch Generator',
    read: false,
    route: '/patches',
  },
  {
    id: 'alert-3',
    title: 'Deterministic Benchmark Completed',
    description: 'Stress test evaluated across 3,200 synthetic txns. 94.2% detection baseline established.',
    timestamp: '25 mins ago',
    type: 'simulation',
    source: 'Evaluation Engine',
    read: true,
    route: '/simulations',
  },
  {
    id: 'alert-4',
    title: 'Executive Audit Report Ready',
    description: 'Q3 Adversarial Red-Team Stress Test report synthesized with cryptographic proof.',
    timestamp: '1 hour ago',
    type: 'report',
    source: 'Audit System',
    read: true,
    route: '/reports',
  },
]

export const useNotificationStore = create<NotificationState>((set) => ({
  alerts: INITIAL_ALERTS,
  markAsRead: (id: string) => {
    set((state) => ({
      alerts: state.alerts.map((a) => (a.id === id ? { ...a, read: true } : a)),
    }))
  },
  markAllAsRead: () => {
    set((state) => ({
      alerts: state.alerts.map((a) => ({ ...a, read: true })),
    }))
  },
  removeAlert: (id: string) => {
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    }))
  },
  clearAll: () => {
    set({ alerts: [] })
  },
  addAlert: (alertData) => {
    const newAlert: SystemAlert = {
      ...alertData,
      id: `alert-${Date.now()}`,
      read: false,
    }
    set((state) => ({
      alerts: [newAlert, ...state.alerts],
    }))
  },
}))
