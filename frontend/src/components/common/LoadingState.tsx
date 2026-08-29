import React from 'react'
import { Skeleton } from '@/components/ui/skeleton'

interface LoadingStateProps {
  rows?: number
  type?: 'table' | 'cards' | 'chart' | 'detail'
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  rows = 4,
  type = 'table',
  className,
}) => {
  if (type === 'cards') {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className || ''}`}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-48" />
          </div>
        ))}
      </div>
    )
  }

  if (type === 'chart') {
    return (
      <div className={`rounded-lg border border-slate-200 bg-white p-6 space-y-4 ${className || ''}`}>
        <div className="flex justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className={`rounded-lg border border-slate-200 bg-white p-4 space-y-3 ${className || ''}`}>
      <div className="flex justify-between items-center mb-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-2 border-b border-slate-100 last:border-0">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6 ml-auto" />
        </div>
      ))}
    </div>
  )
}
