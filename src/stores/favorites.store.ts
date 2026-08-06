import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { favoritesService } from '@/services'
import type { Ulid } from '@/types/api'
import type { Event } from '@/types/event'

import { useAuthStore } from './auth.store'

/**
 * The visitor's favourite events.
 *
 * The set of ids is kept in the store rather than fetched per card: an event
 * list renders dozens of hearts, and each one needs to know its state
 * synchronously to paint the right icon on first render. `has()` is therefore
 * a plain lookup, and the list is loaded once per session.
 */
export const useFavoritesStore = defineStore('favorites', () => {
  // --- State ---
  const ids = ref<Set<Ulid>>(new Set())
  const events = ref<Event[]>([])
  const isLoading = ref(false)

  /** Guards against re-fetching on every page that shows a heart. */
  const isLoaded = ref(false)

  /** Toggles in flight, so a double click cannot fire two requests. */
  const pending = ref<Set<Ulid>>(new Set())

  // --- Getters ---
  const count = computed(() => ids.value.size)

  /** Synchronous — see the note above. */
  function has(id: Ulid): boolean {
    return ids.value.has(id)
  }

  function isPending(id: Ulid): boolean {
    return pending.value.has(id)
  }

  // --- Actions ---

  /**
   * Loads the favourites once.
   *
   * Silently no-ops for a signed-out visitor: favouriting requires a session,
   * and a 401 here would log the visitor out of a page they are only reading.
   */
  async function load(force = false): Promise<void> {
    const auth = useAuthStore()

    if (!auth.isAuthenticated) {
      reset()

      return
    }

    if (isLoaded.value && !force) return

    isLoading.value = true

    try {
      const { items } = await favoritesService.list()

      events.value = items
      ids.value = new Set(items.map((event) => event.id))
      isLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Adds or removes an event, updating the icon before the request resolves
   * and rolling back if it fails.
   *
   * Returns the new state, or `null` when the visitor is not signed in — the
   * caller decides whether that means a redirect or a prompt.
   */
  async function toggle(event: Event): Promise<boolean | null> {
    const auth = useAuthStore()

    if (!auth.isAuthenticated) return null
    if (pending.value.has(event.id)) return has(event.id)

    const previous = has(event.id)

    pending.value = new Set(pending.value).add(event.id)
    apply(event, !previous)

    try {
      const { favorited } = await favoritesService.toggle(event.id)

      // Trust the server's answer over the optimistic guess.
      if (favorited !== !previous) apply(event, favorited)

      return favorited
    } catch (error) {
      apply(event, previous)

      throw error
    } finally {
      const next = new Set(pending.value)

      next.delete(event.id)
      pending.value = next
    }
  }

  /** Writes one event into both the id set and the cached list. */
  function apply(event: Event, favorited: boolean): void {
    const nextIds = new Set(ids.value)

    if (favorited) {
      nextIds.add(event.id)
      if (!events.value.some((entry) => entry.id === event.id)) {
        events.value = [event, ...events.value]
      }
    } else {
      nextIds.delete(event.id)
      events.value = events.value.filter((entry) => entry.id !== event.id)
    }

    ids.value = nextIds
  }

  /** Drops the cache. Called on logout so the next visitor starts clean. */
  function reset(): void {
    ids.value = new Set()
    events.value = []
    pending.value = new Set()
    isLoaded.value = false
  }

  return {
    ids,
    events,
    isLoading,
    isLoaded,
    count,
    has,
    isPending,
    load,
    toggle,
    reset,
  }
})
