<script setup lang="ts">
import { BaseIcon, type IconName } from '@/components/ui'

/**
 * Figure tile of the signed-in area: icon, label, value.
 *
 * `tone` covers the three treatments the mockups use — a plain white card, one
 * with a red rule down its left edge for the most recent activity, and a solid
 * red one for the loyalty balance.
 */
withDefaults(
  defineProps<{
    icon: IconName
    label: string
    value: string | number
    /** Small line under the value, e.g. "+12 % vs année dernière". */
    hint?: string
    hintIcon?: IconName
    tone?: 'plain' | 'accented' | 'solid'
  }>(),
  { hint: undefined, hintIcon: undefined, tone: 'plain' },
)
</script>

<template>
  <div class="stat" :class="`stat--${tone}`">
    <span class="stat__icon">
      <BaseIcon :name="icon" :size="28" />
    </span>

    <div class="stat__body">
      <p class="stat__label">{{ label }}</p>
      <p class="stat__value t-headline-xl">{{ value }}</p>

      <p v-if="hint" class="stat__hint">
        <BaseIcon v-if="hintIcon" :name="hintIcon" :size="14" />
        {{ hint }}
      </p>
    </div>

    <div v-if="$slots.action" class="stat__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.stat {
  position: relative;
  display: flex;
  gap: var(--space-6);
  align-items: center;
  padding: var(--space-6);
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.stat__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 3.5rem;
  height: 3.5rem;
  color: var(--color-secondary);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-full);
}

.stat__body {
  min-width: 0;
}

.stat__label {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

/* A formatted amount can be much longer than a bare count, so the figure
   scales with the available width instead of overflowing its card. */
.stat__value {
  color: var(--color-on-surface);
  font-size: clamp(1.5rem, 2.6vw, var(--text-headline-xl));
  white-space: nowrap;
}

.stat__hint {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  margin-block-start: var(--space-1);
  color: var(--color-success);
  font-size: var(--text-body-sm);
}

/* Red rule down the left edge. */
.stat--accented::before {
  position: absolute;
  inset-block: 0;
  left: 0;
  width: 4px;
  background-color: var(--color-primary);
  content: '';
}

.stat--accented .stat__icon {
  color: var(--color-secondary);
  background-color: var(--color-surface-container);
}

.stat--solid {
  color: #fff;
  background-color: var(--color-primary);
}

.stat--solid .stat__icon {
  color: #fff;
  background-color: rgb(255 255 255 / 15%);
}

.stat--solid .stat__label,
.stat--solid .stat__value {
  color: #fff;
}

.stat--solid .stat__hint {
  color: rgb(255 255 255 / 85%);
}

.stat__action {
  margin-inline-start: auto;
}

/* The solid card carries an action; stacking keeps the figure and the button
   from fighting for the same row on a narrow column. */
.stat--solid {
  flex-wrap: wrap;
}

.stat--solid .stat__action {
  flex-basis: 100%;
  margin-inline-start: 0;
  margin-block-start: var(--space-3);
}
</style>
