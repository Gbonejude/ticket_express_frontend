import type { Event, TicketType } from '@/types/event'

/**
 * Display helpers derived from an `Event`.
 *
 * The API sends the raw resource; the cards need a cover image, a place, a
 * "from" price and a highlight flag. Deriving those here — rather than in each
 * component — means the home page, the explore page and the dashboard all show
 * the same event the same way.
 */

/** Cover image, preferring the full banner and falling back to the thumbnail. */
export function eventCover(event: Event): string | null {
  return event.banner ?? event.bannerThumbnail ?? null
}

/** "Stade de Kégué, Lomé" — or the online label for a remote event. */
export function eventLocation(event: Event): string {
  if (event.eventType === 'online') return event.eventTypeLabel ?? 'En ligne'

  const parts = [event.venue?.name, event.venue?.city].filter(Boolean)

  return parts.length ? parts.join(', ') : '—'
}

/** Ticket types that can still be bought. */
export function sellableTicketTypes(event: Event): TicketType[] {
  return (event.ticketTypes ?? []).filter((type) => type.isAvailableForPurchase)
}

/**
 * Cheapest price on sale, or `null` when nothing is available.
 * `currentPrice` already accounts for an active promotion.
 */
export function eventStartingPrice(event: Event): number | null {
  const prices = (event.ticketTypes ?? []).map((type) => type.currentPrice)

  return prices.length ? Math.min(...prices) : null
}

/** Label above the price: "Gratuit" reads better than "À partir de 0 FCFA". */
export function eventPriceCaption(event: Event): string {
  const price = eventStartingPrice(event)

  if (price === null) return 'Indisponible'
  if (price === 0) return 'Entrée'

  return (event.ticketTypes?.length ?? 0) > 1 ? 'À partir de' : 'Tarif unique'
}

/**
 * Crossed-out price shown next to a discounted one.
 * `null` when no ticket type is on promotion, so the card renders nothing.
 */
export function promotionalReference(event: Event): number | null {
  const cheapest = (event.ticketTypes ?? [])
    .filter((type) => type.hasActivePromotion)
    .sort((a, b) => a.currentPrice - b.currentPrice)[0]

  return cheapest?.price ?? null
}

export type EventHighlight =
  'ongoing' | 'promotion' | 'last-chance' | 'sold-out' | 'new' | 'popular' | null

/**
 * The corner flag on an event card.
 *
 * Only one can be shown, so they are ordered by how much they should change the
 * visitor's behaviour: a sold-out event must not look like a promotion, and an
 * event already under way outranks everything else.
 */
export function eventHighlight(event: Event): EventHighlight {
  const types = event.ticketTypes ?? []
  const now = Date.now()
  const start = event.startDate ? Date.parse(event.startDate.datetime) : null
  const end = event.endDate ? Date.parse(event.endDate.datetime) : null

  if (start !== null && end !== null && start <= now && now <= end) return 'ongoing'

  if (types.length > 0 && types.every((type) => type.availabilityStatus === 'sold_out')) {
    return 'sold-out'
  }

  if (types.some((type) => type.availabilityStatus === 'almost_sold_out')) return 'last-chance'
  if (types.some((type) => type.hasActivePromotion)) return 'promotion'
  if ((event.favoritesCount ?? 0) >= 500) return 'popular'

  return null
}

export const HIGHLIGHT_LABELS: Record<NonNullable<EventHighlight>, string> = {
  ongoing: 'En cours',
  promotion: 'Promotion',
  'last-chance': 'Dernières places',
  'sold-out': 'Complet',
  new: 'Nouveau',
  popular: 'Populaire',
}

export const HIGHLIGHT_VARIANTS: Record<
  NonNullable<EventHighlight>,
  'primary' | 'success' | 'warning' | 'neutral'
> = {
  ongoing: 'success',
  promotion: 'primary',
  'last-chance': 'warning',
  'sold-out': 'neutral',
  new: 'success',
  popular: 'primary',
}
