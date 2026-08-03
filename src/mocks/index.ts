import type { Paginated, Ulid } from '@/types/api'
import type { Event, EventCategory, EventListQuery, Organizer } from '@/types/event'
import type { ContactMessagePayload } from '@/types/contact'
import type {
  CreateOrderPayload,
  InitiatePaymentPayload,
  Order,
  Payment,
  Ticket,
} from '@/types/order'

import {
  categories,
  currentUser,
  eventOfOrder,
  eventFaq,
  events,
  favoriteEventIds,
  featuredEventIds,
  orders,
  organizers,
  recentActivity,
  type ActivityEntry,
} from './fixtures'
import { paginate, withLatency } from './helpers'

/**
 * In-memory implementation of the data the pages need.
 *
 * Every function mirrors the signature of the service that will replace it, so
 * swapping the binding in `src/data/index.ts` is the only change required when
 * the API is ready — no page is touched.
 *
 * Filtering and pagination are done here rather than in the pages on purpose:
 * the real endpoints filter server-side, and a page that sorts its own array
 * would have to be rewritten later.
 */

/** Favourites are mutated in place so a toggle survives navigation. */
const favorites = new Set(favoriteEventIds)

function matchesQuery(event: Event, query: EventListQuery): boolean {
  const search = String(query.search ?? '')
    .trim()
    .toLowerCase()

  if (search) {
    const haystack = [
      event.title,
      event.description,
      event.venue?.city,
      event.organizer?.companyName,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()

    if (!haystack.includes(search)) return false
  }

  if (query.category_id && event.categoryId !== query.category_id) return false

  const city = String(query.city ?? '')
    .trim()
    .toLowerCase()

  if (city && !event.venue?.city?.toLowerCase().includes(city)) return false

  return true
}

export type EventSort = 'recent' | 'price-asc' | 'price-desc'

function cheapest(event: Event): number {
  const prices = (event.ticketTypes ?? []).map((type) => type.currentPrice)

  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY
}

function sortEvents(list: Event[], sort: EventSort): Event[] {
  const sorted = [...list]

  if (sort === 'price-asc') return sorted.sort((a, b) => cheapest(a) - cheapest(b))
  if (sort === 'price-desc') return sorted.sort((a, b) => cheapest(b) - cheapest(a))

  return sorted.sort((a, b) => {
    const left = a.startDate?.datetime ?? ''
    const right = b.startDate?.datetime ?? ''

    return left.localeCompare(right)
  })
}

/** A ticket, resolved with the order and event it belongs to. */
export interface TicketRow {
  ticket: Ticket
  order: Order
  event: Event
}

/** An order resolved with its event, for the purchase history. */
export interface OrderRow {
  order: Order
  event: Event
}

function ticketRows(): TicketRow[] {
  return orders
    .filter((order) => order.status === 'paid')
    .flatMap((order) =>
      (order.tickets ?? []).map((ticket) => ({ ticket, order, event: eventOfOrder(order) })),
    )
}

export interface DashboardSummary {
  ticketsCount: number
  upcomingCount: number
  loyaltyPoints: number
  upcoming: Event[]
  favorites: Event[]
  activity: ActivityEntry[]
}

export const mockApi = {
  events: {
    list(
      query: EventListQuery & { sort?: EventSort; city?: string } = {},
    ): Promise<Paginated<Event>> {
      const filtered = events.filter((event) => matchesQuery(event, query))
      const sorted = sortEvents(filtered, (query.sort as EventSort) ?? 'recent')

      return withLatency(paginate(sorted, Number(query.page ?? 1), 9))
    },

    featured(): Promise<Event[]> {
      const list = featuredEventIds
        .map((id) => events.find((event) => event.id === id))
        .filter((event): event is Event => Boolean(event))

      return withLatency(list)
    },

    get(id: Ulid): Promise<Event> {
      const event = events.find((entry) => entry.id === id)

      // Mirrors the API: an unknown id is a 404, not an empty page.
      if (!event) return Promise.reject(new Error(`Événement introuvable : ${id}`))

      return withLatency(event)
    },

    /**
     * Same category, excluding the event itself.
     * Falls back to the newest events so the row is never empty on a category
     * that holds a single event.
     */
    related(id: Ulid, limit = 4): Promise<Event[]> {
      const event = events.find((entry) => entry.id === id)
      const sameCategory = events.filter(
        (entry) => entry.id !== id && entry.categoryId === event?.categoryId,
      )
      const filler = events.filter((entry) => entry.id !== id && !sameCategory.includes(entry))

      return withLatency([...sameCategory, ...filler].slice(0, limit))
    },

    /** Static for now — the API exposes no per-event FAQ yet. */
    faq(): Promise<typeof eventFaq> {
      return withLatency(eventFaq)
    },
  },

  categories: {
    list(): Promise<EventCategory[]> {
      return withLatency(categories)
    },
  },

  organizers: {
    /** Promoted on the home page; the API will order these server-side. */
    featured(limit = 6): Promise<Organizer[]> {
      return withLatency(organizers.slice(0, limit))
    },

    get(id: Ulid): Promise<Organizer> {
      const organizer = organizers.find((entry) => entry.id === id)

      if (!organizer) return Promise.reject(new Error(`Organisateur introuvable : ${id}`))

      return withLatency(organizer)
    },

    /**
     * Everything this organiser puts on sale, split by whether it has happened.
     *
     * The profile shows both counts in its tabs, so one call returns both
     * rather than two round-trips that could disagree with each other.
     */
    events(id: Ulid): Promise<{ upcoming: Event[]; past: Event[] }> {
      const now = Date.now()
      const mine = events.filter((event) => event.organizerId === id)
      const startsAt = (event: Event) =>
        event.startDate ? new Date(event.startDate.datetime).getTime() : 0

      return withLatency({
        upcoming: mine.filter((e) => startsAt(e) >= now).sort((a, b) => startsAt(a) - startsAt(b)),
        past: mine.filter((e) => startsAt(e) < now).sort((a, b) => startsAt(b) - startsAt(a)),
      })
    },
  },

  favorites: {
    list(): Promise<Event[]> {
      return withLatency(events.filter((event) => favorites.has(event.id)))
    },

    has(id: Ulid): boolean {
      return favorites.has(id)
    },

    toggle(id: Ulid): Promise<{ favorited: boolean }> {
      const favorited = !favorites.has(id)

      if (favorited) favorites.add(id)
      else favorites.delete(id)

      return withLatency({ favorited }, 120)
    },
  },

  orders: {
    list(page = 1): Promise<Paginated<Order>> {
      return withLatency(paginate(orders, page, 5))
    },

    /**
     * Orders with the event they belong to, for the history table.
     *
     * The API's `Order` only reaches the event through `items[].ticketType`;
     * resolving it per row would be one request each. A real endpoint would
     * eager-load it, which is what this mirrors.
     */
    history(page = 1): Promise<Paginated<OrderRow>> {
      const rows = orders.map((order) => ({ order, event: eventOfOrder(order) }))

      return withLatency(paginate(rows, page, 5))
    },

    get(id: Ulid): Promise<Order> {
      const order = orders.find((entry) => entry.id === id)

      if (!order) return Promise.reject(new Error(`Commande introuvable : ${id}`))

      return withLatency(order)
    },

    /** Accepts the real payload shape so the page builds a valid body today. */
    create(payload: CreateOrderPayload): Promise<Order> {
      const first = orders[0]!

      return withLatency(
        {
          ...first,
          id: `ord_${Date.now()}`,
          orderNumber: `TX-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`,
          firstName: payload.first_name,
          lastName: payload.last_name,
          fullName: `${payload.first_name} ${payload.last_name}`,
          email: payload.email,
          phone: payload.phone,
          status: 'paid',
          statusLabel: 'Payée',
        },
        900,
      )
    },
  },

  contact: {
    /**
     * Mirrors `POST /contact`. The real endpoint is what sends the e-mail —
     * nothing here can, and pretending otherwise would hide a missing route.
     */
    send(payload: ContactMessagePayload): Promise<string> {
      if (!payload.email.trim() || !payload.message.trim()) {
        return Promise.reject(new Error('Message incomplet.'))
      }

      return withLatency('Message envoyé. Notre équipe vous répondra rapidement.', 600)
    },
  },

  payments: {
    /**
     * Mirrors `POST /payments/initiate`.
     *
     * PayGate is asked for the operator and the number to debit, and answers
     * with a pending payment the front then polls. The mock settles it
     * straight away — the shape is what matters here, not the wait.
     */
    initiate(payload: InitiatePaymentPayload): Promise<Payment> {
      return withLatency(
        {
          id: `pay_${Date.now()}`,
          orderId: payload.order_id,
          amount: 0,
          method: payload.method,
          methodLabel: payload.method === 'FLOOZ' ? 'Moov Money' : 'Mixx by Yas',
          transactionReference: `PG-${Math.floor(Math.random() * 9_000_000) + 1_000_000}`,
          status: 'success',
          statusLabel: 'Réussi',
          paidAt: null,
        },
        600,
      )
    },
  },

  tickets: {
    /** Flattens the tickets of every paid order. */
    list(): Promise<TicketRow[]> {
      return withLatency(ticketRows())
    },

    /** One ticket with the order and event it belongs to. */
    get(id: Ulid): Promise<TicketRow> {
      const row = ticketRows().find((entry) => entry.ticket.id === id)

      if (!row) return Promise.reject(new Error(`Billet introuvable : ${id}`))

      return withLatency(row)
    },
  },

  account: {
    profile() {
      return withLatency(currentUser)
    },

    dashboard(): Promise<DashboardSummary> {
      const paid = orders.filter((order) => order.status === 'paid')
      const upcoming = events
        .filter((event) => (event.startDate?.datetime ?? '') > new Date().toISOString())
        .slice(0, 2)

      return withLatency({
        ticketsCount: paid.reduce((total, order) => total + (order.ticketsCount ?? 0), 0),
        upcomingCount: upcoming.length,
        loyaltyPoints: 1250,
        upcoming,
        favorites: events.filter((event) => favorites.has(event.id)).slice(0, 2),
        activity: recentActivity,
      })
    },
  },
}

export type MockApi = typeof mockApi
