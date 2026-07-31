import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { ApiError } from '@/api'
import { STORAGE_KEYS } from '@/constants/storage'
import { authService } from '@/services'
import type { LoginPayload, RegisterClientPayload, User } from '@/types/user'
import { storage } from '@/utils/storage'

/**
 * Session of the visitor.
 *
 * The token lives in `localStorage`, not in a cookie: the API authenticates
 * with a Sanctum bearer token rather than a session cookie, so there is nothing
 * for the browser to send automatically and no CSRF flow to honour.
 */
export const useAuthStore = defineStore('auth', () => {
  // --- State ---
  const user = ref<User | null>(storage.get<User>(STORAGE_KEYS.user))
  const accessToken = ref<string | null>(storage.get<string>(STORAGE_KEYS.accessToken))
  const isLoading = ref(false)

  // --- Getters ---
  const isAuthenticated = computed(() => Boolean(accessToken.value))
  const displayName = computed(() => user.value?.fullName ?? '')

  // --- Internal ---
  function persistSession(token: string, profile: User): void {
    accessToken.value = token
    user.value = profile
    storage.set(STORAGE_KEYS.accessToken, token)
    storage.set(STORAGE_KEYS.user, profile)
  }

  /** Drops the local session. Does not call the API. */
  function clearSession(): void {
    accessToken.value = null
    user.value = null
    storage.remove(STORAGE_KEYS.accessToken)
    storage.remove(STORAGE_KEYS.user)
  }

  // --- Actions ---

  /** Signs in with email and password. Throws an `ApiError` on failure. */
  async function login(payload: LoginPayload): Promise<void> {
    isLoading.value = true

    try {
      const session = await authService.login(payload)

      persistSession(session.token, session.user)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Creates a client account and signs the visitor in.
   * Registration returns a token directly, so there is no second round-trip.
   */
  async function register(payload: RegisterClientPayload): Promise<void> {
    isLoading.value = true

    try {
      const session = await authService.registerClient(payload)

      persistSession(session.token, session.user)
    } finally {
      isLoading.value = false
    }
  }

  /** Signs out. The local session is cleared even if the API call fails. */
  async function logout(): Promise<void> {
    try {
      if (accessToken.value) await authService.logout()
    } catch {
      // The token may already be revoked or expired; nothing left to revoke.
    } finally {
      clearSession()
    }
  }

  /**
   * Re-reads the profile from the API to refresh a persisted session.
   * A rejected token clears the session instead of leaving a stale user on screen.
   */
  async function fetchProfile(): Promise<void> {
    if (!accessToken.value) return

    try {
      const { user: profile } = await authService.me()

      user.value = profile
      storage.set(STORAGE_KEYS.user, profile)
    } catch (error) {
      if (error instanceof ApiError && error.isUnauthenticated) clearSession()
    }
  }

  return {
    user,
    accessToken,
    isLoading,
    isAuthenticated,
    displayName,
    login,
    register,
    logout,
    clearSession,
    fetchProfile,
  }
})
