import { createTestingPinia } from '@pinia/testing'
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth.store'
import { useSearchStore } from '@/stores/search.store'

import TheHeader from './TheHeader.vue'

const Blank = { template: '<div />' }

/** Mirrors the real route names the header links to. */
const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: Blank },
    { path: '/evenements', name: 'events', component: Blank },
    { path: '/qui-sommes-nous', name: 'about', component: Blank },
    { path: '/contact', name: 'contact', component: Blank },
    { path: '/mon-espace', name: 'dashboard', component: Blank },
    { path: '/mon-espace/billets', name: 'tickets', component: Blank },
    { path: '/mon-espace/commandes', name: 'orders', component: Blank },
    { path: '/mon-espace/favoris', name: 'favorites', component: Blank },
    { path: '/mon-espace/notifications', name: 'notifications', component: Blank },
    { path: '/mon-espace/profil', name: 'profile', component: Blank },
    { path: '/devenir-organisateur', name: 'become-organizer', component: Blank },
    { path: '/connexion', name: 'login', component: Blank },
    { path: '/inscription', name: 'register', component: Blank },
  ],
})

/** Mounts the header with a router and a store seeded to the given session. */
async function mountHeader(signedIn: boolean, fullName = 'Jean Dupont', at = '/') {
  await router.push(at)
  await router.isReady()

  const wrapper = mount(TheHeader, {
    global: { plugins: [router, createTestingPinia({ createSpy: vi.fn })] },
  })

  const auth = useAuthStore()

  auth.accessToken = signedIn ? 'tok_123' : null
  auth.user = signedIn ? ({ fullName, email: 'jean@example.com' } as never) : null

  await wrapper.vm.$nextTick()

  return wrapper
}

/** Opens the account dropdown, whose trigger is the last icon button. */
async function openAccountMenu(wrapper: Awaited<ReturnType<typeof mountHeader>>) {
  await wrapper.find('.header__account button').trigger('click')
}

describe('TheHeader', () => {
  it('links the brand to the home route', async () => {
    const wrapper = await mountHeader(false)

    expect(wrapper.find('.header__brand').attributes('href')).toBe('/')
  })

  it('exposes the search form', async () => {
    const wrapper = await mountHeader(false)
    const form = wrapper.find('form[role="search"]')

    expect(form.exists()).toBe(true)
    expect(form.find('input[type="search"]').exists()).toBe(true)
  })

  it('filters in place when the page already lists events', async () => {
    // On the home page the visitor is already looking at events; sending them
    // somewhere else to ask the same question is the behaviour that was wrong.
    const wrapper = await mountHeader(false)
    const push = vi.spyOn(router, 'push')

    await wrapper.find('input[type="search"]').setValue('jazz')
    await wrapper.find('form[role="search"]').trigger('submit')

    expect(push).not.toHaveBeenCalled()
    // Pinia's testing plugin stubs actions, so the contract asserted here is
    // the call the header makes, not the state the store would reach.
    expect(useSearchStore().set).toHaveBeenCalledWith('jazz')
  })

  it('hands over to the explore page from a page with nothing to filter', async () => {
    const wrapper = await mountHeader(false, 'Jean Dupont', '/contact')
    const push = vi.spyOn(router, 'push')

    await wrapper.find('input[type="search"]').setValue('jazz')
    await wrapper.find('form[role="search"]').trigger('submit')

    // No query string: the term travels in the store, not the URL.
    expect(push).toHaveBeenCalledWith({ name: 'events' })
    expect(useSearchStore().set).toHaveBeenCalledWith('jazz')
  })

  it('offers sign-in actions to a visitor', async () => {
    const wrapper = await mountHeader(false)

    await openAccountMenu(wrapper)

    expect(wrapper.text()).toContain('Connexion')
    expect(wrapper.text()).toContain('Créer un compte')
    expect(wrapper.text()).not.toContain('Se déconnecter')
  })

  it('offers the account sections to a signed-in user', async () => {
    const wrapper = await mountHeader(true)

    await openAccountMenu(wrapper)

    expect(wrapper.text()).toContain('Jean Dupont')
    expect(wrapper.text()).toContain('Tableau de bord')
    expect(wrapper.text()).toContain('Se déconnecter')
    expect(wrapper.text()).not.toContain('Créer un compte')
  })

  it('falls back to a generic label when the name is empty', async () => {
    const wrapper = await mountHeader(true, '')

    await openAccountMenu(wrapper)

    expect(wrapper.text()).toContain('Mon compte')
  })

  it('labels the primary navigation for assistive technology', async () => {
    const wrapper = await mountHeader(false)

    expect(wrapper.find('form[role="search"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Ouvrir le menu"]').exists()).toBe(true)
  })
})
