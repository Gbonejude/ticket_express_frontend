import type { Ulid } from './api'

/**
 * A row of `GET /notifications`.
 *
 * This endpoint returns Laravel's own `notifications` table, so — unlike every
 * other resource on this API — its fields are snake_case and the payload sits
 * in a free-form `data` object. `NormalizeApiResponse` re-wraps the paginator
 * into the standard envelope, but it does not rename anything inside a row.
 */
export interface ApiNotification {
  id: string
  type: string
  notifiable_id: Ulid
  notifiable_type: string
  data: NotificationData
  read_at: string | null
  created_at: string
  updated_at: string
}

/** Payload written by the backend's `CustomNotification`. */
export interface NotificationData {
  title?: string
  message?: string
  type?: 'info' | 'success' | 'warning' | 'error'
  [key: string]: unknown
}

/** A notification flattened for display, with the snake_case sanded off. */
export interface Notification {
  id: string
  title: string
  message: string
  level: 'info' | 'success' | 'warning' | 'error'
  isRead: boolean
  createdAt: string
}
