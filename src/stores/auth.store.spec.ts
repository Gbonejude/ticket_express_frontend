import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api'
import { STORAGE_KEYS } from '@/constants/storage'
import { authService } from '@/services'
import type { AuthSession, RegisterClientPayload, User } from '@/types/user'
import { storage } from '@/utils/storage'

import { useAuthStore } from './auth.store'

vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    registerClient: vi.fn(),
    logout: vi.fn(),
    me: vi.fn(),
  },
}))

const user = {
  id: '01JABC',
  firstName: 'Jean',
  lastName: 'Dupont',
  fullName: 'Jean Dupont',
  email: 'jean.dupont@example.com',
  phone: '+22890200001',
} as User

const session: AuthSession = { token: 'tok_123', user }

const registration: RegisterClientPayload = {
  first_name: 'Jean',
  last_name: 'Dupont',
  email: 'jean.dupont@example.com',
  phone: '+22890200001',
  password: 'Password123!',
}

describe('auth store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts signed out when storage is empty', () => {
    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
    expect(auth.displayName).toBe('')
  })

  it('rehydrates a persisted session on creation', () => {
    storage.set(STORAGE_KEYS.accessToken, 'tok_123')
    storage.set(STORAGE_KEYS.user, user)

    const auth = useAuthStore()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.displayName).toBe('Jean Dupont')
  })

  describe('login', () => {
    it('persists the session returned by the API', async () => {
      vi.mocked(authService.login).mockResolvedValue(session)

      const auth = useAuthStore()

      await auth.login({ email: user.email!, password: 'Password123!' })

      expect(auth.isAuthenticated).toBe(true)
      expect(auth.user).toEqual(user)
      expect(storage.get(STORAGE_KEYS.accessToken)).toBe('tok_123')
      expect(storage.get(STORAGE_KEYS.user)).toEqual(user)
    })

    it('clears the loading flag and rethrows when credentials are rejected', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new ApiError('Invalid credentials.', { status: 401 }),
      )

      const auth = useAuthStore()

      await expect(auth.login({ email: 'x@y.tg', password: 'bad' })).rejects.toThrow(ApiError)
      expect(auth.isLoading).toBe(false)
      expect(auth.isAuthenticated).toBe(false)
    })
  })

  describe('register', () => {
    it('signs the visitor in from the registration response alone', async () => {
      vi.mocked(authService.registerClient).mockResolvedValue(session)

      const auth = useAuthStore()

      await auth.register(registration)

      expect(auth.isAuthenticated).toBe(true)
      expect(storage.get(STORAGE_KEYS.accessToken)).toBe('tok_123')
    })

    it('does not call login — registration already returns a token', async () => {
      vi.mocked(authService.registerClient).mockResolvedValue(session)

      await useAuthStore().register(registration)

      expect(authService.login).not.toHaveBeenCalled()
    })

    it('leaves the visitor signed out when registration fails', async () => {
      vi.mocked(authService.registerClient).mockRejectedValue(
        new ApiError('Données invalides.', { status: 422, errors: { email: ['Déjà utilisée.'] } }),
      )

      const auth = useAuthStore()

      await expect(auth.register(registration)).rejects.toThrow(ApiError)
      expect(auth.isAuthenticated).toBe(false)
      expect(auth.isLoading).toBe(false)
    })
  })

  describe('logout', () => {
    it('revokes the token server-side and clears the session', async () => {
      vi.mocked(authService.login).mockResolvedValue(session)
      vi.mocked(authService.logout).mockResolvedValue('Logged out successfully.')

      const auth = useAuthStore()

      await auth.login({ email: user.email!, password: 'Password123!' })
      await auth.logout()

      expect(authService.logout).toHaveBeenCalled()
      expect(auth.isAuthenticated).toBe(false)
      expect(storage.get(STORAGE_KEYS.accessToken)).toBeNull()
    })

    it('clears the session even when the API call fails', async () => {
      vi.mocked(authService.login).mockResolvedValue(session)
      vi.mocked(authService.logout).mockRejectedValue(new ApiError('boom', { status: 500 }))

      const auth = useAuthStore()

      await auth.login({ email: user.email!, password: 'Password123!' })
      await expect(auth.logout()).resolves.toBeUndefined()

      expect(auth.isAuthenticated).toBe(false)
      expect(storage.get(STORAGE_KEYS.user)).toBeNull()
    })

    it('does not call the API when there is no token to revoke', async () => {
      await useAuthStore().logout()

      expect(authService.logout).not.toHaveBeenCalled()
    })
  })

  describe('fetchProfile', () => {
    it('does nothing when signed out', async () => {
      await useAuthStore().fetchProfile()

      expect(authService.me).not.toHaveBeenCalled()
    })

    it('refreshes the stored user', async () => {
      const refreshed = { ...user, firstName: 'Jeanne', fullName: 'Jeanne Dupont' }

      storage.set(STORAGE_KEYS.accessToken, 'tok_123')
      vi.mocked(authService.me).mockResolvedValue({ user: refreshed, screens: [] })

      const auth = useAuthStore()

      await auth.fetchProfile()

      expect(auth.displayName).toBe('Jeanne Dupont')
      expect(storage.get(STORAGE_KEYS.user)).toEqual(refreshed)
    })

    it('clears the session when the token is rejected', async () => {
      storage.set(STORAGE_KEYS.accessToken, 'expired')
      storage.set(STORAGE_KEYS.user, user)
      vi.mocked(authService.me).mockRejectedValue(new ApiError('Unauthenticated.', { status: 401 }))

      const auth = useAuthStore()

      await auth.fetchProfile()

      expect(auth.isAuthenticated).toBe(false)
      expect(storage.get(STORAGE_KEYS.accessToken)).toBeNull()
    })

    it('keeps the session on a transient server error', async () => {
      storage.set(STORAGE_KEYS.accessToken, 'tok_123')
      storage.set(STORAGE_KEYS.user, user)
      vi.mocked(authService.me).mockRejectedValue(new ApiError('boom', { status: 500 }))

      const auth = useAuthStore()

      await auth.fetchProfile()

      expect(auth.isAuthenticated).toBe(true)
    })
  })
})
