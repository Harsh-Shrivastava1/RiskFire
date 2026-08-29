import React from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { FireDrillModal } from './FireDrillModal'
import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/utils/cn'

export const AppShell: React.FC = () => {
  const { sidebarCollapsed } = useUiStore()

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-900 flex">
      {/* Persistent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-200 ease-in-out min-w-0 w-full',
          sidebarCollapsed ? 'pl-16' : 'pl-64'
        )}
      >
        {/* Global Topbar */}
        <Topbar />

        {/* Dynamic Page Views */}
        <main className="flex-1 bg-slate-50/30 w-full min-w-0">
          <Outlet />
        </main>
      </div>

      {/* Global Modals */}
      <CommandPalette />
      <FireDrillModal />
    </div>
  )
}
