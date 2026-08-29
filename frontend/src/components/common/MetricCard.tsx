import React from 'react'
import { Card } from '@/components/ui/card'
import { cn } from '@/utils/cn'
import { ArrowDownRight, ArrowUpRight, HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface MetricCardProps {
  label: string
  technicalLabel?: string
  value: string | number
  subtext?: string
  whyText?: string
  trend?: {
    value: string
    isPositive?: boolean
    direction?: 'up' | 'down'
  }
  icon?: React.ElementType
  tooltip?: string
  className?: string
  variant?: 'default' | 'critical' | 'warning' | 'success' | 'blue'
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  technicalLabel,
  value,
  subtext,
  whyText,
  trend,
  icon: Icon,
  tooltip,
  className,
  variant = 'default',
}) => {
  let accentBorder = 'border-slate-200 bg-white'
  let iconBg = 'bg-slate-100 text-slate-600'

  if (variant === 'critical') {
    accentBorder = 'border-red-200 bg-red-50/20'
    iconBg = 'bg-red-100 text-red-700'
  } else if (variant === 'warning') {
    accentBorder = 'border-amber-200 bg-amber-50/20'
    iconBg = 'bg-amber-100 text-amber-800'
  } else if (variant === 'success') {
    accentBorder = 'border-emerald-200 bg-emerald-50/20'
    iconBg = 'bg-emerald-100 text-emerald-700'
  } else if (variant === 'blue') {
    accentBorder = 'border-blue-200 bg-blue-50/20'
    iconBg = 'bg-blue-100 text-blue-700'
  }

  const effectiveTooltip = tooltip || whyText

  return (
    <Card className={cn('p-4 shadow-2xs transition-all hover:shadow-xs flex flex-col justify-between', accentBorder, className)}>
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <span>{label}</span>
            {effectiveTooltip && (
              <TooltipProvider delayDuration={150}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-slate-400 hover:text-slate-600 focus:outline-hidden">
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs max-w-xs p-2.5 bg-slate-900 text-slate-100 leading-relaxed shadow-lg">
                    {effectiveTooltip}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          {Icon && (
            <div className={cn('flex h-7 w-7 items-center justify-center rounded-md shrink-0', iconBg)}>
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        {technicalLabel && (
          <span className="text-[10px] text-slate-400 font-mono block -mt-0.5 mb-1">
            {technicalLabel}
          </span>
        )}

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {value}
          </span>
          {trend && (
            <span
              className={cn(
                'inline-flex items-center text-xs font-semibold',
                trend.isPositive ? 'text-emerald-600' : 'text-red-600'
              )}
            >
              {trend.direction === 'up' ? (
                <ArrowUpRight className="h-3.5 w-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 mr-0.5" />
              )}
              {trend.value}
            </span>
          )}
        </div>
      </div>

      {subtext && (
        <p className="mt-2 text-[11px] text-slate-500 line-clamp-1 border-t border-slate-100 pt-1.5">
          {subtext}
        </p>
      )}
    </Card>
  )
}

