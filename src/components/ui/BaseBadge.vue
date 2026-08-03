<script setup lang="ts">
import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'

/**
 * Small status label: the corner flags on event cards (EN COURS, PROMOTION),
 * and the order and ticket statuses.
 *
 * Variants map to meaning, not to colour, so a status keeps the same hue on
 * every page: `success` is always green, `danger` always red.
 */
withDefaults(
  defineProps<{
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'outline' | 'inverse'
    /** Pill shape instead of the default small radius. */
    pill?: boolean
    icon?: IconName
  }>(),
  { variant: 'primary', icon: undefined },
)
</script>

<template>
  <span class="badge" :class="[`badge--${variant}`, { 'badge--pill': pill }]">
    <BaseIcon v-if="icon" :name="icon" :size="12" />
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  padding: var(--space-1) var(--space-2);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
}

.badge--pill {
  padding-inline: var(--space-3);
  border-radius: var(--radius-full);
}

.badge--primary {
  color: var(--color-on-primary);
  background-color: var(--color-primary-container);
}

.badge--success {
  color: #fff;
  background-color: var(--color-success);
}

.badge--warning {
  color: var(--color-tertiary);
  background-color: var(--color-tertiary-fixed);
}

.badge--danger {
  color: var(--color-on-error-container);
  background-color: var(--color-error-container);
}

.badge--neutral {
  color: var(--color-secondary);
  background-color: var(--color-surface-container-high);
}

.badge--outline {
  color: var(--color-secondary);
  background-color: transparent;
  border-color: var(--color-surface-variant);
}

/* Sits on top of a photo: translucent white, readable over any image. */
.badge--inverse {
  color: var(--color-on-surface);
  background-color: rgb(255 255 255 / 90%);
  backdrop-filter: blur(8px);
}
</style>
