<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { BaseAlert, BaseBadge, BaseButton, BaseEmptyState, BaseIcon, BaseSkeleton } from '@/components/ui'
import type { IconName } from '@/components/ui'
import { useNotificationsStore } from '@/stores/notifications.store'
import { useUiStore } from '@/stores/ui.store'
import type { Notification } from '@/types/notification'
import { formatRelativeFromIso } from '@/utils/format'

/**
 * Notifications of the signed-in visitor.
 *
 * `GET /notifications` returns the first 20; the API exposes no unread count of
 * its own, so the badge is derived from what is loaded — see the store. Marking
 * all as read costs one request per row for the same reason.
 */
const store = useNotificationsStore()
const ui = useUiStore()

const error = ref<string | null>(null)
const isMarkingAll = ref(false)

const items = computed(() => store.items)

const ICONS: Record<Notification['level'], IconName> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

const VARIANTS: Record<Notification['level'], 'primary' | 'success' | 'warning' | 'danger'> = {
  info: 'primary',
  success: 'success',
  warning: 'warning',
  error: 'danger',
}

async function markAsRead(id: string): Promise<void> {
  try {
    await store.markAsRead(id)
  } catch {
    ui.notify('Impossible de marquer cette notification comme lue.', 'error')
  }
}

async function markAll(): Promise<void> {
  isMarkingAll.value = true

  try {
    await store.markAllAsRead()
  } finally {
    isMarkingAll.value = false
  }
}

onMounted(async () => {
  try {
    await store.load(true)
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : 'Chargement impossible.'
  }
})
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1 class="t-headline-xl">Notifications</h1>
        <p class="head__lead t-body-lg">
          <template v-if="store.unreadCount > 0">
            Vous avez {{ store.unreadCount }} notification{{ store.unreadCount > 1 ? 's' : '' }} non
            lue{{ store.unreadCount > 1 ? 's' : '' }}.
          </template>
          <template v-else>Vous êtes à jour.</template>
        </p>
      </div>

      <BaseButton
        v-if="store.unreadCount > 0"
        variant="outline"
        :loading="isMarkingAll"
        @click="markAll"
      >
        Tout marquer comme lu
      </BaseButton>
    </header>

    <BaseAlert v-if="error" variant="error" title="Chargement impossible">{{ error }}</BaseAlert>

    <div v-else-if="store.isLoading" class="list">
      <BaseSkeleton v-for="n in 4" :key="n" variant="block" height="5rem" />
    </div>

    <BaseEmptyState
      v-else-if="items.length === 0"
      icon="notifications"
      title="Aucune notification"
      description="Vos confirmations de commande et rappels d'événement apparaîtront ici."
    />

    <ul v-else class="list">
      <li
        v-for="item in items"
        :key="item.id"
        class="row"
        :class="{ 'row--unread': !item.isRead }"
      >
        <span class="row__icon" :class="`row__icon--${item.level}`">
          <BaseIcon :name="ICONS[item.level]" :size="20" />
        </span>

        <div class="row__body">
          <p class="row__title">
            {{ item.title }}
            <BaseBadge v-if="!item.isRead" :variant="VARIANTS[item.level]">Nouveau</BaseBadge>
          </p>
          <p v-if="item.message" class="row__message">{{ item.message }}</p>
          <p class="row__time">{{ formatRelativeFromIso(item.createdAt) }}</p>
        </div>

        <BaseButton
          v-if="!item.isRead"
          variant="ghost"
          size="sm"
          label="Marquer comme lu"
          icon-start="check_circle"
          @click="markAsRead(item.id)"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-gutter);
  align-items: flex-start;
  justify-content: space-between;
  margin-block-end: var(--space-section-gap);
}

.head__lead {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
}

.list {
  display: grid;
  gap: var(--space-stack-md);
}

.row {
  display: flex;
  gap: var(--space-stack-md);
  align-items: flex-start;
  padding: var(--space-4);
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-lg);
}

.row--unread {
  background-color: var(--color-surface-variant);
  border-color: var(--color-primary);
}

.row__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-on-primary-container);
  background-color: var(--color-primary-container);
  border-radius: var(--radius-full);
}

.row__body {
  flex: 1;
  min-width: 0;
}

.row__title {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
  font-weight: 700;
}

.row__message {
  margin-block-start: var(--space-1, 0.25rem);
  color: var(--color-on-surface-variant);
}

.row__time {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}
</style>
