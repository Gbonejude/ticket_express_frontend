import { describe, expect, it } from 'vitest'

import type { ApiDate } from '@/types/api'

import {
  formatDate,
  formatNumber,
  formatPrice,
  formatRelativeDate,
  toDateTimeLocal,
  truncate,
} from './format'

const apiDate: ApiDate = {
  datetime: '2026-08-15T20:30:00.000000Z',
  human: '15 août 2026 20:30',
  humanDiff: 'dans 2 semaines',
}

describe('formatPrice', () => {
  it('formats a number in the configured currency', () => {
    // Intl inserts narrow no-break spaces; assert on content, not spacing.
    expect(formatPrice(5000)).toMatch(/5.?000/)
    expect(formatPrice(5000)).toMatch(/XOF|F\s?CFA/)
  })

  it('accepts a numeric string, since the API sends decimals as strings', () => {
    expect(formatPrice('5000')).toMatch(/5.?000/)
  })

  it('renders a dash for null, undefined and NaN', () => {
    expect(formatPrice(null)).toBe('—')
    expect(formatPrice(undefined)).toBe('—')
    expect(formatPrice('not a number')).toBe('—')
  })

  it('formats zero as a price, not as a dash', () => {
    expect(formatPrice(0)).toMatch(/0/)
  })
})

describe('formatNumber', () => {
  it('groups thousands', () => {
    expect(formatNumber(1234567)).toMatch(/1.?234.?567/)
  })

  it('renders a dash when there is no value', () => {
    expect(formatNumber(null)).toBe('—')
    expect(formatNumber(undefined)).toBe('—')
  })
})

describe('formatDate', () => {
  it('uses the localised label from the API', () => {
    expect(formatDate(apiDate)).toBe('15 août 2026 20:30')
  })

  it('renders a dash when the date is absent', () => {
    expect(formatDate(null)).toBe('—')
  })
})

describe('formatRelativeDate', () => {
  it('uses the relative label from the API', () => {
    expect(formatRelativeDate(apiDate)).toBe('dans 2 semaines')
  })

  it('renders a dash when the date is absent', () => {
    expect(formatRelativeDate(undefined)).toBe('—')
  })
})

describe('toDateTimeLocal', () => {
  it('trims to the format a datetime-local input accepts', () => {
    expect(toDateTimeLocal(apiDate)).toBe('2026-08-15T20:30')
  })

  it('returns an empty string when the date is absent', () => {
    expect(toDateTimeLocal(null)).toBe('')
  })
})

describe('truncate', () => {
  it('leaves short text untouched', () => {
    expect(truncate('Concert', 20)).toBe('Concert')
  })

  it('cuts on a word boundary and appends an ellipsis', () => {
    expect(truncate('Concert de musique traditionnelle', 15)).toBe('Concert de…')
  })

  it('cuts mid-word when there is no space to fall back on', () => {
    expect(truncate('Supercalifragilistic', 10)).toBe('Supercalif…')
  })

  it('returns an empty string for empty input', () => {
    expect(truncate(null)).toBe('')
    expect(truncate(undefined)).toBe('')
    expect(truncate('')).toBe('')
  })
})
