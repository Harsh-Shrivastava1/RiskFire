import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

const routeNameMap: Record<string, string> = {
  policies: 'Risk Policies',
  new: 'Policy Builder',
  'attack-lab': 'Attack Lab',
  simulations: 'Simulations',
  live: 'Live Monitor',
  vulnerabilities: 'Vulnerabilities',
  'attack-graph': 'Attack Graph',
  patches: 'Policy Patches',
  benchmarks: 'Benchmarks',
  reports: 'Reports',
  incidents: 'Incidents',
  datasets: 'Datasets',
  audit: 'Audit Log',
  settings: 'Settings',
  replay: 'Replay & Benchmarks',
}

export const Breadcrumbs: React.FC = () => {
  const location = useLocation()
  const pathnames = location.pathname.split('/').filter((x) => x)

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-xs text-slate-500 font-medium">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-slate-900 transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        <span>RiskFire</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`
        const isLast = index === pathnames.length - 1
        const displayName = routeNameMap[value] || value.toUpperCase()

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-slate-400 mx-1.5 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                {displayName}
              </span>
            ) : (
              <Link to={to} className="hover:text-slate-900 transition-colors truncate">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        )
      })}
    </nav>
  )
}
