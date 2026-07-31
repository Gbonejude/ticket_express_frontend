import { createRouter, createWebHistory } from 'vue-router'

import { setupGuards } from './guards'
import { routes } from './routes'

/** Typed `route.meta`, so guards and pages share one contract. */
declare module 'vue-router' {
  interface RouteMeta {
    /** Document title, suffixed with the application name. */
    title?: string
    /** Visitors are redirected to login, with the target kept in `?redirect=`. */
    requiresAuth?: boolean
    /** Signed-in users are redirected home (login, signup). */
    guestOnly?: boolean
  }
}

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,

  scrollBehavior(to, _from, savedPosition) {
    // Back/forward should land where the visitor left off.
    if (savedPosition) return savedPosition

    if (to.hash) return { el: to.hash, behavior: 'smooth', top: 80 }

    return { top: 0 }
  },
})

setupGuards(router)

export default router
