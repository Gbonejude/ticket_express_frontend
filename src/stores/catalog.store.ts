import { defineStore } from 'pinia'
import { ref } from 'vue'

import { catalogService, eventsService, organizersService } from '@/services'
import type { Event, EventCategory, Organizer, Venue } from '@/types/event'

/**
 * Reference data behind the search filters.
 *
 * Categories and venues change rarely and are requested by the header, the
 * home page and the search page alike. Caching them here means the filter bar
 * costs one request per session instead of one per navigation.
 */
export const useCatalogStore = defineStore('catalog', () => {
  // --- State ---
  const categories = ref<EventCategory[]>([])
  const venues = ref<Venue[]>([])
  const organizers = ref<Organizer[]>([])
  const isLoading = ref(false)

  const categoriesLoaded = ref(false)
  const venuesLoaded = ref(false)
  const organizersLoaded = ref(false)

  /** Shared between concurrent callers so a first paint fires one request. */
  let categoriesRequest: Promise<EventCategory[]> | null = null

  // --- Actions ---
  async function loadCategories(force = false): Promise<EventCategory[]> {
    if (categoriesLoaded.value && !force) return categories.value
    if (categoriesRequest && !force) return categoriesRequest

    isLoading.value = true

    categoriesRequest = catalogService
      .categories()
      .then(({ items }) => {
        categories.value = items
        categoriesLoaded.value = true

        return items
      })
      .finally(() => {
        isLoading.value = false
        categoriesRequest = null
      })

    return categoriesRequest
  }

  /**
   * The public organiser directory, held so the search can answer for them.
   *
   * Typing a promoter's name has to find the promoter, not only their events —
   * so the explore page matches this list in the browser, the same way it
   * matches the catalogue. One request per session: the directory is a handful
   * of rows and it changes when an administrator approves an application.
   */
  async function loadOrganizers(force = false): Promise<Organizer[]> {
    if (organizersLoaded.value && !force) return organizers.value

    const { items } = await organizersService.list()

    organizers.value = items
    organizersLoaded.value = true

    return items
  }

  async function loadVenues(force = false): Promise<Venue[]> {
    if (venuesLoaded.value && !force) return venues.value

    const { items } = await catalogService.venues()

    venues.value = items
    venuesLoaded.value = true

    return items
  }

  // --- Full catalogue (explore page) -----------------------------------------

  const events = ref<Event[]>([])
  const eventsLoaded = ref(false)
  const isLoadingEvents = ref(false)

  /** Past this, filtering in the browser stops being reasonable. */
  const MAX_CATALOGUE = 500

  let eventsRequest: Promise<Event[]> | null = null

  /**
   * Every upcoming published event, in one pass.
   *
   * The explore page filters, sorts and paginates in the browser so its
   * controls answer instantly instead of waiting on a request per keystroke.
   * That is only *correct* while the client holds the whole catalogue —
   * filtering a single page gives wrong results from page two onwards — so
   * everything is loaded here, and the cap says where the approach stops
   * holding. Past it the explore page must go back to server-side filtering;
   * `GET /events` still supports every filter it uses.
   */
  async function loadEvents(force = false): Promise<Event[]> {
    if (eventsLoaded.value && !force) return events.value
    if (eventsRequest && !force) return eventsRequest

    const perPage = 50
    const query = { per_page: perPage, when: 'upcoming', status: 'published', sort: 'date-asc' } as const

    isLoadingEvents.value = true

    eventsRequest = (async () => {
      const first = await eventsService.list({ ...query, page: 1 })
      const pages = Math.min(first.meta?.last_page ?? 1, Math.ceil(MAX_CATALOGUE / perPage))

      const rest =
        pages > 1
          ? await Promise.all(
              Array.from({ length: pages - 1 }, (_, index) =>
                eventsService.list({ ...query, page: index + 2 }),
              ),
            )
          : []

      events.value = [...first.items, ...rest.flatMap((page) => page.items)]
      eventsLoaded.value = true

      return events.value
    })().finally(() => {
      isLoadingEvents.value = false
      eventsRequest = null
    })

    return eventsRequest
  }

  /**
   * Drops the cached catalogue so the next visit refetches it.
   *
   * Call after anything that changes availability — a completed purchase, most
   * obviously. Without it the explore page would keep showing the stock it saw
   * when the tab was opened, and a sold-out tier would still read "disponible"
   * for the rest of the session.
   */
  function resetEvents(): void {
    events.value = []
    eventsLoaded.value = false
  }

  /**
   * Cities offered by the location filter.
   *
   * Derived from the venues rather than from a dedicated endpoint, because the
   * API has none — `city` is a column on `venues`, not a resource.
   */
  async function cities(): Promise<string[]> {
    const list = await loadVenues()
    const unique = new Set(
      list.map((venue) => venue.city).filter((city): city is string => Boolean(city)),
    )

    return [...unique].sort((a, b) => a.localeCompare(b, 'fr'))
  }

  return {
    categories,
    venues,
    organizers,
    events,
    isLoading,
    isLoadingEvents,
    categoriesLoaded,
    venuesLoaded,
    organizersLoaded,
    eventsLoaded,
    loadCategories,
    loadVenues,
    loadOrganizers,
    loadEvents,
    resetEvents,
    cities,
  }
})
