import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { favoritesService } from '@/services'
import type { Event } from '@/types/event'

import { useAuthStore } from './auth.store'
import { useFavoritesStore } from './favorites.store'

vi.mock('@/services', () => ({
  favoritesService: {
    list: vi.fn(),
    toggle: vi.fn(),
  },
  authService: { login: vi.fn(), registerClient: vi.fn(), logout: vi.fn(), me: vi.fn() },
  accountService: { updateProfile: vi.fn(), changePassword: vi.fn(), updateAvatar: vi.fn() },
  organizersService: { apply: vi.fn() },
}))

const concert = { id: 'evt_1', title: 'Concert' } as Event
const gala = { id: 'evt_2', title: 'Gala' } as Event

const listed = (items: Event[]) => ({
  items,
  meta: { current_page: 1, per_page: 15, total: items.length, last_page: 1, from: 1, to: 1 },
})

/** Signs a visitor in, since every favourites route requires a session. */
function signIn(): void {
  const auth = useAuthStore()

  auth.accessToken = 'tok_123'
}

describe('favorites store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('stays empty and issues no request for a signed-out visitor', async () => {
    const store = useFavoritesStore()

    await store.load()

    expect(favoritesService.list).not.toHaveBeenCalled()
    expect(store.count).toBe(0)
  })

  it('loads once and answers `has` synchronously afterwards', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue(listed([concert]))
    signIn()

    const store = useFavoritesStore()

    await store.load()
    await store.load()

    expect(favoritesService.list).toHaveBeenCalledTimes(1)
    expect(store.has('evt_1')).toBe(true)
    expect(store.has('evt_2')).toBe(false)
  })

  it('adds the event before the request resolves', async () => {
    vi.mocked(favoritesService.toggle).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ favorited: true, favoritesCount: 1 }), 5)),
    )
    signIn()

    const store = useFavoritesStore()
    const pending = store.toggle(gala)

    // Optimistic: the heart is filled while the request is still in flight.
    expect(store.has('evt_2')).toBe(true)

    await pending

    expect(store.has('evt_2')).toBe(true)
    expect(store.events.map((event) => event.id)).toContain('evt_2')
  })

  it('rolls back when the toggle fails', async () => {
    vi.mocked(favoritesService.toggle).mockRejectedValue(new Error('boom'))
    signIn()

    const store = useFavoritesStore()

    await expect(store.toggle(gala)).rejects.toThrow('boom')
    expect(store.has('evt_2')).toBe(false)
    expect(store.events).toHaveLength(0)
  })

  it('trusts the server over the optimistic guess', async () => {
    // The visitor had it favourited elsewhere, so the toggle removes it —
    // the opposite of what this tab predicted.
    vi.mocked(favoritesService.toggle).mockResolvedValue({ favorited: false, favoritesCount: 0 })
    signIn()

    const store = useFavoritesStore()

    await store.toggle(gala)

    expect(store.has('evt_2')).toBe(false)
  })

  it('returns null instead of calling the API when signed out', async () => {
    const store = useFavoritesStore()

    await expect(store.toggle(gala)).resolves.toBeNull()
    expect(favoritesService.toggle).not.toHaveBeenCalled()
  })

  it('ignores a second toggle while the first is in flight', async () => {
    vi.mocked(favoritesService.toggle).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ favorited: true, favoritesCount: 1 }), 5)),
    )
    signIn()

    const store = useFavoritesStore()
    const first = store.toggle(gala)

    await store.toggle(gala)
    await first

    expect(favoritesService.toggle).toHaveBeenCalledTimes(1)
  })

  it('drops everything on reset, so the next visitor starts clean', async () => {
    vi.mocked(favoritesService.list).mockResolvedValue(listed([concert]))
    signIn()

    const store = useFavoritesStore()

    await store.load()
    store.reset()

    expect(store.count).toBe(0)
    expect(store.isLoaded).toBe(false)
  })
})
