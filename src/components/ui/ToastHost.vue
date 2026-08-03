<script setup lang="ts">
import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'
import { useUiStore, type ToastVariant } from '@/stores/ui.store'

/**
 * Renders the toast queue held by the UI store.
 *
 * Mounted once in `App.vue`, so any page can call `ui.notify(...)` without
 * knowing where the message will appear. The region is `aria-live="polite"`:
 * announced, but never interrupting what the user is doing.
 */
const ui = useUiStore()

const icons: Record<ToastVariant, IconName> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
}
</script>

<template>
  <Teleport to="body">
    <div class="toasts" role="region" aria-live="polite" aria-label="Notifications">
      <TransitionGroup name="toast">
        <div
          v-for="toast in ui.toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.variant}`"
        >
          <BaseIcon class="toast__icon" :name="icons[toast.variant]" :size="20" />
          <p class="toast__message">{{ toast.message }}</p>

          <button
            class="toast__close"
            type="button"
            aria-label="Fermer la notification"
            @click="ui.dismiss(toast.id)"
          >
            <BaseIcon name="close" :size="16" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toasts {
  position: fixed;
  right: var(--space-4);
  bottom: var(--space-4);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: min(24rem, calc(100vw - var(--space-8)));
  pointer-events: none;
}

.toast {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  padding: var(--space-4);
  font-size: var(--text-body-sm);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-inline-start: 3px solid currentcolor;
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  pointer-events: auto;
}

.toast__message {
  flex: 1;
  color: var(--color-on-surface);
}

.toast__close {
  display: flex;
  color: var(--color-on-surface-variant);
}

.toast--success {
  color: var(--color-success);
}

.toast--error {
  color: var(--color-error);
}

.toast--warning {
  color: var(--color-secondary);
}

.toast--info {
  color: var(--color-tertiary);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity var(--transition-base),
    transform var(--transition-base);
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
