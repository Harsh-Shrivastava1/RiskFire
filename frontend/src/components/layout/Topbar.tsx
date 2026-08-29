import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Breadcrumbs } from './Breadcrumbs'
import { UserMenu } from './UserMenu'
import {
  Search,
  Flame,
  Bell,
  ShieldAlert,
  Sparkles,
  Layers,
  FileCheck2,
  CheckCircle2,
  X,
  ArrowRight,
  Info,
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useNotificationStore, SystemAlert } from '@/store/useNotificationStore'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export const Topbar: React.FC = () => {
  const navigate = useNavigate()
  const { setCommandPaletteOpen, setFireDrillModalOpen } = useUiStore()
  const { alerts, markAsRead, markAllAsRead, removeAlert, clearAll } = useNotificationStore()
  const [popoverOpen, setPopoverOpen] = useState(false)

  const unreadCount = alerts.filter((a) => !a.read).length

  const handleNotificationClick = (alert: SystemAlert) => {
    markAsRead(alert.id)
    setPopoverOpen(false)
    if (alert.route) {
      navigate(alert.route)
    }
  }

  const renderAlertIcon = (type: SystemAlert['type']) => {
    switch (type) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
      case 'patch':
        return <Sparkles className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
      case 'simulation':
        return <Layers className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
      case 'report':
        return <FileCheck2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
      default:
        return <Info className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-6 backdrop-blur-xs">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-4">
        <Breadcrumbs />
      </div>

      {/* Right: Actions, Environment status, User */}
      <div className="flex items-center gap-3">
        {/* Global Search / Command trigger */}
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-8 items-center gap-2 rounded-md border border-slate-200 bg-slate-50/80 px-3 text-xs text-slate-500 shadow-2xs hover:border-slate-300 hover:bg-slate-100/70 transition-all sm:w-64 cursor-pointer"
        >
          <Search className="h-3.5 w-3.5 text-slate-400" />
          <span className="flex-1 text-left">Search or navigate...</span>
        </button>

        {/* Synthetic Env Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/80 px-2.5 py-0.5 text-[11px] font-medium text-blue-800">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
          <span className="font-mono">SYNTHETIC SANDBOX</span>
        </div>

        {/* Fire Drill Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setFireDrillModalOpen(true)}
          className="h-8 gap-1.5 border-orange-200 bg-orange-50/60 text-orange-800 hover:bg-orange-100 hover:text-orange-900 text-xs font-semibold cursor-pointer shadow-2xs"
        >
          <Flame className="h-3.5 w-3.5 text-orange-600 fill-orange-600/20" />
          <span className="hidden sm:inline">Run Fire Drill</span>
        </Button>

        {/* Interactive Alerts Popover */}
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="relative flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
              aria-label="Open notifications"
            >
              <Bell className="h-3.5 w-3.5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white shadow-2xs">
                  {unreadCount}
                </span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-88 p-0 text-xs shadow-xl rounded-xl border-slate-200">
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-3 bg-slate-50/70 rounded-t-xl">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm">System Notifications</span>
                {unreadCount > 0 && (
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
                    {unreadCount} New
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] font-medium text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
                {alerts.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
            </div>

            {/* Alert Items List */}
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    onClick={() => handleNotificationClick(alert)}
                    className={`group relative p-3 hover:bg-slate-50 transition-colors cursor-pointer flex items-start justify-between gap-2.5 ${
                      !alert.read ? 'bg-blue-50/30' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      {renderAlertIcon(alert.type)}
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-xs font-semibold truncate ${!alert.read ? 'text-slate-900' : 'text-slate-700'}`}>
                            {alert.title}
                          </p>
                          {!alert.read && (
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                          )}
                        </div>
                        <p className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                          {alert.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono pt-0.5">
                          <span>{alert.timestamp}</span>
                          <span>•</span>
                          <span>{alert.source}</span>
                        </div>
                      </div>
                    </div>

                    {/* Delete item button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeAlert(alert.id)
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded transition-all shrink-0"
                      title="Dismiss alert"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-1">
                  <CheckCircle2 className="h-7 w-7 text-emerald-500 mx-auto mb-1 opacity-90" />
                  <p className="font-semibold text-xs text-slate-800">All caught up</p>
                  <p className="text-[11px] text-slate-500">No active system alerts or notifications.</p>
                </div>
              )}
            </div>

            {/* Popover Footer */}
            <div className="border-t border-slate-200 p-2 bg-slate-50/80 text-center rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  setPopoverOpen(false)
                  navigate('/audit-log')
                }}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 font-medium hover:text-slate-900 cursor-pointer transition-colors"
              >
                <span>View all audit logs</span>
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User profile */}
        <UserMenu />
      </div>
    </header>
  )
}
