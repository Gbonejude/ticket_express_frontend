import type { ApiDate, Ulid } from './api'

/**
 * Domain types mirroring the backend's `V1` API resources.
 * Field names follow the API: responses are camelCase.
 */

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'
export type EventType = 'physical' | 'online'

/** How a ticket type is currently selling. Drives badges on the public site. */
export type AvailabilityStatus =
  'available' | 'limited' | 'almost_sold_out' | 'sold_out' | 'not_started' | 'ended'

export interface EventCategory {
  id: Ulid
  name: string
  slug: string
  eventsCount?: number
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
  status: string
  statusLabel: string
  isActive: boolean
  eventsCount?: number
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
  reviewsCount?: number
  favoritesCount?: number
  averageRating?: number

  createdAt?: ApiDate
  updatedAt?: ApiDate
}

/** Filters accepted by `GET /events`. */
export interface EventListQuery {
  page?: number
  search?: string
  category_id?: Ulid
  venue_id?: Ulid
  organizer_id?: Ulid
  status?: EventStatus
  event_type?: EventType
  [key: string]: string | number | boolean | undefined
}

export interface Review {
  id: Ulid
  eventId: Ulid
  userId: Ulid
  rating: number
  comment: string | null
  createdAt?: ApiDate
}
