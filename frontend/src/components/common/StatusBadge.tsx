import React from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/utils/cn'

interface StatusBadgeProps {
  status: string
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const upper = status.toUpperCase()

  let style = 'bg-slate-100 text-slate-700 border-slate-200'
  let dotColor = 'bg-slate-400'

  if (['ACTIVE', 'COMPLETED', 'APPROVED', 'VALID', 'BLOCKED', 'SUCCESS', 'PASS'].includes(upper)) {
    style = 'bg-emerald-50 text-emerald-700 border-emerald-200'
    dotColor = 'bg-emerald-600'
  } else if (['RUNNING', 'IN_PROGRESS', 'SIMULATING'].includes(upper)) {
    style = 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
    dotColor = 'bg-blue-600'
  } else if (['PENDING', 'PENDING_SIMULATION', 'DRAFT', 'FLAGGED', 'REVIEW_REQUIRED', 'PARTIAL'].includes(upper)) {
    style = 'bg-amber-50 text-amber-800 border-amber-200'
    dotColor = 'bg-amber-600'
  } else if (['FAILED', 'REJECTED', 'ALLOWED', 'VULNERABLE', 'BREACH', 'SUPERSEDED'].includes(upper)) {
    style = 'bg-red-50 text-red-700 border-red-200'
    dotColor = 'bg-red-600'
  }

  return (
    <Badge
      variant="outline"
      className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-semibold tracking-wide font-mono', style, className)}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
      <span>{upper.replace('_', ' ')}</span>
    </Badge>
  )
}
