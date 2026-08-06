import type { ApiDate, Ulid } from './api'
import type { User } from './user'

/**
 * Domain types mirroring the backend's `V1` API resources.
 * Field names follow the API: responses are camelCase.
 */

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventType = 'physical' | 'online'

/** Approval state of an organiser profile, from `OrganizerStatus` on the API. */
export type OrganizerStatus = 'pending' | 'approved' | 'rejected'

/** How a ticket type is currently selling. Drives badges on the public site. */
export type AvailabilityStatus =
  'available' | 'limited' | 'almost_sold_out' | 'sold_out' | 'not_started' | 'ended'

export interface EventCategory {
  id: Ulid
  name: string
  slug: string
  /** Every event, past ones included. */
  eventsCount?: number
  /**
   * Published events that have not ended — what the catalogue actually offers.
   *
   * The tiles and filter checkboxes must use this: `eventsCount` counts past
   * events too, so a tile advertising 25 led to a list of 23.
   */
  upcomingEventsCount?: number
  createdAt?: ApiDate
  updatedAt?: ApiDate
}

export interface Venue {
  id: Ulid
  name: string
  address: string | null
  city: string | null
  country: string | null
  capacity: number | null
  latitude: number | null
  longitude: number | null
  eventsCount?: number
}

export interface Organizer {
  id: Ulid
  userId: Ulid
  companyName: string
  description: string | null
  logo: string | null
  logoThumbnail: string | null
  website: string | null
  /** `pending` until an administrator approves or rejects the application. */
  status: OrganizerStatus
  statusLabel: string
  /**
   * Whether the profile is switched on.
   *
   * Separate from `status`: an approved organiser can be deactivated, and the
   * back-office would then let them sign in to a dead end. Both must be true
   * before the public site hands anyone over.
   */
  isActive: boolean
  /** Why the application was refused. Only set when `status` is `rejected`. */
  rejectionReason?: string | null
  eventsCount?: number

  /**
   * The account behind the organiser, eager-loaded by `GET /organizers/{id}`.
   *
   * This is where the public contact details live — `OrganizerResource` has no
   * e-mail or phone of its own, it nests `UserResource`. Optional because the
   * list endpoint does not load it.
   */
  user?: User
}

export interface TicketType {
  id: Ulid
  eventId: Ulid
  occurrenceId: Ulid | null
  name: string
  description: string | null
  locationDetails: string | null
  benefits: string[]
  isFeatured: boolean
  sortOrder: number

  /** Base price. `currentPrice` already accounts for an active promotion. */
  price: number
  promotionalPrice: number | null
  currentPrice: number
  hasActivePromotion: boolean
  discountPercentage: number | null
  promotionStartDate: ApiDate | null
  promotionEndDate: ApiDate | null

  quantity: number
  soldQuantity: number
  availableQuantity: number
  remainingTickets: number
  soldPercentage: number
  availabilityPercentage: number

  availabilityStatus: AvailabilityStatus
  availabilityStatusLabel: string
  availabilityStatusColor: string
  isAvailableForPurchase: boolean
  urgencyLevel: string

  saleStartDate: ApiDate | null
  saleEndDate: ApiDate | null

  /**
   * The event this type belongs to.
   *
   * Eager-loaded by the order endpoints only, so "my tickets" can name the
   * event without a request per ticket. Absent everywhere else.
   */
  event?: Event
}

export interface EventOccurrence {
  id: Ulid
  eventId: Ulid
  startDate: ApiDate | null
  endDate: ApiDate | null
}

export interface Event {
  id: Ulid
  organizerId: Ulid
  categoryId: Ulid
  venueId: Ulid | null
  title: string
  slug: string
  description: string | null
  banner: string | null
  bannerThumbnail: string | null
  startDate: ApiDate | null
  endDate: ApiDate | null
  maxAttendees: number | null
  status: EventStatus
  statusLabel: string
  eventType: EventType | null
  eventTypeLabel: string | null
  onlineUrl: string | null
  refundAllowed: boolean
  refundDaysBefore: number

  /** Relations, present only when the endpoint eager-loads them. */
  organizer?: Organizer
  category?: EventCategory
  venue?: Venue
  ticketTypes?: TicketType[]

  ticketTypesCount?: number
  favoritesCount?: number

  createdAt?: ApiDate
  updatedAt?: ApiDate
}

/** Ordering accepted by `GET /events?sort=`. */
export type EventSort = 'recent' | 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc'

/** Filters accepted by `GET /events`. All are applied server-side. */
export interface EventListQuery {
  page?: number
  per_page?: number
  search?: string
  city?: string
  category_id?: Ulid
  venue_id?: Ulid
  organizer_id?: Ulid
  status?: EventStatus
  event_type?: EventType
  /** Restricts to events that have not ended yet, or only those that have. */
  when?: 'upcoming' | 'past'
  /** Inclusive date window on the start date, as `YYYY-MM-DD`. */
  starts_after?: string
  starts_before?: string
  /** Keeps events with at least one ticket type at or below this price. */
  max_price?: number
  sort?: EventSort
  [key: string]: string | number | boolean | undefined
}

