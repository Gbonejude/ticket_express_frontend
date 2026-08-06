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

/**
 * Formats an amount in the configured currency, e.g. `5 000 FCFA`.
 *
 * `Intl` spells XOF as « F CFA »; the mockups and local usage write « FCFA »,
 * so the space inside the symbol is closed up. The thousands separator — a
 * narrow no-break space in French — is left alone.
 */
export function formatPrice(amount: number | string | null | undefined): string {
  const value = typeof amount === 'string' ? Number(amount) : amount

  if (value === null || value === undefined || Number.isNaN(value)) return '—'

  return currencyFormatter.format(value).replace(/F\s*CFA/u, 'FCFA')
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

const relativeFormatter = new Intl.RelativeTimeFormat(APP_CONFIG.locale, { numeric: 'auto' })

/**
 * Relative label built from a bare ISO string, e.g. "il y a 2 jours".
 *
 * `formatRelativeDate` reads the API's own `humanDiff`, which only exists on a
 * full `ApiDate`. Some values reach the UI as plain ISO strings — a date picked
 * out of a list and compared client-side — and those are formatted here.
 */
export function formatRelativeFromIso(iso: string | null | undefined): string {
  if (!iso) return '—'

  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000)

  if (Math.abs(days) >= 30) return relativeFormatter.format(Math.round(days / 30), 'month')

  return relativeFormatter.format(days, 'day')
}

const scheduleDateFormatter = new Intl.DateTimeFormat(APP_CONFIG.locale, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

const scheduleTimeFormatter = new Intl.DateTimeFormat(APP_CONFIG.locale, {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
})

/**
 * Date and time of an event, as the cards show it: `sam. 5 déc. 2026 | 20h00`.
 *
 * The time is rendered in UTC rather than in the visitor's own zone: a ticket
 * is valid at the venue's local time, and Togo is on GMT year-round, so UTC
 * *is* the local time. Showing a traveller's device time would be actively
 * misleading. The zone is not spelled out — everyone reading this is on it.
 *
 * `human` from the API is not used here because it carries no time.
 */
export function formatEventSchedule(date: ApiDate | null | undefined): string {
  if (!date) return '—'

  const value = new Date(date.datetime)
  const day = scheduleDateFormatter.format(value)
  const time = scheduleTimeFormatter.format(value).replace(':', 'h')

  return `${day} | ${time}`
}

/**
 * Time of day alone, e.g. `14h32`.
 *
 * Read on the same clock as `formatEventSchedule`: UTC, which is Togo's time
 * all year.
 */
export function formatTime(date: ApiDate | null | undefined): string {
  if (!date) return '—'

  return scheduleTimeFormatter.format(new Date(date.datetime)).replace(':', 'h')
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
