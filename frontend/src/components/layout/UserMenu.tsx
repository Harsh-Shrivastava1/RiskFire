import React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Shield, User, LogOut, FileCode, CheckCircle2 } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useNavigate } from 'react-router-dom'

export const UserMenu: React.FC = () => {
  const navigate = useNavigate()
  const { userName, userRole, userEmail } = useUiStore()

  // Generate 2-letter uppercase initials
  const initials = userName
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'HS'

  const handleLogout = () => {
    navigate('/')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 transition-colors focus:outline-none focus:ring-1 focus:ring-slate-400 cursor-pointer">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white tracking-tighter">
            {initials}
          </div>
          <span className="font-medium max-w-32 truncate">{userName}</span>
          <span className="rounded bg-slate-100 px-1 py-0.5 text-[9px] font-mono text-slate-600 hidden sm:inline">
            Admin
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 text-xs">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-0.5">
            <span className="font-semibold text-slate-900">{userName}</span>
            <span className="text-[11px] text-slate-500 font-normal truncate">{userEmail}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 bg-slate-50 rounded-sm mx-1 my-1">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
            <Shield className="h-3.5 w-3.5 text-blue-600 shrink-0" />
            <span>Merchant ID: <span className="font-mono text-slate-800">m-dev-01</span></span>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Role: {userRole} (Full Write)</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
          <User className="mr-2 h-3.5 w-3.5 text-slate-500" />
          <span>Profile & Workspace</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/settings')}>
          <FileCode className="mr-2 h-3.5 w-3.5 text-slate-500" />
          <span>Simulation Defaults</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-rose-600 hover:text-rose-700 hover:bg-rose-50 font-medium"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-3.5 w-3.5 text-rose-600" />
          <span>Log Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
