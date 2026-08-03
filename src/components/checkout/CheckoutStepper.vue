<script setup lang="ts">
import { BaseIcon } from '@/components/ui'

/**
 * Horizontal progress indicator of the payment funnel.
 *
 * It reports where the visitor is, it does not navigate: letting someone jump
 * back to "Billets" mid-payment would leave an order half-created. Completed
 * steps show a checkmark, as in the mockup.
 */
const props = defineProps<{
  steps: string[]
  /** 1-based index of the step in progress. */
  current: number
}>()

function stateOf(index: number): 'done' | 'current' | 'todo' {
  if (index + 1 < props.current) return 'done'
  if (index + 1 === props.current) return 'current'

  return 'todo'
}
</script>

<template>
  <nav class="stepper" aria-label="Progression de la commande">
    <ol class="stepper__list">
      <li
        v-for="(step, index) in steps"
        :key="step"
        class="stepper__step"
        :class="`stepper__step--${stateOf(index)}`"
        :aria-current="stateOf(index) === 'current' ? 'step' : undefined"
      >
        <span class="stepper__marker">
          <BaseIcon v-if="stateOf(index) === 'done'" name="check" :size="20" />
          <template v-else>{{ index + 1 }}</template>
        </span>

        <span class="stepper__label t-label">{{ step }}</span>

        <span v-if="index < steps.length - 1" class="stepper__line" aria-hidden="true" />
      </li>
    </ol>
  </nav>
</template>

<style scoped>
.stepper__list {
  display: flex;
  align-items: flex-start;
  max-width: 48rem;
  margin-inline: auto;
}

.stepper__step {
  position: relative;
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
  align-items: center;
  text-align: center;
}

.stepper__step:last-child {
  flex: 0 0 auto;
}

.stepper__marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-on-surface-variant);
  font-family: var(--font-display);
  font-weight: 700;
  background-color: var(--color-surface-container-high);
  border-radius: var(--radius-full);
  transition:
    background-color var(--transition-base),
    color var(--transition-base);
}

.stepper__label {
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

/* The connector starts at the middle of this step's marker and runs to the
   middle of the next one. */
.stepper__line {
  position: absolute;
  top: 1.25rem;
  left: calc(50% + 1.75rem);
  width: calc(100% - 3.5rem);
  height: 2px;
  background-color: var(--color-outline-variant);
}

.stepper__step--done .stepper__marker,
.stepper__step--current .stepper__marker {
  color: var(--color-on-primary);
  background-color: var(--color-primary);
}

.stepper__step--done .stepper__label,
.stepper__step--current .stepper__label {
  color: var(--color-primary);
}

.stepper__step--done .stepper__line {
  background-color: var(--color-primary);
}

.stepper__step--current .stepper__marker {
  box-shadow: 0 0 0 4px var(--color-primary-fixed);
}

@media (width <= 640px) {
  .stepper__label {
    font-size: 9px;
  }

  .stepper__marker {
    width: 2rem;
    height: 2rem;
  }

  .stepper__line {
    top: 1rem;
    left: calc(50% + 1.5rem);
    width: calc(100% - 3rem);
  }
}
</style>
