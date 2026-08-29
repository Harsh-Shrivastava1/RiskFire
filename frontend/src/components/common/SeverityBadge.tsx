import React from 'react'
import { Badge } from '@/components/ui/badge'
import { RiskSeverity } from '@/types'
import { cn } from '@/utils/cn'

interface SeverityBadgeProps {
  severity: RiskSeverity | string
  className?: string
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, className }) => {
  const upper = severity.toUpperCase()

  let style = 'bg-slate-100 text-slate-700 border-slate-200'
  let dotColor = 'bg-slate-500'

  if (upper === 'CRITICAL') {
    style = 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50'
    dotColor = 'bg-red-600'
  } else if (upper === 'HIGH') {
    style = 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-50'
    dotColor = 'bg-orange-600'
  } else if (upper === 'MEDIUM') {
    style = 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-50'
    dotColor = 'bg-amber-600'
  } else if (upper === 'LOW') {
    style = 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50'
    dotColor = 'bg-blue-600'
  } else if (upper === 'INFO') {
    style = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-100'
    dotColor = 'bg-slate-400'
  }

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-wide font-mono', style, className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
      <span>{upper}</span>
    </Badge>
  )
}
