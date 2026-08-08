import type { Ulid } from '@/types/api'
import type { Event } from '@/types/event'
import type { Order, Ticket, TicketStatus } from '@/types/order'

import { ordersService } from './orders.service'

/** A ticket resolved with the order and the event it belongs to. */
export interface TicketRow {
  ticket: Ticket
  order: Order
  event: Event | null
}

/** An order awaiting payment: no ticket has been issued against it yet. */
export interface PendingOrderRow {
  order: Order
  event: Event | null
}

/** Both halves of the "Mes billets" screen, from one pass over the orders. */
export interface TicketsOverview {
  rows: TicketRow[]
  pending: PendingOrderRow[]
}

/**
 * The visitor's own tickets.
 *
 * Deliberately built on `GET /orders` rather than `GET /tickets`: that route
 * exists but is a back-office listing gated behind `screen.tickets`, so it
 * answers 403 for a participant and is not scoped to them anyway. `GET /orders`
 * is scoped to the signed-in user and already carries the tickets, the event
 * (through `ticketType.event`) and the download links, so one request returns
 * everything this screen needs.
 */

/** The event behind a ticket, reached through its ticket type. */
function eventOf(ticket: Ticket): Event | null {
  return ticket.ticketType?.event ?? null
}

/**
 * Whether a ticket can no longer be used because its event is behind us.
 *
 * The backend now has an `expired` status, set by the hourly `tickets:expire`
 * command once an event's check-in window has closed. That status is
 * authoritative — but it lags by up to an hour, and the holder looking at their
 * own ticket the minute the concert ends should not read "Valide". The date
 * derivation stays as the immediate signal; the stored status is the durable
 * one. Either is enough.
 */
export function isExpired(row: TicketRow): boolean {
  if (row.ticket.status === 'expired') return true

  const end = row.event?.endDate?.datetime ?? row.event?.startDate?.datetime

  if (!end) return false

  return new Date(end).getTime() < Date.now() && row.ticket.status === 'valid'
}

/**
 * The state shown on a ticket.
 *
 * `pending` is the only one that is not a backend status: it belongs to an
 * order whose payment has not gone through — tickets are only issued by the
 * `OrderPaid` listener, so an unpaid order has none yet and is represented by
 * the order itself.
 */
export type TicketDisplayStatus = TicketStatus | 'pending'

export function displayStatus(row: TicketRow): TicketDisplayStatus {
  return isExpired(row) ? 'expired' : row.ticket.status
}

/** French labels for every state the public site can show. */
export const TICKET_STATUS_LABELS: Record<TicketDisplayStatus, string> = {
  valid: 'Valide',
  used: 'Utilisé',
  expired: 'Expiré',
  cancelled: 'Annulé',
  refunded: 'Remboursé',
  pending: 'En attente',
}

/** Whether the ticket is still usable: not used, cancelled, refunded or past. */
export function isActive(row: TicketRow): boolean {
  return displayStatus(row) === 'valid'
}

/**
 * Public URL of this ticket's QR image.
 *
 * The order carries one URL per ticket, shaped
 * `…/tickets/qr/{token}/{ticketId}`. They are matched on the id in the path
 * rather than on their position in the array: the array is built by iterating
 * the order's tickets, and nothing guarantees the two collections stay in the
 * same order once either is filtered.
 *
 * Both this and {@link pdfDownloadUrl} are token-authenticated public routes,
 * so they work in an `<img src>` or a plain link with no bearer header.
 */
export function qrImageUrl(row: TicketRow): string | null {
  return (
    row.order.downloads?.qrImageUrls?.find((url) => url.endsWith(`/${row.ticket.id}`)) ?? null
  )
}

/**
 * Ce que ce billet a coûté.
 *
 * La ligne de commande fait foi, pas le tarif : `unitPrice` est le montant
 * réellement facturé, promotion comprise, et il ne bouge plus si l'organisateur
 * change son prix après coup. Le tarif courant ne sert que de secours, pour une
 * commande dont les lignes ne seraient pas chargées.
 *
 * `null` quand ni l'un ni l'autre n'est là — l'appelant décide alors quoi
 * afficher plutôt que de montrer « 0 F ».
 */
export function paidPrice(row: TicketRow): number | null {
  const line = row.order.items?.find((item) => item.ticketTypeId === row.ticket.ticketTypeId)

  return line?.unitPrice ?? row.ticket.ticketType?.currentPrice ?? null
}

/** Public URL of the order's ticket PDF, or null when the link has lapsed. */
export function pdfDownloadUrl(order: Order): string | null {
  const downloads = order.downloads

  if (!downloads || !downloads.isValid) return null

  return downloads.downloadUrl
}

/**
 * Every order of the visitor, newest first.
 *
 * The first page tells us how many there are; the rest are then fetched at
 * once rather than one after another. Sequentially, someone with five pages
 * of orders waited for five round-trips before "Mes billets" painted.
 */
async function allOrders(signal?: AbortSignal): Promise<Order[]> {
  const first = await ordersService.list({ page: 1 }, signal)
  const lastPage = first.meta?.last_page ?? 1

  if (lastPage <= 1) return first.items

  const remaining = await Promise.all(
    Array.from({ length: lastPage - 1 }, (_, index) =>
      ordersService.list({ page: index + 2 }, signal),
    ),
  )

  return [...first.items, ...remaining.flatMap((page) => page.items)]
}

function rowsOf(orders: Order[]): TicketRow[] {
  return orders
    // An unpaid order has no tickets issued against it yet.
    .filter((order) => order.status === 'paid')
    .flatMap((order) =>
      (order.tickets ?? []).map((ticket) => ({ ticket, order, event: eventOf(ticket) })),
    )
}

export const ticketsService = {
  /** Every ticket the visitor owns. */
  async list(signal?: AbortSignal): Promise<TicketRow[]> {
    return rowsOf(await allOrders(signal))
  },

  // No `active()` / `history()` here on purpose: each would walk every page of
  // orders again to return a subset of what `list()` already fetched. Callers
  // split one result with `isActive` instead.

  /**
   * Everything the "Mes billets" screen needs, from a single pass.
   *
   * Issued tickets and unpaid orders both come out of the same order list, so
   * asking for them separately fetched every page twice.
   */
  async overview(signal?: AbortSignal): Promise<TicketsOverview> {
    const orders = await allOrders(signal)

    return {
      rows: rowsOf(orders),
      pending: orders
        .filter((order) => order.status === 'pending')
        .map((order) => ({
          order,
          event: order.items?.[0]?.ticketType?.event ?? null,
        })),
    }
  },

  /**
   * One ticket with its order and event.
   *
   * Scans the visitor's orders rather than calling a per-ticket route, because
   * the API has none that a participant may use.
   */
  async get(id: Ulid, signal?: AbortSignal): Promise<TicketRow> {
    const row = rowsOf(await allOrders(signal)).find((entry) => entry.ticket.id === id)

    if (!row) throw new Error(`Billet introuvable : ${id}`)

    return row
  },
}
