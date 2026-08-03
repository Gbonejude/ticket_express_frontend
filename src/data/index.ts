import { mockApi } from '@/mocks'

/**
 * The single seam between the pages and where their data comes from.
 *
 * Pages import `dataSource` and nothing else — never a service, never a mock.
 * That is what makes the API phase a change to this file rather than a change
 * to every screen.
 *
 * Today it points at the in-memory fixtures. When the backend is available,
 * replace the binding below with the real services, whose signatures the mock
 * already mirrors:
 *
 * ```ts
 * import { catalogService, eventsService, ordersService } from '@/services'
 *
 * export const dataSource = {
 *   events: {
 *     list: (query) => eventsService.list(query),
 *     get: (id) => eventsService.get(id),
 *     // …
 *   },
 *   // …
 * }
 * ```
 *
 * Anything the mock exposes that has no endpoint yet — `events.featured`,
 * `account.dashboard` — marks a route still to be agreed with the backend, and
 * is deliberately visible here rather than buried in a component.
 */
export const dataSource = mockApi

export type { DashboardSummary, EventSort } from '@/mocks'
