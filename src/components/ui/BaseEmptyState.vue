<script setup lang="ts">
import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'

/**
 * Shown in place of a list that has no rows — the "Aucune commande trouvée"
 * block in the order history, and the same treatment for empty favourites,
 * tickets and search results.
 *
 * An empty state always offers a way out; that is why the action slot exists.
 */
withDefaults(
  defineProps<{
    icon?: IconName
    title: string
    description?: string
    /**
     * Heading level of the title. An empty state stands in for a whole
     * section's content, so `h2` is the default; a panel nested under another
     * heading can lower it.
     */
    level?: 'h2' | 'h3'
  }>(),
  { icon: 'sentiment_dissatisfied', description: undefined, level: 'h2' },
)
</script>

<template>
  <div class="empty">
    <span class="empty__icon">
      <BaseIcon :name="icon" :size="32" />
    </span>

    <component :is="level" class="empty__title t-headline-md">{{ title }}</component>
    <p v-if="description" class="empty__description">{{ description }}</p>

    <div v-if="$slots.action" class="empty__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-16) var(--space-6);
  text-align: center;
}

.empty__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  margin-block-end: var(--space-5);
  color: var(--color-primary);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-full);
}

.empty__title {
  color: var(--color-on-surface);
}

.empty__description {
  max-width: 32rem;
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}

.empty__action {
  margin-block-start: var(--space-6);
}
</style>
