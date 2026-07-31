import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useUiStore } from './ui.store'

describe('ui store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('notify', () => {
    it('queues a toast', () => {
      const ui = useUiStore()

      ui.notify('Commande confirmée.', 'success')

      expect(ui.toasts).toHaveLength(1)
      expect(ui.toasts[0]).toMatchObject({ message: 'Commande confirmée.', variant: 'success' })
    })

    it('defaults to the info variant', () => {
      const ui = useUiStore()

      ui.notify('Un message')

      expect(ui.toasts[0]?.variant).toBe('info')
    })

    it('gives each toast a distinct id so several can coexist', () => {
      const ui = useUiStore()

      ui.notify('Premier')
      ui.notify('Second')

      expect(ui.toasts).toHaveLength(2)
      expect(ui.toasts[0]?.id).not.toBe(ui.toasts[1]?.id)
    })

    it('removes the toast once its duration elapses', () => {
      const ui = useUiStore()

      ui.notify('Éphémère', 'info', 5000)
      expect(ui.toasts).toHaveLength(1)

      vi.advanceTimersByTime(5000)
      expect(ui.toasts).toHaveLength(0)
    })

    it('keeps the toast until its own duration is reached', () => {
      const ui = useUiStore()

      ui.notify('Long', 'info', 10_000)

      vi.advanceTimersByTime(5000)
      expect(ui.toasts).toHaveLength(1)
    })

    it('expires each toast on its own schedule', () => {
      const ui = useUiStore()

      ui.notify('Court', 'info', 1000)
      ui.notify('Long', 'info', 8000)

      vi.advanceTimersByTime(1000)

      expect(ui.toasts).toHaveLength(1)
      expect(ui.toasts[0]?.message).toBe('Long')
    })
  })

  describe('dismiss', () => {
    it('removes the targeted toast only', () => {
      const ui = useUiStore()

      ui.notify('Premier')
      ui.notify('Second')

      ui.dismiss(ui.toasts[0]!.id)

      expect(ui.toasts).toHaveLength(1)
      expect(ui.toasts[0]?.message).toBe('Second')
    })

    it('is a no-op for an unknown id', () => {
      const ui = useUiStore()

      ui.notify('Premier')
      ui.dismiss(9999)

      expect(ui.toasts).toHaveLength(1)
    })

    it('does not throw when the timer fires after a manual dismiss', () => {
      const ui = useUiStore()

      ui.notify('Premier', 'info', 3000)
      ui.dismiss(ui.toasts[0]!.id)

      expect(() => vi.advanceTimersByTime(3000)).not.toThrow()
      expect(ui.toasts).toHaveLength(0)
    })
  })

  describe('toggleMobileMenu', () => {
    it('starts closed', () => {
      expect(useUiStore().isMobileMenuOpen).toBe(false)
    })

    it('flips the state when called with no argument', () => {
      const ui = useUiStore()

      ui.toggleMobileMenu()
      expect(ui.isMobileMenuOpen).toBe(true)

      ui.toggleMobileMenu()
      expect(ui.isMobileMenuOpen).toBe(false)
    })

    it('forces the state when given one', () => {
      const ui = useUiStore()

      ui.toggleMobileMenu(true)
      ui.toggleMobileMenu(true)

      expect(ui.isMobileMenuOpen).toBe(true)
    })
  })
})
