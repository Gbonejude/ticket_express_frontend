import type { ApiDate, PaginationMeta, Paginated } from '@/types/api'

/**
 * Small builders shared by the fixtures.
 *
 * They exist so the mock data has exactly the shape the API returns — dates as
 * `{ datetime, human, humanDiff }`, lists wrapped in `{ items, meta }` — and a
 * page written against the mocks keeps working unchanged once the real
 * endpoints are plugged in.
 */

const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const relativeFormatter = new Intl.RelativeTimeFormat('fr-FR', { numeric: 'auto' })

/** Builds the API's date object from an ISO string. */
export function apiDate(iso: string): ApiDate {
  const date = new Date(iso)
  const days = Math.round((date.getTime() - Date.now()) / 86_400_000)

  return {
    datetime: date.toISOString(),
    human: dateFormatter.format(date),
    humanDiff:
      Math.abs(days) > 30
        ? relativeFormatter.format(Math.round(days / 30), 'month')
        : relativeFormatter.format(days, 'day'),
  }
}

/** ISO string for a date `days` from now, at the given local time. */
export function inDays(days: number, hours = 20, minutes = 0): string {
  const date = new Date()

  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)

  return date.toISOString()
}

/** Wraps a slice of items in the pagination envelope the services return. */
export function paginate<T>(all: T[], page = 1, perPage = 15): Paginated<T> {
  const start = (page - 1) * perPage
  const items = all.slice(start, start + perPage)

  const meta: PaginationMeta = {
    current_page: page,
    per_page: perPage,
    total: all.length,
    last_page: Math.max(1, Math.ceil(all.length / perPage)),
    from: all.length ? start + 1 : null,
    to: all.length ? start + items.length : null,
  }

  return { items, meta }
}

/**
 * Resolves after a short, slightly random delay.
 *
 * Without it every mock resolves synchronously, loading states never render and
 * skeletons go untested — so the first real API call becomes the first time
 * anyone sees the page mid-flight.
 */
export function withLatency<T>(value: T, ms = 220): Promise<T> {
  const jitter = ms + Math.random() * 180

  return new Promise((resolve) => {
    setTimeout(() => resolve(value), jitter)
  })
}
