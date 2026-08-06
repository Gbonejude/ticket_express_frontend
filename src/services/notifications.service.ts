import { ENDPOINTS, getList, getOne, post } from '@/api'
import type { Paginated } from '@/types/api'
import type { ApiNotification, Notification } from '@/types/notification'

/**
 * Flattens a raw row into what the UI renders.
 *
 * `GET /notifications` is the one endpoint that returns Laravel's own table
 * rather than an API Resource, so its rows are snake_case with the payload
 * nested under `data`. Normalising here keeps that oddity out of the store and
 * the components.
 */
function toNotification(row: ApiNotification): Notification {
  return {
    id: row.id,
    title: row.data?.title ?? 'Notification',
    message: row.data?.message ?? '',
    level: row.data?.type ?? 'info',
    isRead: row.read_at !== null,
    createdAt: row.created_at,
  }
}

export const notificationsService = {
  /** The signed-in user's notifications, 20 per page. */
  async list(page = 1, signal?: AbortSignal): Promise<Paginated<Notification>> {
    const { items, meta } = await getList<ApiNotification>(ENDPOINTS.notifications.list, {
      params: { page },
      signal,
    })

    return { items: items.map(toNotification), meta }
  },

  /**
   * Number of unread notifications.
   *
   * Its own endpoint rather than a count of the loaded rows: the list is
   * paginated at 20, so counting client-side under-reports as soon as someone
   * has more than that.
   */
  unreadCount(signal?: AbortSignal): Promise<number> {
    return getOne<{ unread: number }>(ENDPOINTS.notifications.unreadCount, { signal }).then(
      ({ unread }) => unread,
    )
  },

  /** Marks one notification as read. */
  async markAsRead(id: string): Promise<void> {
    await post(ENDPOINTS.notifications.markAsRead(id))
  },

  /** Marks every unread notification as read, in a single request. */
  async markAllAsRead(): Promise<void> {
    await post(ENDPOINTS.notifications.markAllAsRead)
  },
}
