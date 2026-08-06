import { ENDPOINTS, getList, post } from '@/api'
import type { Paginated, Ulid } from '@/types/api'
import type { Event } from '@/types/event'

/** What `POST /events/{id}/favorite` answers with. */
export interface FavoriteToggleResult {
  favorited: boolean
  favoritesCount: number
}

/**
 * Favourite events of the signed-in visitor.
 *
 * Both routes require authentication — there is no anonymous favouriting, so
 * callers must check the session before offering the control.
 */
export const favoritesService = {
  /** The visitor's favourites, newest first. */
  list(page = 1, signal?: AbortSignal): Promise<Paginated<Event>> {
    return getList<Event>(ENDPOINTS.favorites.list, { params: { page }, signal })
  },

  /**
   * Adds or removes the event, and reports which way it went.
   *
   * The endpoint is a single toggle rather than a pair of add/remove routes,
   * so the answer — not the request — is what tells you the new state.
   */
  toggle(eventId: Ulid): Promise<FavoriteToggleResult> {
    return post<FavoriteToggleResult>(ENDPOINTS.events.favorite(eventId))
  },
}
