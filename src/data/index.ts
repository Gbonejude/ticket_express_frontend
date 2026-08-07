import { EVENT_FAQ, type FaqEntry } from '@/constants/faq'
import {
  catalogService,
  contactService,
  eventsService,
  isActive,
  ordersService,
  organizersService,
  paymentsService,
  ticketsService,
} from '@/services'
import { useFavoritesStore } from '@/stores/favorites.store'
import type { Paginated, Ulid } from '@/types/api'
import type { ContactMessagePayload } from '@/types/contact'
import type { Event, EventCategory, EventListQuery, Organizer } from '@/types/event'
import type { OrderListQuery } from '@/services/orders.service'
import type { CreateOrderPayload, InitiatePaymentPayload, Order, Payment } from '@/types/order'

/**
 * The single seam between the pages and where their data comes from.
 *
 * Pages import `dataSource` and nothing else — never a service, never a store.
 * That is what kept the API phase a change to this file rather than a change to
 * every screen: the mock that used to sit here exposed exactly these
 * signatures, so no page had to be rewritten when the backend arrived.
 *
 * What this layer is allowed to do is compose. `orders.history` resolves each
 * order's event from the payload the API already sends, and `events.related`
 * turns "same category, minus this one" into a filtered list request. What it
 * must not do is filter or sort a page of results client-side to fake a query
 * the API cannot answer — that reads as working until the second page loads.
 */

/** An order resolved with the event it belongs to, for the purchase history. */
export interface OrderRow {
  order: Order
  /** Null when the order's ticket type no longer resolves to an event. */
  event: Event | null
}

/** Figures behind the account dashboard. */
export interface DashboardSummary {
  ticketsCount: number
  upcomingCount: number
  favoritesCount: number
  upcoming: Event[]
  favorites: Event[]
  /** ISO date of the most recent order, or null if there is none. */
  lastOrderAt: string | null
}

/**
 * The event an order is for.
 *
 * An order can only hold ticket types of a single event, so the first item
 * decides. The relation is eager-loaded by `GET /orders`, which is why this
 * costs no request.
 */
function eventOfOrder(order: Order): Event | null {
  return order.items?.[0]?.ticketType?.event ?? null
}

function startsAt(event: Event): number {
  return event.startDate ? new Date(event.startDate.datetime).getTime() : 0
}

export const dataSource = {
  events: {
    /** Paginated catalogue. Every filter below is applied by the API. */
    list(query: EventListQuery = {}, signal?: AbortSignal): Promise<Paginated<Event>> {
      return eventsService.list(query, signal)
    },

    get(id: Ulid, signal?: AbortSignal): Promise<Event> {
      return eventsService.get(id, signal)
    },

    /**
     * Same category, excluding the event itself.
     *
     * Takes the category rather than looking it up: the only caller is the
     * event page, which already holds the loaded event. Re-fetching it here
     * doubled the requests that page makes for nothing.
     *
     * Asks for one more than needed so the row still fills up after the
     * current event is removed from the results.
     */
    async related(
      event: Pick<Event, 'id' | 'categoryId'>,
      limit = 4,
      signal?: AbortSignal,
    ): Promise<Event[]> {
      const { items } = await eventsService.list(
        {
          category_id: event.categoryId,
          when: 'upcoming',
          status: 'published',
          per_page: limit + 1,
        },
        signal,
      )

      return items.filter((entry) => entry.id !== event.id).slice(0, limit)
    },

    /** Editorial copy — see `constants/faq`. The API has no FAQ endpoint. */
    faq(): Promise<FaqEntry[]> {
      return Promise.resolve([...EVENT_FAQ])
    },

    ticketTypes(eventId: Ulid, signal?: AbortSignal) {
      return eventsService.ticketTypes(eventId, signal)
    },
  },

  categories: {
    async list(signal?: AbortSignal): Promise<EventCategory[]> {
      const { items } = await catalogService.categories(signal)

      return items
    },
  },

  organizers: {
    get(id: Ulid, signal?: AbortSignal): Promise<Organizer> {
      return organizersService.get(id, signal)
    },

    events(id: Ulid, signal?: AbortSignal): Promise<{ upcoming: Event[] }> {
      return organizersService.events(id, signal)
    },

    async featured(limit = 6, signal?: AbortSignal): Promise<Organizer[]> {
      const { items } = await organizersService.list(1, signal)

      return items.slice(0, limit)
    },
  },

  // Favourites are deliberately absent from this seam: they are shared,
  // reactive state (every mounted card must agree on the same heart) and they
  // need a synchronous `has()` on first paint. That is a store's job, so pages
  // use `useFavoritesStore()` directly — the same way they already use the auth
  // and UI stores. Routing them through here too would mean two sources of
  // truth for one set of ids.

  orders: {
    list(query: OrderListQuery = {}, signal?: AbortSignal): Promise<Paginated<Order>> {
      return ordersService.list(query, signal)
    },

    /** Orders with the event they belong to, for the history table. */
    async history(query: OrderListQuery = {}, signal?: AbortSignal): Promise<Paginated<OrderRow>> {
      const { items, meta } = await ordersService.list(query, signal)

      return {
        items: items.map((order) => ({ order, event: eventOfOrder(order) })),
        meta,
      }
    },

    get(id: Ulid, signal?: AbortSignal): Promise<Order> {
      return ordersService.get(id, signal)
    },

    create(payload: CreateOrderPayload): Promise<Order> {
      return ordersService.create(payload)
    },

    cancel(id: Ulid): Promise<Order> {
      return ordersService.cancel(id)
    },
  },

  contact: {
    send(payload: ContactMessagePayload, signal?: AbortSignal): Promise<string> {
      return contactService.send(payload, signal)
    },
  },

  payments: {
    initiate(payload: InitiatePaymentPayload): Promise<Payment> {
      return paymentsService.initiate(payload)
    },

    status(paymentId: Ulid, signal?: AbortSignal): Promise<Payment> {
      return paymentsService.status(paymentId, signal)
    },
  },

  tickets: {
    /** Every ticket the visitor owns; screens split it with `isActive`. */
    list: ticketsService.list,
    /** Issued tickets and unpaid orders together, in a single pass. */
    overview: ticketsService.overview,
    get: ticketsService.get,
  },

  account: {
    /**
     * Figures for the account dashboard.
     *
     * Composed from the visitor's tickets and favourites; there is no
     * dashboard endpoint, and inventing one client-side is cheaper than the
     * round-trip it would save. Loyalty points, which the mock used to show,
     * are gone: nothing in the backend tracks them.
     */
    async dashboard(signal?: AbortSignal): Promise<DashboardSummary> {
      const favoritesStore = useFavoritesStore()

      const [tickets] = await Promise.all([
        ticketsService.list(signal),
        favoritesStore.load(true),
      ])

      // `isActive`, not `status === 'valid'`: a ticket for an event that has
      // already happened keeps that status, and counting it under "Billets
      // actifs" would overstate what the visitor can still use.
      const active = tickets.filter(isActive)
      const now = Date.now()

      const upcoming = [
        ...new Map(
          active
            .map((row) => row.event)
            .filter((event): event is Event => Boolean(event) && startsAt(event!) >= now)
            .map((event) => [event.id, event]),
        ).values(),
      ].sort((a, b) => startsAt(a) - startsAt(b))

      const lastOrder = tickets
        .map((row) => row.order.createdAt?.datetime)
        .filter((date): date is string => Boolean(date))
        .sort((a, b) => b.localeCompare(a))[0]

      return {
        ticketsCount: active.length,
        upcomingCount: upcoming.length,
        favoritesCount: favoritesStore.count,
        upcoming: upcoming.slice(0, 2),
        favorites: favoritesStore.events.slice(0, 2),
        lastOrderAt: lastOrder ?? null,
      }
    },
  },
}

export type DataSource = typeof dataSource

/** Re-exported so pages keep importing their sorting type from the seam. */
export type { EventSort } from '@/types/event'
export type { TicketRow } from '@/services'
