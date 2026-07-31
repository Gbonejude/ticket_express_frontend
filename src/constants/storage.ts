/**
 * Keys used in `localStorage`. Centralised so a rename is a one-line change and
 * a stale key can never silently coexist with a new one.
 */
export const STORAGE_KEYS = {
  accessToken: 'te.access_token',
  user: 'te.user',
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]
