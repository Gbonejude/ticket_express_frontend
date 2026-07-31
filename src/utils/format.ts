import { APP_CONFIG } from '@/constants/app'
import type { ApiDate } from '@/types/api'

/**
 * Display formatting for prices, dates and numbers.
 *
 * `Intl` formatters are expensive to build, so each one is created once and
 * reused.
 */

const currencyFormatter = new Intl.NumberFormat(APP_CONFIG.locale, {
  style: 'currency',
  currency: APP_CONFIG.currency,
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat(APP_CONFIG.locale)

/** Formats an amount in the configured currency, e.g. `5 000 FCFA`. */
export function formatPrice(amount: number | string | null | undefined): string {
  const value = typeof amount === 'string' ? Number(amount) : amount

  if (value === null || value === undefined || Number.isNaN(value)) return '—'

  return currencyFormatter.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—'

  return numberFormatter.format(value)
}

/**
 * Reads an API date object for display.
 *
 * The API sends `{ datetime, human, humanDiff }`, so `human` is used as-is and
 * is already localised server-side.
 */
export function formatDate(date: ApiDate | null | undefined): string {
  return date?.human ?? '—'
}

/** Relative label, e.g. "dans 3 jours". */
export function formatRelativeDate(date: ApiDate | null | undefined): string {
  return date?.humanDiff ?? '—'
}

/**
 * Converts an API date to the value expected by `<input type="datetime-local">`.
 * The input requires `YYYY-MM-DDTHH:mm` exactly, with no seconds or timezone.
 */
export function toDateTimeLocal(date: ApiDate | null | undefined): string {
  return date?.datetime.slice(0, 16) ?? ''
}

/** Shortens text to `max` characters on a word boundary. */
export function truncate(text: string | null | undefined, max = 140): string {
  if (!text) return ''
  if (text.length <= max) return text

  const cut = text.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')

  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`
}
