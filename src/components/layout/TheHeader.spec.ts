import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'

import TheHeader from './TheHeader.vue'

const Blank = { template: '<div />' }

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Blank },
    { path: '/evenements', name: 'events', component: Blank },
    { path: '/mon-compte', name: 'account', component: Blank },
    { path: '/mes-commandes', name: 'orders', component: Blank },
    { path: '/connexion', name: 'login', component: Blank },
    { path: '/inscription', name: 'register', component: Blank },
  ],
})

/** Mounts the header with a router and a store seeded to the given session. */
async function mountHeader(signedIn: boolean, fullName = 'Jean Dupont') {
  const wrapper = mount(TheHeader, {
    global: {
      plugins: [router, createTestingPinia({ createSpy: vi.fn })],
    },
  })

  const auth = useAuthStore()

  auth.accessToken = signedIn ? 'tok_123' : null
  auth.user = signedIn ? ({ fullName } as never) : null

  await wrapper.vm.$nextTick()

  return wrapper
}

describe('TheHeader', () => {
  it('shows the sign-in actions to a visitor', async () => {
    const wrapper = await mountHeader(false)

    expect(wrapper.text()).toContain('Connexion')
    expect(wrapper.text()).toContain('Créer un compte')
    expect(wrapper.text()).not.toContain('Mes commandes')
  })

  it('shows the account actions to a signed-in user', async () => {
    const wrapper = await mountHeader(true)

    expect(wrapper.text()).toContain('Mes commandes')
    expect(wrapper.text()).toContain('Jean Dupont')
    expect(wrapper.text()).not.toContain('Connexion')
  })

  it('falls back to a generic label when the name is empty', async () => {
    const wrapper = await mountHeader(true, '')

    expect(wrapper.text()).toContain('Mon compte')
  })

  it('always exposes the primary navigation', async () => {
    const wrapper = await mountHeader(false)

    expect(wrapper.text()).toContain('Accueil')
    expect(wrapper.text()).toContain('Événements')
  })

  it('links the brand to the home route', async () => {
    const wrapper = await mountHeader(false)

    expect(wrapper.find('.header__brand').attributes('href')).toBe('/')
  })

  it('labels the navigation for assistive technology', async () => {
    const wrapper = await mountHeader(false)

    expect(wrapper.find('nav').attributes('aria-label')).toBe('Navigation principale')
  })
})
