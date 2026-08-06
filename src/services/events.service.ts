import { ENDPOINTS, getList, getOne, post } from '@/api'
import type { Paginated, Ulid } from '@/types/api'
import type { Event, EventListQuery, EventOccurrence, TicketType } from '@/types/event'

/**
 * Read access to the public event catalogue.
 *
 * Services are stateless: they map a call to an endpoint and return typed data.
 * Caching, loading flags and error display belong to stores and components.
 */
export const eventsService = {
  /** Paginated event list. The API paginates at 15 per page. */
  list(query: EventListQuery = {}, signal?: AbortSignal): Promise<Paginated<Event>> {
    return getList<Event>(ENDPOINTS.events.list, { params: query, signal })
  },

  /** Full detail of one event, relations included. */
  get(id: Ulid, signal?: AbortSignal): Promise<Event> {
    return getOne<Event>(ENDPOINTS.events.detail(id), { signal })
  },

  /** Ticket types on sale for an event, with prices and availability. */
  ticketTypes(eventId: Ulid, signal?: AbortSignal): Promise<Paginated<TicketType>> {
    return getList<TicketType>(ENDPOINTS.events.ticketTypes(eventId), { signal })
  },

  /** Dates of a recurring event. */
  occurrences(eventId: Ulid, signal?: AbortSignal): Promise<Paginated<EventOccurrence>> {
    return getList<EventOccurrence>(ENDPOINTS.events.occurrences(eventId), { signal })
  },

  /** Adds or removes the event from the signed-in user's favourites. */
  toggleFavorite(eventId: Ulid): Promise<{ favorited: boolean }> {
    return post<{ favorited: boolean }>(ENDPOINTS.events.favorite(eventId))
  },
}
