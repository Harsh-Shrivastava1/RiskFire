import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load operational data',
  message = 'An error occurred while evaluating the simulation or repository stream. Please retry.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-lg border border-red-200 bg-red-50/30 p-8 text-center ${
        className || ''
      }`}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 mb-3">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-red-900">{title}</h3>
      <p className="mt-1 text-xs text-red-700 max-w-sm">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-4 text-xs gap-1.5 border-red-200 hover:bg-red-50 text-red-800"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Request</span>
        </Button>
      )}
    </div>
  )
}
