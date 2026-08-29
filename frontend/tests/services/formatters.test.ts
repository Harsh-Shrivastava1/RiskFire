import {
  formatCurrencyINR,
  formatPercentage,
  formatNumber,
  formatDateTime,
  formatDuration,
} from '../../src/utils/formatters'

export function runFormatterTests(): boolean {
  if (formatCurrencyINR(1180000, true) !== '₹11.8L') {
    throw new Error('formatCurrencyINR compact failed')
  }

  if (formatPercentage(0.942, true) !== '94.2%') {
    throw new Error('formatPercentage decimal failed')
  }

  if (formatNumber(3200) !== '3,200') {
    throw new Error('formatNumber failed')
  }

  if (formatDuration(150) !== '2m 30s') {
    throw new Error('formatDuration failed')
  }

  return true
}
