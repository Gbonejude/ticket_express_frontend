/**
 * Shape of every TicketExpress API response.
 *
 * The backend wraps all payloads through its `NormalizeApiResponse` middleware,
 * so a response is always `{ success, message, data, ... }`. List endpoints add
 * a `meta` block; validation failures add `errors`.
 */

/** ULIDs are used as primary keys across the API. */
export type Ulid = string

/** Pagination block returned alongside list payloads. */
export interface PaginationMeta {
  current_page: number
  per_page: number
  total: number
  last_page: number
  from: number | null
  to: number | null
}

/** Envelope for a single resource. */
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  errors?: ApiValidationErrors | null
}

/** Envelope for a paginated collection. */
export interface ApiListEnvelope<T> extends ApiEnvelope<T[]> {
  meta: PaginationMeta
}

/** Laravel validation errors: field name → list of messages. */
export type ApiValidationErrors = Record<string, string[]>

/**
 * A paginated collection unwrapped from its envelope.
 * Services return this so callers never touch the envelope themselves.
 */
export interface Paginated<T> {
  items: T[]
  meta: PaginationMeta
}

/** Query parameters accepted by every list endpoint. */
export interface ListQuery {
  page?: number
  per_page?: number
  search?: string
  [key: string]: string | number | boolean | undefined
}

/**
 * Dates are serialised as objects, not strings.
 * `datetime` is ISO 8601; `human` is a localised label; `humanDiff` is relative.
 */
export interface ApiDate {
  datetime: string
  human: string
  humanDiff: string
}
