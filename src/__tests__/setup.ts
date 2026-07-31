import { afterEach, beforeEach, vi } from 'vitest'

/**
 * Global test setup.
 *
 * Each test starts from a clean slate: no leftover `localStorage` entry, no
 * mock carried over from the previous file.
 */

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
