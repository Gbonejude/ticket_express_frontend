import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { useFavoritesStore } from '@/stores/favorites.store'
import { useUiStore } from '@/stores/ui.store'
import type { Event } from '@/types/event'

/**
 * The favourite toggle, with the parts every screen repeats.
 *
 * Four pages show a heart — home, explore, event detail, organiser profile —
 * and each one has to answer the same three questions: is it already
 * favourited, what happens when a signed-out visitor clicks it, and what does
 * the user see when the request fails. Answering them once here is what keeps
 * those four screens from drifting apart.
 *
 * Favouriting requires a session. Rather than hiding the control for anonymous
 * visitors — which hides the feature itself — the click sends them to login and
 * comes back to where they were.
 */
export function useFavorites() {
  const auth = useAuthStore()
  const favorites = useFavoritesStore()
  const ui = useUiStore()
  const router = useRouter()
  const route = useRoute()

  /** Loads the visitor's favourites once; no-ops when signed out. */
  async function ensureLoaded(): Promise<void> {
    if (!auth.isAuthenticated) return

    try {
      await favorites.load()
    } catch {
      // A failed favourites fetch must not take the page down with it: the
      // hearts simply start empty.
    }
  }

  async function toggle(event: Event): Promise<void> {
    if (!auth.isAuthenticated) {
      ui.notify('Connectez-vous pour enregistrer vos favoris.', 'info')
      void router.push({ name: 'login', query: { redirect: route.fullPath } })

      return
    }

    try {
      const favorited = await favorites.toggle(event)

      if (favorited === null) return

      ui.notify(favorited ? 'Ajouté à vos favoris.' : 'Retiré de vos favoris.', 'success')
    } catch (error) {
      ui.notify(error instanceof Error ? error.message : 'Action impossible.', 'error')
    }
  }

  return {
    /** Synchronous, so a card can paint the right icon on first render. */
    has: favorites.has,
    isPending: favorites.isPending,
    ensureLoaded,
    toggle,
  }
}
