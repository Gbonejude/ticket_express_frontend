import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastVariant = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: number
  message: string
  variant: ToastVariant
}

/**
 * Cross-cutting interface state: notifications and the mobile menu.
 *
 * Anything owned by a single page belongs to that page, not here.
 */
export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const isMobileMenuOpen = ref(false)

  let nextId = 0

  /** Queues a toast and removes it after `duration` ms. */
  function notify(message: string, variant: ToastVariant = 'info', duration = 5000): void {
    const id = nextId++

    toasts.value.push({ id, message, variant })
    window.setTimeout(() => dismiss(id), duration)
  }

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function toggleMobileMenu(open?: boolean): void {
    isMobileMenuOpen.value = open ?? !isMobileMenuOpen.value
  }

  return { toasts, isMobileMenuOpen, notify, dismiss, toggleMobileMenu }
})
