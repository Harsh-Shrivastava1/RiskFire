import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  LayoutDashboard,
  ShieldCheck,
  Flame,
  Activity,
  AlertTriangle,
  Network,
  Wrench,
  BarChart3,
  FileText,
  AlertCircle,
  Database,
  History,
  Settings,
  PlusCircle,
  PlayCircle,
  FileSpreadsheet,
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, setFireDrillModalOpen } = useUiStore()
  const navigate = useNavigate()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || e.key === '/') {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return
        }

        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  const runCommand = (command: () => void) => {
    setCommandPaletteOpen(false)
    command()
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Type a command or search sections (e.g., Attack Graph, Patches, Policies)..." />
      <CommandList>
        <CommandEmpty>No matching RiskFire operations found.</CommandEmpty>

        <CommandGroup heading="Quick Actions">
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                setFireDrillModalOpen(true)
              })
            }
          >
            <PlayCircle className="mr-2 h-4 w-4 text-orange-600" />
            <span>Run Fire Drill (Automated Attack & Proof)</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                navigate('/policies/new')
              })
            }
          >
            <PlusCircle className="mr-2 h-4 w-4 text-blue-600" />
            <span>Create New Risk Policy</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                navigate('/attack-lab')
              })
            }
          >
            <Flame className="mr-2 h-4 w-4 text-red-600" />
            <span>Launch Attack Simulation (Attack Lab)</span>
          </CommandItem>
          <CommandItem
            onSelect={() =>
              runCommand(() => {
                navigate('/reports')
              })
            }
          >
            <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
            <span>View Executive Risk Report</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Risk">
          <CommandItem onSelect={() => runCommand(() => navigate('/'))}>
            <LayoutDashboard className="mr-2 h-4 w-4 text-slate-500" />
            <span>Overview (Risk Command Center)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/vulnerabilities'))}>
            <AlertTriangle className="mr-2 h-4 w-4 text-slate-500" />
            <span>Issues (Discovered Weaknesses)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/simulations'))}>
            <Activity className="mr-2 h-4 w-4 text-slate-500" />
            <span>Simulations (History & Runs)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/attack-graph'))}>
            <Network className="mr-2 h-4 w-4 text-slate-500" />
            <span>Attack Graph (Entity Topology)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/simulations/live'))}>
            <Activity className="mr-2 h-4 w-4 text-slate-500" />
            <span>Live Simulation Monitor</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Defend">
          <CommandItem onSelect={() => runCommand(() => navigate('/policies'))}>
            <ShieldCheck className="mr-2 h-4 w-4 text-slate-500" />
            <span>Policies (Active Rules)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/patches'))}>
            <Wrench className="mr-2 h-4 w-4 text-slate-500" />
            <span>Patches (AI Defensive Proposals)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Prove">
          <CommandItem onSelect={() => runCommand(() => navigate('/benchmarks'))}>
            <BarChart3 className="mr-2 h-4 w-4 text-slate-500" />
            <span>Benchmarks (Held-Out Test Proof)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/reports'))}>
            <FileText className="mr-2 h-4 w-4 text-slate-500" />
            <span>Reports (Executive Risk Summaries)</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="System">
          <CommandItem onSelect={() => runCommand(() => navigate('/audit-log'))}>
            <History className="mr-2 h-4 w-4 text-slate-500" />
            <span>Audit Log (Compliance & Traceability)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/datasets'))}>
            <Database className="mr-2 h-4 w-4 text-slate-500" />
            <span>Datasets (70/15/15 Synthetic Splits)</span>
          </CommandItem>
          <CommandItem onSelect={() => runCommand(() => navigate('/settings'))}>
            <Settings className="mr-2 h-4 w-4 text-slate-500" />
            <span>Settings (Merchant Profile & AI Provider)</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
