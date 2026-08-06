import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { dismissToast, showToast } from '@/utils/toast'

import { useUiStore } from './ui.store'

vi.mock('@/utils/toast', () => ({
  showToast: vi.fn(),
  dismissToast: vi.fn(),
}))

/**
 * The store no longer holds a toast queue — SweetAlert2 renders and expires
 * them (see `utils/toast`). What is worth testing here is that the store still
 * honours the contract every call site relies on: the message, the variant and
 * its default, and the duration.
 */
describe('ui store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('notify', () => {
    it('passes the message and variant through', () => {
      useUiStore().notify('Commande confirmée.', 'success')

      expect(showToast).toHaveBeenCalledWith('Commande confirmée.', 'success', 5000)
    })

    it('defaults to the info variant', () => {
      useUiStore().notify('Un message')

      expect(showToast).toHaveBeenCalledWith('Un message', 'info', 5000)
    })

    it('honours a custom duration', () => {
      useUiStore().notify('Long', 'warning', 10_000)

      expect(showToast).toHaveBeenCalledWith('Long', 'warning', 10_000)
    })

    it('does not throw when called repeatedly', () => {
      const ui = useUiStore()

      expect(() => {
        ui.notify('Premier')
        ui.notify('Second')
      }).not.toThrow()

      expect(showToast).toHaveBeenCalledTimes(2)
    })
  })

  describe('dismiss', () => {
    it('closes the toast on screen', () => {
      useUiStore().dismiss()

      expect(dismissToast).toHaveBeenCalled()
    })
  })

  describe('mobile menu', () => {
    it('starts closed', () => {
      expect(useUiStore().isMobileMenuOpen).toBe(false)
    })

    it('toggles', () => {
      const ui = useUiStore()

      ui.toggleMobileMenu()
      expect(ui.isMobileMenuOpen).toBe(true)

      ui.toggleMobileMenu()
      expect(ui.isMobileMenuOpen).toBe(false)
    })

    it('accepts an explicit state', () => {
      const ui = useUiStore()

      ui.toggleMobileMenu(true)
      ui.toggleMobileMenu(true)

      expect(ui.isMobileMenuOpen).toBe(true)
    })
  })
})
