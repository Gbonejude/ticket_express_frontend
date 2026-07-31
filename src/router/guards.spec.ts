import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'

import { STORAGE_KEYS } from '@/constants/storage'
import { useAuthStore } from '@/stores/auth.store'
import type { User } from '@/types/user'
import { storage } from '@/utils/storage'

import { setupGuards } from './guards'

const Blank = { template: '<div />' }

/**
 * A router with the same route shapes as the real table, but stub components —
 * the guards are what is under test, not the pages.
 */
function makeRouter(): Router {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: Blank, meta: { title: 'Accueil' } },
      { path: '/evenements', name: 'events', component: Blank },
      { path: '/mon-compte', name: 'account', component: Blank, meta: { requiresAuth: true } },
      { path: '/connexion', name: 'login', component: Blank, meta: { guestOnly: true } },
      { path: '/:pathMatch(.*)*', name: 'not-found', component: Blank },
    ],
  })

  setupGuards(router)

  return router
}

function signIn(): void {
  storage.set(STORAGE_KEYS.accessToken, 'tok_123')
  storage.set(STORAGE_KEYS.user, { id: '01J', fullName: 'Jean Dupont' } as User)
  useAuthStore().$patch({ accessToken: 'tok_123' })
}

describe('router guards', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('lets a visitor reach a public route', async () => {
    const router = makeRouter()

    await router.push('/evenements')

    expect(router.currentRoute.value.name).toBe('events')
  })

  it('redirects a visitor away from a protected route', async () => {
    const router = makeRouter()

    await router.push('/mon-compte')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('keeps the target so login can send the visitor back', async () => {
    const router = makeRouter()

    await router.push('/mon-compte')

    expect(router.currentRoute.value.query.redirect).toBe('/mon-compte')
  })

  it('lets a signed-in user reach a protected route', async () => {
    const router = makeRouter()

    signIn()
    await router.push('/mon-compte')

    expect(router.currentRoute.value.name).toBe('account')
  })

  it('redirects a signed-in user away from the login page', async () => {
    const router = makeRouter()

    signIn()
    await router.push('/connexion')

    expect(router.currentRoute.value.name).toBe('home')
  })

  it('lets a visitor reach the login page', async () => {
    const router = makeRouter()

    await router.push('/connexion')

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('resolves an unknown path to the catch-all', async () => {
    const router = makeRouter()

    await router.push('/nawak')

    expect(router.currentRoute.value.name).toBe('not-found')
  })

  describe('document title', () => {
    it('suffixes the route title with the app name', async () => {
      const router = makeRouter()

      await router.push('/')

      expect(document.title).toBe('Accueil — Ticket Express')
    })

    it('falls back to the app name alone when a route has no title', async () => {
      const router = makeRouter()

      await router.push('/evenements')

      expect(document.title).toBe('Ticket Express')
    })
  })
})
