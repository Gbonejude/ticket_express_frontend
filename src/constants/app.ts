/** Application-wide configuration read from the environment, resolved once. */
export const APP_CONFIG = {
  name: import.meta.env.VITE_APP_NAME || 'Ticket Express',
  url: import.meta.env.VITE_APP_URL || window.location.origin,
  currency: import.meta.env.VITE_APP_CURRENCY || 'XOF',
  locale: import.meta.env.VITE_APP_LOCALE || 'fr-FR',

  /**
   * Where an approved organiser goes to manage their events.
   *
   * The public site never creates or edits an event — that is the back-office's
   * job — so the journey ends with a hand-off to this URL. There is no SSO
   * between the two applications today: the organiser signs in again, and the
   * token deliberately does not travel in the URL where it would land in
   * browser history and server logs.
   */
  dashboardUrl: import.meta.env.VITE_DASHBOARD_URL || 'http://localhost:5174',
} as const

/** The API paginates every list at 15; mirrored here for optimistic UI. */
export const DEFAULT_PAGE_SIZE = 15

/** Delay before a search input triggers a request, in milliseconds. */
export const SEARCH_DEBOUNCE_MS = 350
