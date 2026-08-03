import type { ApiDate, Ulid } from './api'
import type { TicketType } from './event'
import type { User } from './user'

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'refunded' | 'failed'
export type TicketStatus = 'valid' | 'used' | 'cancelled' | 'refunded'
/**
 * How the buyer receives the ticket.
 *
 * `whatsapp` sends a download URL over WhatsApp; `both` sends the e-mail and
 * the WhatsApp link. `download` is the direct download from the order page.
 */
export type DeliveryMethod = 'download' | 'email' | 'whatsapp' | 'both'

/** Mobile-money providers wired to PayGate. */
export type PaymentMethod = 'FLOOZ' | 'TMONEY'
export type PaymentStatus = 'pending' | 'success' | 'failed' | 'cancelled'

export interface OrderItem {
  id: Ulid
  orderId: Ulid
  ticketTypeId: Ulid
  quantity: number
  unitPrice: number
  subtotal: number
  ticketType?: TicketType
}

export interface Ticket {
  id: Ulid
  orderId: Ulid
  ticketTypeId: Ulid
  attendeeName: string | null
  attendeeEmail: string | null
  qrCode: string | null
  ticketNumber: string
  status: TicketStatus
  statusLabel: string
  checkedInAt: ApiDate | null
  isCheckedIn: boolean
  accessMethod: string | null
  isOnlineAccess: boolean
  isPhysicalAccess: boolean
  onlineAccessLink: string | null
  ticketType?: TicketType
}

export interface Payment {
  id: Ulid
  orderId: Ulid
  amount: number
  method: PaymentMethod
  methodLabel: string
  transactionReference: string | null
  status: PaymentStatus
  statusLabel: string
  paidAt: ApiDate | null
}

/** Token-based download links attached to a paid order. */
export interface OrderDownloads {
  downloadUrl: string
  qrImageUrls: string[]
  whatsappLink: string | null
  expiresAt: ApiDate | null
  downloadCount: number
  maxDownloads: number
  isValid: boolean
  isExpired: boolean
}

export interface Order {
  id: Ulid
  orderNumber: string
  userId: Ulid | null
  firstName: string
  lastName: string
  fullName: string
  email: string
  phone: string
  totalAmount: number
  commissionRate: number
  commissionAmount: number
  netAmount: number
  status: OrderStatus
  statusLabel: string
  paymentMethod: string | null
  deliveryMethod: DeliveryMethod
  deliveryMethodLabel: string
  downloads: OrderDownloads | null
  user?: User
  items?: OrderItem[]
  tickets?: Ticket[]
  payments?: Payment[]
  itemsCount?: number
  ticketsCount?: number
  createdAt?: ApiDate
  updatedAt?: ApiDate
}

/** One line of a checkout basket. Request bodies are snake_case. */
export interface CreateOrderItemPayload {
  ticket_type_id: Ulid
  quantity: number
}

/** Body for `POST /orders`. Guest checkout is allowed: `user_id` is optional. */
export interface CreateOrderPayload {
  first_name: string
  last_name: string
  email: string
  phone: string
  delivery_method: DeliveryMethod
  items: CreateOrderItemPayload[]
  coupon_code?: string
}

/** Body for `POST /payments/initiate`. */
export interface InitiatePaymentPayload {
  order_id: Ulid
  method: PaymentMethod
  phone_number: string
}
