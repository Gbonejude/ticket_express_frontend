import { ENDPOINTS, getList, getOne, post } from '@/api'
import type { Paginated, Ulid } from '@/types/api'
import type { CreateOrderPayload, Order, OrderStatus } from '@/types/order'

/** Filters accepted by `GET /orders`, all applied server-side. */
export interface OrderListQuery {
  page?: number
  status?: OrderStatus
  search?: string
}

/**
 * Checkout and order history.
 *
 * `create` is the only route open to guests — a visitor can buy without an
 * account. Every other route requires a signed-in user.
 */
export const ordersService = {
  /** Places an order. Works signed in or as a guest. */
  create(payload: CreateOrderPayload): Promise<Order> {
    return post<Order, CreateOrderPayload>(ENDPOINTS.orders.create, payload)
  },

  /** Orders of the signed-in user. The API scopes them; no user id is sent. */
  list(query: OrderListQuery = {}, signal?: AbortSignal): Promise<Paginated<Order>> {
    return getList<Order>(ENDPOINTS.orders.list, {
      params: { page: query.page ?? 1, status: query.status, search: query.search },
      signal,
    })
  },

  /** One order with its items, tickets and download links. */
  get(id: Ulid, signal?: AbortSignal): Promise<Order> {
    return getOne<Order>(ENDPOINTS.orders.detail(id), { signal })
  },

  /** Cancels an order that has not been paid yet. */
  cancel(id: Ulid): Promise<Order> {
    return post<Order>(ENDPOINTS.orders.cancel(id))
  },
}
