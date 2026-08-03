<script setup lang="ts">
import { computed } from 'vue'

import BaseIcon from './BaseIcon.vue'

/**
 * − / value / + control for picking a number of tickets.
 *
 * The value is rendered as text rather than a number input: on the event page
 * the quantity is bounded by what is left in stock, and a free-text field would
 * let a visitor type a number the server will only reject at checkout.
 * `max` therefore comes from the ticket type's remaining stock.
 */
const props = withDefaults(
  defineProps<{
    min?: number
    max?: number
    /** Names what is being counted, for screen readers. */
    label?: string
    disabled?: boolean
  }>(),
  { min: 0, max: 10, label: 'Quantité' },
)

const model = defineModel<number>({ default: 0 })

const canDecrease = computed(() => !props.disabled && model.value > props.min)
const canIncrease = computed(() => !props.disabled && model.value < props.max)

function step(delta: number): void {
  model.value = Math.min(props.max, Math.max(props.min, model.value + delta))
}
</script>

<template>
  <div class="stepper" :class="{ 'stepper--disabled': disabled }">
    <button
      class="stepper__button"
      type="button"
      :disabled="!canDecrease"
      :aria-label="`Retirer un ${label.toLowerCase()}`"
      @click="step(-1)"
    >
      <BaseIcon name="remove" :size="18" />
    </button>

    <output class="stepper__value" :aria-label="label">{{ model }}</output>

    <button
      class="stepper__button"
      type="button"
      :disabled="!canIncrease"
      :aria-label="`Ajouter un ${label.toLowerCase()}`"
      @click="step(1)"
    >
      <BaseIcon name="add" :size="18" />
    </button>
  </div>
</template>

<style scoped>
.stepper {
  display: inline-flex;
  align-items: center;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-full);
}

.stepper__button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-primary);
  border-radius: var(--radius-full);
  transition:
    background-color var(--transition-fast),
    opacity var(--transition-fast);
}

.stepper__button:hover:not(:disabled) {
  background-color: var(--color-surface-container);
}

.stepper__button:disabled {
  color: var(--color-outline-variant);
  cursor: not-allowed;
}

.stepper__value {
  min-width: 2rem;
  font-family: var(--font-display);
  font-size: var(--text-body-lg);
  font-weight: 700;
  text-align: center;
}

.stepper--disabled {
  opacity: 0.55;
}
</style>
