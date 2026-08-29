import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  commandPaletteOpen: boolean
  fireDrillModalOpen: boolean
  userName: string
  userRole: string
  userEmail: string
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setFireDrillModalOpen: (open: boolean) => void
  setUserName: (name: string) => void
}

const getInitialUserName = (): string => {
  try {
    return localStorage.getItem('riskfire_user_name') || 'Harsh Shrivastava'
  } catch {
    return 'Harsh Shrivastava'
  }
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  fireDrillModalOpen: false,
  userName: getInitialUserName(),
  userRole: 'Merchant Admin',
  userEmail: 'harshshrivasatava1@gmail.com',
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setFireDrillModalOpen: (open) => set({ fireDrillModalOpen: open }),
  setUserName: (name: string) => {
    try {
      localStorage.setItem('riskfire_user_name', name)
    } catch {
      // ignore
    }
    set({ userName: name })
  },
}))
