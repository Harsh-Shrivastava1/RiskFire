/**
 * Formats a number into Indian Rupee representation (e.g. ₹24,00,000 or ₹11.8L)
 */
export function formatCurrencyINR(amount: number, compact: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '₹0'
  }

  if (compact) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`
    }
    if (Math.abs(amount) >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    }
    if (Math.abs(amount) >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatCurrency = formatCurrencyINR

/**
 * Formats ratio into clean percentage (e.g. 0.942 -> "94.2%" or 94.2 -> "94.2%")
 */
export function formatPercentage(value: number, isDecimal: boolean = false, decimals: number = 1): string {
  if (isNaN(value) || value === null || value === undefined) {
    return '0.0%'
  }
  const pct = isDecimal ? value * 100 : value
  return `${pct.toFixed(decimals)}%`
}

/**
 * Formats numbers with locale separators
 */
export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) {
    return '0'
  }
  return new Intl.NumberFormat('en-IN').format(num)
}

/**
 * Formats timestamps into readable strings
 */
export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  try {
    const d = new Date(dateStr)
    return d.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return dateStr
  }
}

export const formatDate = formatDateTime

/**
 * Formats relative or short duration
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const minutes = Math.floor(seconds / 60)
  const remSec = Math.round(seconds % 60)
  if (minutes < 60) {
    return `${minutes}m ${remSec}s`
  }
  const hours = Math.floor(minutes / 60)
  const remMin = minutes % 60
  return `${hours}h ${remMin}m`
}
