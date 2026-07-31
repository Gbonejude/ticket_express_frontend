import { ENDPOINTS, getList, getOne } from '@/api'
import type { Paginated, Ulid } from '@/types/api'
import type { EventCategory, Organizer, Venue } from '@/types/event'

/**
 * Reference data used to build search filters: categories, venues, organizers.
 * All three are public, read-only and change rarely.
 */
export const catalogService = {
  categories(signal?: AbortSignal): Promise<Paginated<EventCategory>> {
    return getList<EventCategory>(ENDPOINTS.categories.list, { signal })
  },

  category(id: Ulid, signal?: AbortSignal): Promise<EventCategory> {
    return getOne<EventCategory>(ENDPOINTS.categories.detail(id), { signal })
  },

  venues(signal?: AbortSignal): Promise<Paginated<Venue>> {
    return getList<Venue>(ENDPOINTS.venues.list, { signal })
  },

  venue(id: Ulid, signal?: AbortSignal): Promise<Venue> {
    return getOne<Venue>(ENDPOINTS.venues.detail(id), { signal })
  },

  organizers(signal?: AbortSignal): Promise<Paginated<Organizer>> {
    return getList<Organizer>(ENDPOINTS.organizers.list, { signal })
  },

  organizer(id: Ulid, signal?: AbortSignal): Promise<Organizer> {
    return getOne<Organizer>(ENDPOINTS.organizers.detail(id), { signal })
  },
}
