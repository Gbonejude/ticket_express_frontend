<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import BaseIcon from './BaseIcon.vue'
import BaseSpinner from './BaseSpinner.vue'
import type { IconName } from './icons'

/**
 * The single button of the design system.
 *
 * It renders a `<button>`, a `<RouterLink>` (`to`) or an `<a>` (`href`) so that
 * a call to action keeps the same look whether it navigates or acts — without
 * anyone having to restyle a link to look like a button.
 *
 * Variants, as they appear in the mockups:
 *  - `primary`  — bright red fill, the action of the screen.
 *  - `deep`     — the darker brand red, for a second solid button next to it.
 *  - `neutral`  — near-black, for a solid action that must not read as the CTA
 *                 (the history table's "Détails", an organiser's "S'abonner").
 *  - `glass`    — translucent over a photo (the hero's secondary action).
 *  - `inverse`  — white on a coloured band, where a red fill would vanish.
 *  - `outline`  — bordered on white, for secondary actions.
 *  - `ghost`    — text only, for tertiary actions and icon buttons.
 *  - `danger`   — destructive actions (cancel an order).
 */
const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'deep' | 'neutral' | 'glass' | 'inverse' | 'outline' | 'ghost' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    /** Renders a `<RouterLink>` instead of a `<button>`. */
    to?: RouteLocationRaw
    /** Renders an `<a>`; use for external destinations only. */
    href?: string
    type?: 'button' | 'submit' | 'reset'
    disabled?: boolean
    /** Shows a spinner and blocks interaction. */
    loading?: boolean
    /** Stretches to the full width of the parent. */
    block?: boolean
    /** Fully rounded, as in the category pills. */
    pill?: boolean
    iconStart?: IconName
    iconEnd?: IconName
    /** Required when the button has no visible text. */
    label?: string
  }>(),
  {
    variant: 'primary',
    size: 'md',
    to: undefined,
    href: undefined,
    type: 'button',
    iconStart: undefined,
    iconEnd: undefined,
    label: undefined,
  },
)

const tag = computed(() => (props.to ? RouterLink : props.href ? 'a' : 'button'))

const isInert = computed(() => props.disabled || props.loading)

/**
 * A disabled link cannot be expressed in HTML, so an inert link drops its
 * destination and is removed from the tab order instead.
 */
const attrs = computed(() => {
  if (props.to) return isInert.value ? { tabindex: -1 } : { to: props.to }
  if (props.href) return isInert.value ? { tabindex: -1 } : { href: props.href }

  return { type: props.type, disabled: isInert.value }
})
</script>

<template>
  <component
    :is="tag"
    v-bind="attrs"
    class="btn"
    :class="[
      `btn--${variant}`,
      `btn--${size}`,
      { 'btn--block': block, 'btn--pill': pill, 'btn--inert': isInert },
    ]"
    :aria-label="label"
    :aria-busy="loading || undefined"
    :aria-disabled="isInert || undefined"
  >
    <BaseSpinner v-if="loading" :size="size === 'sm' ? 14 : 16" />
    <BaseIcon v-else-if="iconStart" :name="iconStart" :size="size === 'sm' ? 16 : 18" />

    <span v-if="$slots.default" class="btn__label"><slot /></span>

    <BaseIcon v-if="iconEnd && !loading" :name="iconEnd" :size="size === 'sm' ? 16 : 18" />
  </component>
</template>

<style scoped>
.btn {
  display: inline-flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: center;
  font-size: var(--text-label-bold);
  font-weight: 700;
  line-height: 1;
  text-align: center;
  white-space: nowrap;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    color var(--transition-fast),
    filter var(--transition-fast),
    transform var(--transition-fast);
}

.btn:active:not(.btn--inert) {
  transform: scale(0.95);
}

.btn--inert {
  opacity: 0.55;
  pointer-events: none;
}

/* --- Sizes --- */
.btn--sm {
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-body-sm);
}

.btn--md {
  padding: var(--space-3) var(--space-5);
}

.btn--lg {
  padding: var(--space-4) var(--space-8);
  font-size: var(--text-body-lg);
}

.btn--pill {
  border-radius: var(--radius-full);
}

/* --- Variants --- */
.btn--primary {
  color: var(--color-on-primary);
  background-color: var(--color-primary-container);
}

.btn--primary:hover:not(.btn--inert) {
  filter: brightness(0.9);
}

.btn--deep {
  color: var(--color-on-primary);
  background-color: var(--color-primary);
}

.btn--deep:hover:not(.btn--inert) {
  background-color: var(--color-surface-tint);
}

.btn--neutral {
  color: var(--color-surface-container-lowest);
  background-color: var(--color-on-surface);
}

.btn--neutral:hover:not(.btn--inert) {
  color: var(--color-surface-container-lowest);
  background-color: var(--color-inverse-surface);
}

.btn--glass {
  color: #fff;
  background-color: rgb(255 255 255 / 10%);
  border-color: rgb(255 255 255 / 30%);
  backdrop-filter: blur(12px);
}

.btn--glass:hover:not(.btn--inert) {
  color: #fff;
  background-color: rgb(255 255 255 / 20%);
}

.btn--inverse {
  color: var(--color-primary);
  background-color: var(--color-surface-container-lowest);
  box-shadow: var(--shadow-lg);
}

.btn--inverse:hover:not(.btn--inert) {
  color: var(--color-primary);
  background-color: var(--color-surface-container-low);
}

.btn--outline {
  color: var(--color-on-surface);
  background-color: var(--color-surface-container-lowest);
  border-color: var(--color-surface-variant);
}

.btn--outline:hover:not(.btn--inert) {
  color: var(--color-primary);
  border-color: var(--color-primary-container);
}

.btn--ghost {
  color: var(--color-primary);
  background-color: transparent;
}

.btn--ghost:hover:not(.btn--inert) {
  color: var(--color-primary);
  background-color: var(--color-surface-variant);
}

.btn--danger {
  color: var(--color-on-error);
  background-color: var(--color-error);
}

.btn--danger:hover:not(.btn--inert) {
  filter: brightness(1.1);
}

.btn--block {
  display: flex;
  width: 100%;
}

/* An icon-only button should be square rather than wide. */
.btn:not(:has(.btn__label)) {
  padding: var(--space-2);
  border-radius: var(--radius-full);
}
</style>
