import { describe, expect, it, vi } from 'vitest'

import { STORAGE_KEYS } from '@/constants/storage'

import { storage } from './storage'

describe('storage', () => {
  it('round-trips a value', () => {
    storage.set(STORAGE_KEYS.accessToken, 'abc123')

    expect(storage.get<string>(STORAGE_KEYS.accessToken)).toBe('abc123')
  })

  it('round-trips an object', () => {
    const user = { id: '01J', fullName: 'Jean Dupont' }

    storage.set(STORAGE_KEYS.user, user)

    expect(storage.get<typeof user>(STORAGE_KEYS.user)).toEqual(user)
  })

  it('returns null for a missing key', () => {
    expect(storage.get(STORAGE_KEYS.user)).toBeNull()
  })

  it('removes a key', () => {
    storage.set(STORAGE_KEYS.accessToken, 'abc123')
    storage.remove(STORAGE_KEYS.accessToken)

    expect(storage.get(STORAGE_KEYS.accessToken)).toBeNull()
  })

  it('returns null instead of throwing on a corrupted entry', () => {
    window.localStorage.setItem(STORAGE_KEYS.user, '{ not json')

    expect(storage.get(STORAGE_KEYS.user)).toBeNull()
  })

  it('swallows a write failure so a full quota cannot break the app', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    expect(() => storage.set(STORAGE_KEYS.accessToken, 'abc123')).not.toThrow()
  })

  it('swallows a read failure', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })

    expect(storage.get(STORAGE_KEYS.accessToken)).toBeNull()
  })
})
