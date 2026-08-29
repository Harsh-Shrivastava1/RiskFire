import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  ShieldCheck,
  AlertTriangle,
  Layers,
  Wrench,
  BarChart3,
  FileText,
  Database,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/utils/cn'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  badge?: string | number
  badgeVariant?: 'critical' | 'warning' | 'info' | 'default'
}

interface NavSection {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: 'RISK',
    items: [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Issues', href: '/vulnerabilities', icon: AlertTriangle },
      { name: 'Simulations', href: '/simulations', icon: Layers },
    ],
  },
  {
    title: 'DEFEND',
    items: [
      { name: 'Policies', href: '/policies', icon: ShieldCheck },
      { name: 'Patches', href: '/patches', icon: Wrench },
    ],
  },
  {
    title: 'PROVE',
    items: [
      { name: 'Benchmarks', href: '/benchmarks', icon: BarChart3 },
      { name: 'Reports', href: '/reports', icon: FileText },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { name: 'Audit Log', href: '/audit-log', icon: History },
      { name: 'Datasets', href: '/datasets', icon: Database },
      { name: 'Settings', href: '/settings', icon: Settings },
    ],
  },
]

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore()
  const location = useLocation()

  return (
    <TooltipProvider delayDuration={100}>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col border-r border-slate-200/80 bg-white shadow-2xs transition-all duration-200 ease-in-out select-none',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {/* Header / Brand */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200/80 px-3.5">
          {!sidebarCollapsed ? (
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs shrink-0">
                <Shield className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 truncate">
                RiskFire
              </span>
            </div>
          ) : (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs shrink-0">
              <Shield className="h-4 w-4 text-blue-400" />
            </div>
          )}

          <button
            onClick={toggleSidebar}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors shrink-0',
              sidebarCollapsed && 'hidden'
            )}
            title="Collapse sidebar"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Collapsed Toggle Button below Logo in collapsed mode */}
        {sidebarCollapsed && (
          <div className="flex justify-center border-b border-slate-100 py-1.5">
            <button
              onClick={toggleSidebar}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              title="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4.5 no-scrollbar">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2.5 pb-1">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase font-mono">
                    {section.title}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    item.href === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.href)

                  const navButton = (
                    <NavLink
                      to={item.href}
                      key={item.href}
                      className={cn(
                        'group flex items-center rounded-lg px-2.5 py-2 text-xs font-medium transition-all relative',
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-semibold shadow-2xs border border-blue-200/60'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
                        sidebarCollapsed && 'justify-center px-0 py-2 h-9 w-full'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600',
                          !sidebarCollapsed && 'mr-2.5'
                        )}
                      />
                      {!sidebarCollapsed && (
                        <span className="flex-1 truncate tracking-tight">{item.name}</span>
                      )}
                      {!sidebarCollapsed && item.badge && (
                        <span
                          className={cn(
                            'ml-auto rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono',
                            item.badgeVariant === 'critical'
                              ? 'bg-red-50 text-red-700 border border-red-200/70'
                              : item.badgeVariant === 'warning'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200/70'
                              : item.badgeVariant === 'info'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200/70'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )

                  if (sidebarCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{navButton}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={10} className="flex items-center gap-2 text-xs font-medium py-1.5 px-2.5 shadow-md">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="rounded bg-slate-100 border border-slate-200 px-1 text-[10px] font-mono text-slate-700 font-bold">
                              {item.badge}
                            </span>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return navButton
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info in sidebar */}
        <div className="border-t border-slate-200/80 p-2.5 bg-slate-50/50">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-2xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-semibold text-slate-700 truncate">
                  Active Policy
                </span>
              </div>
              <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/60">
                v1.2
              </span>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center justify-center p-1 cursor-pointer">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={10} className="text-xs font-medium p-2">
                <p className="font-semibold text-slate-900">Active Policy: v1.2</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}
