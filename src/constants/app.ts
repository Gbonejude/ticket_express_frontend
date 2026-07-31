/** Application-wide configuration read from the environment, resolved once. */
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Ticket Express',
  url: import.meta.env.VITE_APP_URL || window.location.origin,
  currency: import.meta.env.VITE_APP_CURRENCY || 'XOF',
  locale: import.meta.env.VITE_APP_LOCALE || 'fr-FR',
} as const

/** The API paginates every list at 15; mirrored here for optimistic UI. */
export const DEFAULT_PAGE_SIZE = 15

/** Delay before a search input triggers a request, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 350
