import type { Ulid } from '@/types/api'

/**
 * Every API path the public frontend may call, in one place.
 *
 * Paths are relative to `VITE_API_BASE_URL` (which already ends in `/api/v1`).
 * Keeping them here means a backend route rename is a single edit, and it makes
 * the public surface of the API auditable at a glance.
 */
export const ENDPOINTS = {
  auth: {
    /**
     * Email + password login for the public site.
     * The back-office uses `auth/admin/login`, which also returns CASL rules.
     */
    login: 'auth/login',
    registerClient: 'auth/register/client',
    registerOrganizerManager: 'auth/register/organizer-manager',
    /** Completes registration after OTP verification. */
    register: 'auth/register',
    sendOtp: 'auth/send-otp',
    verifyOtp: 'auth/verify-otp',
    forgotPassword: 'auth/forgot-password',
    /** Consumes the token from the reset e-mail. */
    resetPassword: 'auth/reset-password',
    logout: 'auth/logout',
    me: 'me',
  },

  events: {
    list: 'events',
    detail: (id: Ulid) => `events/${id}`,
    ticketTypes: (id: Ulid) => `events/${id}/ticket-types`,
    occurrences: (id: Ulid) => `events/${id}/occurrences`,
    favorite: (id: Ulid) => `events/${id}/favorite`,
  },

  categories: {
    list: 'categories',
    detail: (id: Ulid) => `categories/${id}`,
  },

  venues: {
    list: 'venues',
    detail: (id: Ulid) => `venues/${id}`,
  },

  organizers: {
    list: 'organizers',
    detail: (id: Ulid) => `organizers/${id}`,
  },

  users: {
    /**
     * Profile edits and password changes.
     *
     * There is no `me`-scoped write route: `PUT /users/{id}` is only
     * `auth:sanctum`-gated, so the account page targets the signed-in user's
     * own id. Passing anyone else's id is refused by the backend.
     */
    update: (id: Ulid) => `users/${id}`,
  },

  notifications: {
    list: 'notifications',
    /** Just the number, for the header badge. */
    unreadCount: 'notifications/unread-count',
    markAsRead: (id: string) => `notifications/${id}/markasread`,
    /** Bulk, so "tout marquer comme lu" is one request rather than one per row. */
    markAllAsRead: 'notifications/read-all',
  },

  orders: {
    /** Guest checkout is allowed on this route. */
    create: 'orders',
    list: 'orders',
    detail: (id: Ulid) => `orders/${id}`,
    cancel: (id: Ulid) => `orders/${id}/cancel`,
  },

  payments: {
    initiate: 'payments/initiate',
    status: (id: Ulid) => `payments/${id}/status`,
  },

  tickets: {
    /** Public, token-based PDF download. */
    downloadPdf: (token: string) => `tickets/download/${token}`,
    downloadQr: (token: string, ticketId: Ulid) => `tickets/qr/${token}/${ticketId}`,
  },

  favorites: {
    list: 'favorites',
  },

  coupons: {
    /** Public, read-only check of a promo code before checkout. */
    validate: 'coupons/validate',
  },

  contact: {
    /** Sends the support form; the backend turns it into an e-mail. */
    send: 'contact',
  },
} as const
