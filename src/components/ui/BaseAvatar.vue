<script setup lang="ts">
import { computed } from 'vue'

import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'

/**
 * Round identity chip: an image when there is one, otherwise the initials, and
 * a neutral icon as the last resort.
 *
 * Organiser logos are user-supplied and often missing, so the fallback chain is
 * part of the component rather than something each caller re-implements.
 */
const props = withDefaults(
  defineProps<{
    src?: string | null
    /** Used for the alt text and to derive the initials. */
    name?: string | null
    size?: number
    icon?: IconName
  }>(),
  { src: null, name: null, size: 40, icon: 'person' },
)

const initials = computed(() => {
  if (!props.name) return ''

  return props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('')
})
</script>

<template>
  <span class="avatar" :style="{ '--avatar-size': `${size}px` }">
    <img v-if="src" class="avatar__image" :src="src" :alt="name ?? ''" loading="lazy" />
    <span v-else-if="initials" class="avatar__initials">{{ initials }}</span>
    <BaseIcon v-else :name="icon" :size="Math.round(size * 0.5)" />
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--avatar-size);
  height: var(--avatar-size);
  overflow: hidden;
  color: var(--color-on-surface-variant);
  background-color: var(--color-surface-container-low);
  border-radius: var(--radius-full);
}

.avatar__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar__initials {
  font-family: var(--font-display);
  font-size: calc(var(--avatar-size) * 0.38);
  font-weight: 700;
  line-height: 1;
}
</style>
