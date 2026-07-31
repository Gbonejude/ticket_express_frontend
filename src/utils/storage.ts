import type { StorageKey } from '@/constants/storage'

/**
 * Thin, typed wrapper over `localStorage`.
 *
 * Every access is guarded: `localStorage` throws in private-browsing modes and
 * when the quota is exceeded, and a corrupted entry must not take the app down
 * on boot. Reads fall back to `null`, writes fail silently.
 */
export const storage = {
  get<T>(key: StorageKey): T | null {
    try {
      const raw = window.localStorage.getItem(key)
      if (raw === null) return null

      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  set(key: StorageKey, value: unknown): void {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Quota exceeded or storage unavailable — the app stays usable without it.
    }
  },

  remove(key: StorageKey): void {
    try {
      window.localStorage.removeItem(key)
    } catch {
      // Nothing to do; the value is unreachable either way.
    }
  },
}
