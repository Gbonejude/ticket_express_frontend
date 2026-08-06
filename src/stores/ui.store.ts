import { defineStore } from 'pinia'
import { ref } from 'vue'

import { dismissToast, showToast } from '@/utils/toast'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

/**
 * Cross-cutting interface state: notifications and the mobile menu.
 *
 * Anything owned by a single page belongs to that page, not here.
 *
 * Toasts are rendered by SweetAlert2 (see `utils/toast`) rather than by a
 * component of ours, so the store no longer holds a queue. `notify()` keeps the
 * signature it always had — no call site changed when the renderer did.
 */
export const useUiStore = defineStore('ui', () => {
  const isMobileMenuOpen = ref(false)

  /** Shows a toast for `duration` ms. */
  function notify(message: string, variant: ToastVariant = 'info', duration = 5000): void {
    showToast(message, variant, duration)
  }

  /** Closes the toast currently on screen, if any. */
  function dismiss(): void {
    dismissToast()
  }

  function toggleMobileMenu(open?: boolean): void {
    isMobileMenuOpen.value = open ?? !isMobileMenuOpen.value
  }

  return { isMobileMenuOpen, notify, dismiss, toggleMobileMenu }
})
