import React from 'react'
import { Button } from '@/components/ui/button'
import { FolderSearch, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmptyStateProps {
  title?: string
  description?: string
  suggestion?: string
  icon?: React.ElementType
  actionLabel?: string
  onAction?: () => void
  secondaryActionLabel?: string
  onSecondaryAction?: () => void
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'No items match your active filters or criteria.',
  suggestion,
  icon: Icon = FolderSearch,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/60 p-8 text-center',
        className
      )}
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500 mb-3.5 shadow-2xs border border-slate-200">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1.5 text-xs text-slate-500 max-w-md leading-relaxed">{description}</p>
      {suggestion && (
        <p className="mt-1 text-[11px] font-medium text-blue-700 max-w-md">
          {suggestion}
        </p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              size="sm"
              className="text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800 font-semibold"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onClick={onSecondaryAction}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}

