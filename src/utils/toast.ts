import Swal from 'sweetalert2'

import type { ToastVariant } from '@/stores/ui.store'

/**
 * Toasts, rendered by SweetAlert2.
 *
 * The app used to draw its own `ToastHost`. SweetAlert2 replaces it because it
 * already solves what that component only sketched: stacking, focus handling,
 * a pause-on-hover timer bar, and dismissal that survives the page navigating
 * away underneath it.
 *
 * It is wrapped here rather than called from components so the rest of the app
 * keeps talking to `ui.notify(message, variant)` and knows nothing about the
 * library — swapping it again would be a change to this file alone.
 *
 * The look is driven by the design tokens (see `swal` rules in
 * `assets/styles/main.css`), so toasts match the rest of the site rather than
 * bringing SweetAlert's default palette with them.
 */
const Toast = Swal.mixin({
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timerProgressBar: true,
  customClass: {
    popup: 'te-toast',
    title: 'te-toast__title',
    timerProgressBar: 'te-toast__progress',
  },
  didOpen: (element) => {
    // Reading a long message should not race a 5-second timer.
    element.addEventListener('mouseenter', Swal.stopTimer)
    element.addEventListener('mouseleave', Swal.resumeTimer)
  },
})

/** `ToastVariant` maps one-to-one onto SweetAlert's icons. */
const ICONS: Record<ToastVariant, 'success' | 'error' | 'warning' | 'info'> = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
}

/** Shows a toast. Fire-and-forget: nothing waits on a notification. */
export function showToast(message: string, variant: ToastVariant, duration = 5000): void {
  void Toast.fire({
    icon: ICONS[variant],
    title: message,
    timer: duration,
  })
}

/** Closes whatever toast is on screen. Used when a view tears down. */
export function dismissToast(): void {
  Swal.close()
}
