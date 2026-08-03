<script setup lang="ts">
import { computed } from 'vue'

import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'

/**
 * Inline message block: form-level errors, informational notes, the "paiement
 * sécurisé" reassurance panel.
 *
 * `error` renders with `role="alert"` so assistive technology announces it as
 * soon as it appears; the other variants stay quiet.
 */
const props = withDefaults(
  defineProps<{
    variant?: 'info' | 'success' | 'warning' | 'error'
    title?: string
    /** Overrides the icon implied by the variant. */
    icon?: IconName
    dismissible?: boolean
  }>(),
  { variant: 'info', title: undefined, icon: undefined },
)

defineEmits<{ dismiss: [] }>()

const defaultIcons: Record<string, IconName> = {
  info: 'info',
  success: 'check_circle',
  warning: 'warning',
  error: 'error',
}

const resolvedIcon = computed(() => props.icon ?? defaultIcons[props.variant] ?? 'info')
</script>

<template>
  <div class="alert" :class="`alert--${variant}`" :role="variant === 'error' ? 'alert' : 'status'">
    <BaseIcon class="alert__icon" :name="resolvedIcon" :size="20" />

    <div class="alert__body">
      <p v-if="title" class="alert__title">{{ title }}</p>
      <div class="alert__content"><slot /></div>
    </div>

    <button
      v-if="dismissible"
      class="alert__close"
      type="button"
      aria-label="Fermer le message"
      @click="$emit('dismiss')"
    >
      <BaseIcon name="close" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.alert {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4);
  font-size: var(--text-body-sm);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
}

.alert__icon {
  margin-block-start: 0.125rem;
}

.alert__body {
  flex: 1;
}

.alert__title {
  margin-block-end: var(--space-1);
  font-weight: 700;
}

.alert__close {
  display: flex;
  color: inherit;
  opacity: 0.7;
}

.alert__close:hover {
  opacity: 1;
}

.alert--info {
  color: var(--color-tertiary);
  background-color: #e6f4f2;
  border-color: #b9e0da;
}

.alert--success {
  color: #0f5132;
  background-color: #e3f3ea;
  border-color: #b7dfc8;
}

.alert--warning {
  color: var(--color-on-secondary-container);
  background-color: var(--color-secondary-fixed);
  border-color: var(--color-secondary-container);
}

.alert--error {
  color: var(--color-on-error-container);
  background-color: var(--color-error-container);
  border-color: #f5b5b0;
}
</style>
