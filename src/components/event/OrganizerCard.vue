<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { BaseAvatar } from '@/components/ui'
import type { Organizer } from '@/types/event'

/**
 * Tile of the "Organisateurs vedettes" grid: round portrait, name, event count.
 *
 * `featured` draws the red ring the mockup puts on the first entry.
 */
withDefaults(defineProps<{ organizer: Organizer; featured?: boolean }>(), { featured: false })
</script>

<template>
  <RouterLink
    class="organizer"
    :class="{ 'organizer--featured': featured }"
    :to="{ name: 'events', query: { organisateur: organizer.id } }"
  >
    <span class="organizer__portrait">
      <BaseAvatar
        :src="organizer.logoThumbnail ?? organizer.logo"
        :name="organizer.companyName"
        :size="80"
        icon="storefront"
      />
    </span>

    <span class="organizer__name">{{ organizer.companyName }}</span>
    <span v-if="organizer.eventsCount !== undefined" class="organizer__count">
      {{ organizer.eventsCount }} {{ organizer.eventsCount > 1 ? 'événements' : 'événement' }}
    </span>
  </RouterLink>
</template>

<style scoped>
.organizer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-4);
  color: var(--color-on-surface);
  text-align: center;
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-lg);
  transition: box-shadow var(--transition-base);
}

.organizer:hover {
  color: var(--color-on-surface);
  box-shadow: var(--shadow-md);
}

.organizer__portrait {
  display: flex;
  margin-block-end: var(--space-3);
  border: 2px solid transparent;
  border-radius: var(--radius-full);
}

.organizer--featured .organizer__portrait {
  border-color: var(--color-primary);
}

.organizer__name {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.organizer__count {
  margin-block-start: var(--space-1);
  color: var(--color-secondary);
  font-size: 10px;
}
</style>
