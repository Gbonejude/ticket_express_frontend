import { createPinia } from 'pinia'
import { createApp, watch } from 'vue'

import { setUnauthenticatedHandler } from '@/api'
import router from '@/router'
import { useAuthStore } from '@/stores/auth.store'
import { useFavoritesStore } from '@/stores/favorites.store'
import { useNotificationsStore } from '@/stores/notifications.store'

import App from './App.vue'

import '@/assets/styles/main.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

/**
 * Drops the per-user caches when the session ends.
 *
 * Wired here rather than inside `auth.logout()` because those stores import the
 * auth store themselves; reaching back from it would close the cycle. Watching
 * from the outside also covers the session expiring mid-visit, not just a
 * deliberate logout.
 */
watch(
  () => useAuthStore(pinia).isAuthenticated,
  (isAuthenticated) => {
    if (isAuthenticated) return

    useFavoritesStore(pinia).reset()
    useNotificationsStore(pinia).reset()
  },
)

/**
 * Bridges the HTTP layer back to the app when the API rejects the token.
 *
 * The interceptor cannot import the store itself — that would close the cycle
 * store → services → http → store — so the handler is injected here, once Pinia
 * is installed and a store can safely be resolved.
 */
setUnauthenticatedHandler(() => {
  const auth = useAuthStore(pinia)

  auth.clearSession()

  // Bounce to login unless the visitor is already there, keeping the target.
  if (router.currentRoute.value.name !== 'login') {
    void router.push({
      name: 'login',
      query: { redirect: router.currentRoute.value.fullPath },
    })
  }
})

app.mount('#app')
