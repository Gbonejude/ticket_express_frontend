import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Order, Ticket } from '@/types/order'
import type { Event } from '@/types/event'

import { ordersService } from './orders.service'
import {
  displayStatus,
  isActive,
  pdfDownloadUrl,
  qrImageUrl,
  ticketsService,
  type TicketRow,
} from './tickets.service'

/**
 * "Mes billets" is assembled from `GET /orders`, because `GET /tickets` is a
 * back-office route a participant may not call. These cover the parts that
 * assembly gets wrong most easily: which orders carry tickets, what "expired"
 * means when the backend has no such status, and matching a QR to its ticket.
 */

const event = (overrides: Partial<Event> = {}): Event =>
  ({
    id: 'evt_1',
    title: 'Concert',
    startDate: { datetime: '2030-01-01T20:00:00Z', human: '', humanDiff: '' },
    endDate: { datetime: '2030-01-01T23:00:00Z', human: '', humanDiff: '' },
    ...overrides,
  }) as Event

const ticket = (overrides: Partial<Ticket> = {}): Ticket =>
  ({
    id: 'tk_1',
    orderId: 'ord_1',
    ticketNumber: 'TKT-1',
    status: 'valid',
    ticketType: { id: 'tt_1', name: 'VIP', event: event() },
    ...overrides,
  }) as Ticket

const order = (overrides: Partial<Order> = {}): Order =>
  ({
    id: 'ord_1',
    orderNumber: 'TX-1',
    status: 'paid',
    tickets: [ticket()],
    items: [{ id: 'it_1', ticketTypeId: 'tt_1', ticketType: { id: 'tt_1', event: event() } }],
    downloads: null,
    ...overrides,
  }) as Order

function mockOrders(orders: Order[]): void {
  vi.spyOn(ordersService, 'list').mockResolvedValue({
    items: orders,
    meta: { current_page: 1, per_page: 15, total: orders.length, last_page: 1, from: 1, to: 1 },
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('ticketsService.list', () => {
  it('returns the tickets of paid orders with their event resolved', async () => {
    mockOrders([order()])

    const rows = await ticketsService.list()

    expect(rows).toHaveLength(1)
    expect(rows[0]!.ticket.ticketNumber).toBe('TKT-1')
    expect(rows[0]!.event?.title).toBe('Concert')
  })

  it('ignores orders that are not paid, which carry no issued ticket', async () => {
    mockOrders([order({ status: 'pending', tickets: [] }), order({ status: 'cancelled' })])

    await expect(ticketsService.list()).resolves.toEqual([])
  })

  it('walks every page of orders', async () => {
    vi.spyOn(ordersService, 'list').mockImplementation(async (query) => ({
      items: [order({ id: `ord_${query?.page ?? 1}` })],
      meta: { current_page: query?.page ?? 1, per_page: 15, total: 3, last_page: 3, from: 1, to: 1 },
    }))

    await expect(ticketsService.list()).resolves.toHaveLength(3)
  })
})

describe('ticketsService.overview', () => {
  it('returns issued tickets and unpaid orders from a single pass', async () => {
    mockOrders([order({ id: 'ord_2', status: 'pending', tickets: [] }), order()])

    const { rows, pending } = await ticketsService.overview()

    expect(pending).toHaveLength(1)
    expect(pending[0]!.order.id).toBe('ord_2')
    expect(pending[0]!.event?.title).toBe('Concert')
    expect(rows).toHaveLength(1)
  })

  it('walks the order pages once, not twice', async () => {
    mockOrders([order()])

    await ticketsService.overview()

    // Fetching tickets and pending orders separately used to page through the
    // whole list twice.
    expect(ordersService.list).toHaveBeenCalledTimes(1)
  })

  it('fetches the remaining pages in parallel', async () => {
    let inFlight = 0
    let peak = 0

    vi.spyOn(ordersService, 'list').mockImplementation(async (query) => {
      inFlight += 1
      peak = Math.max(peak, inFlight)

      await new Promise((resolve) => setTimeout(resolve, 5))
      inFlight -= 1

      return {
        items: [order({ id: `ord_${query?.page ?? 1}` })],
        meta: {
          current_page: query?.page ?? 1,
          per_page: 15,
          total: 4,
          last_page: 4,
          from: 1,
          to: 1,
        },
      }
    })

    await ticketsService.overview()

    // Page 1 alone, then pages 2-4 together.
    expect(peak).toBeGreaterThan(1)
  })
})

describe('displayStatus', () => {
  const row = (t: Ticket, e: Event | null): TicketRow => ({ ticket: t, order: order(), event: e })

  it('reports a valid ticket for a future event as valid', () => {
    expect(displayStatus(row(ticket(), event()))).toBe('valid')
    expect(isActive(row(ticket(), event()))).toBe(true)
  })

  it('derives "expired" from the event having ended, which no API field carries', () => {
    const past = event({
      startDate: { datetime: '2020-01-01T20:00:00Z', human: '', humanDiff: '' },
      endDate: { datetime: '2020-01-01T23:00:00Z', human: '', humanDiff: '' },
    })

    expect(displayStatus(row(ticket(), past))).toBe('expired')
    expect(isActive(row(ticket(), past))).toBe(false)
  })

  it('keeps the backend status when it is not valid, even for a past event', () => {
    const past = event({
      endDate: { datetime: '2020-01-01T23:00:00Z', human: '', humanDiff: '' },
    })

    expect(displayStatus(row(ticket({ status: 'refunded' }), past))).toBe('refunded')
  })

  it('does not expire a ticket whose event has no date', () => {
    expect(displayStatus(row(ticket(), event({ startDate: null, endDate: null })))).toBe('valid')
  })
})

describe('qrImageUrl', () => {
  it('matches the URL on the ticket id rather than on array order', () => {
    const withDownloads = order({
      downloads: {
        downloadUrl: 'https://api.test/api/v1/tickets/download/tok',
        qrImageUrls: [
          'https://api.test/api/v1/tickets/qr/tok/tk_9',
          'https://api.test/api/v1/tickets/qr/tok/tk_1',
        ],
        whatsappLink: null,
        expiresAt: null,
        downloadCount: 0,
        maxDownloads: 5,
        isValid: true,
        isExpired: false,
      },
    })

    const row: TicketRow = { ticket: ticket(), order: withDownloads, event: event() }

    expect(qrImageUrl(row)).toBe('https://api.test/api/v1/tickets/qr/tok/tk_1')
  })

  it('returns null when the order carries no download link', () => {
    expect(qrImageUrl({ ticket: ticket(), order: order(), event: event() })).toBeNull()
  })
})

describe('pdfDownloadUrl', () => {
  it('returns null once the link is no longer valid', () => {
    const spent = order({
      downloads: {
        downloadUrl: 'https://api.test/api/v1/tickets/download/tok',
        qrImageUrls: [],
        whatsappLink: null,
        expiresAt: null,
        downloadCount: 5,
        maxDownloads: 5,
        isValid: false,
        isExpired: true,
      },
    })

    expect(pdfDownloadUrl(spent)).toBeNull()
  })
})
