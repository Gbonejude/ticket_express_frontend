import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

import { notificationsService } from '@/services'
import type { Notification } from '@/types/notification'

import { useAuthStore } from './auth.store'

/**
 * Notifications of the signed-in visitor.
 *
 * The badge reads its own endpoint rather than counting loaded rows: the list
 * is paginated at 20, so a count derived from it silently under-reports for
 * anyone with more. `refreshCount()` is therefore cheap enough to call from the
 * header without loading the list at all.
 */
export const useNotificationsStore = defineStore('notifications', () => {
  // --- State ---
  const items = ref<Notification[]>([])
  const isLoading = ref(false)
  const isLoaded = ref(false)

  /** Authoritative count from the API; falls back to the loaded rows. */
  const serverUnreadCount = ref<number | null>(null)

  // --- Getters ---
  const unread = computed(() => items.value.filter((item) => !item.isRead))
  const unreadCount = computed(() => serverUnreadCount.value ?? unread.value.length)

  // --- Actions ---
  async function load(force = false): Promise<void> {
    const auth = useAuthStore()

    if (!auth.isAuthenticated) {
      reset()

      return
    }

    if (isLoaded.value && !force) return

    isLoading.value = true

    try {
      const { items: rows } = await notificationsService.list()

      items.value = rows
      isLoaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Refreshes just the badge.
   *
   * Cheap enough for the header to call on every navigation, which loading the
   * whole list would not be.
   */
  async function refreshCount(): Promise<void> {
    const auth = useAuthStore()

    if (!auth.isAuthenticated) {
      serverUnreadCount.value = null

      return
    }

    try {
      serverUnreadCount.value = await notificationsService.unreadCount()
    } catch {
      // A missing badge is better than a broken header.
    }
  }

  /** Marks one row read, optimistically. */
  async function markAsRead(id: string): Promise<void> {
    const row = items.value.find((item) => item.id === id)

    if (!row || row.isRead) return

    row.isRead = true
    if (serverUnreadCount.value !== null) serverUnreadCount.value -= 1

    try {
      await notificationsService.markAsRead(id)
    } catch (error) {
      row.isRead = false
      if (serverUnreadCount.value !== null) serverUnreadCount.value += 1

      throw error
    }
  }

  /** Marks every unread notification read, in a single request. */
  async function markAllAsRead(): Promise<void> {
    const previous = items.value.map((item) => item.isRead)

    items.value.forEach((item) => {
      item.isRead = true
    })
    serverUnreadCount.value = 0

    try {
      await notificationsService.markAllAsRead()
    } catch (error) {
      items.value.forEach((item, index) => {
        item.isRead = previous[index] ?? false
      })
      await refreshCount()

      throw error
    }
  }

  function reset(): void {
    items.value = []
    isLoaded.value = false
    serverUnreadCount.value = null
  }

  return {
    items,
    isLoading,
    isLoaded,
    unread,
    unreadCount,
    load,
    refreshCount,
    markAsRead,
    markAllAsRead,
    reset,
  }
})
