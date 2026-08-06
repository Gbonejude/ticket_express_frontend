import { ENDPOINTS, getOne } from '@/api'
import type { Ulid } from '@/types/api'

/** What `GET /coupons/validate` answers with when the code is usable. */
export interface CouponValidation {
  valid: boolean
  coupon: {
    id: Ulid
    code: string
    /** `percent` applies a rate, `fixed` a flat amount in the platform currency. */
    type: 'percent' | 'fixed'
    value: number
  }
}

/**
 * Promo codes, checked before the order is placed.
 *
 * The route is public and read-only: it says whether a code exists, is still
 * open and applies to this event. It does *not* reserve it — the discount is
 * only really applied when `POST /orders` receives `coupon_code`, which is what
 * the checkout sends. Validating first exists so the buyer sees the new total
 * before paying, not so the front can compute the price it likes.
 *
 * An unusable code answers 422 with the reason already in French.
 */
export const couponsService = {
  validate(code: string, eventId?: Ulid, signal?: AbortSignal): Promise<CouponValidation> {
    return getOne<CouponValidation>(ENDPOINTS.coupons.validate, {
      params: { code, event_id: eventId },
      signal,
    })
  },
}

/**
 * The discount a validated coupon takes off a basket.
 *
 * Mirrors the backend's own arithmetic so the summary and the invoice agree;
 * the server stays the authority — this is only what the buyer is shown.
 */
export function discountFor(validation: CouponValidation, subtotal: number): number {
  const { type, value } = validation.coupon

  const raw = type === 'percent' ? (subtotal * value) / 100 : value

  // Never discount below zero, whatever the coupon says.
  return Math.min(Math.round(raw), subtotal)
}
