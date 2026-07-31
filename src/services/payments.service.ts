import { ENDPOINTS, getOne, post } from '@/api'
import type { Ulid } from '@/types/api'
import type { InitiatePaymentPayload, Payment } from '@/types/order'

/**
 * Mobile-money payments through PayGate (FLOOZ / TMONEY).
 *
 * The flow is asynchronous: `initiate` triggers the USSD prompt on the payer's
 * phone, PayGate calls the backend webhook once it resolves, and the frontend
 * polls `status` until the payment leaves the `pending` state.
 */
export const paymentsService = {
  /** Starts a payment for an order and pushes the prompt to the payer's phone. */
  initiate(payload: InitiatePaymentPayload): Promise<Payment> {
    return post<Payment, InitiatePaymentPayload>(ENDPOINTS.payments.initiate, payload)
  },

  /** Current state of a payment. Poll this after `initiate`. */
  status(paymentId: Ulid, signal?: AbortSignal): Promise<Payment> {
    return getOne<Payment>(ENDPOINTS.payments.status(paymentId), { signal })
  },
}
