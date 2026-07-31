import type { Router } from 'vue-router'

import { APP_CONFIG } from '@/constants/app'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Navigation guards.
 *
 * On a public site everything is open by default: only routes that opt in with
 * `meta.requiresAuth` are protected. That is the opposite of the back-office,
 * where every screen is closed until a permission allows it.
 */
export function setupGuards(router: Router): void {
  router.beforeEach((to) => {
    // The store is resolved inside the guard: Pinia must be installed first.
    const auth = useAuthStore()

    if (to.meta.requiresAuth && !auth.isAuthenticated) {
      // Keep the target so login can send the visitor back after signing in.
      return { name: 'login', query: { redirect: to.fullPath } }
    }

    if (to.meta.guestOnly && auth.isAuthenticated) {
      return { name: 'home' }
    }

    return true
  })

  router.afterEach((to) => {
    const title = to.meta.title

    document.title = title ? `${title} — ${APP_CONFIG.name}` : APP_CONFIG.name
  })
}
