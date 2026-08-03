<script setup lang="ts">
import { computed, useId } from 'vue'

import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'

/**
 * Radio button, in two shapes.
 *
 * `inline` is the plain control used in a list of short options. `card` is the
 * large selectable panel the checkout uses for payment methods and the
 * guest/sign-in choice — the whole panel is the label, so the entire surface is
 * clickable and the selected state is visible at a glance.
 */
const props = withDefaults(
  defineProps<{
    /** Value written to the model when this radio is picked. */
    value: string | number
    label?: string
    description?: string
    icon?: IconName
    /** Path to a logo shown instead of the icon (payment providers). */
    logo?: string
    variant?: 'inline' | 'card'
    disabled?: boolean
    name?: string
  }>(),
  {
    label: undefined,
    description: undefined,
    icon: undefined,
    logo: undefined,
    variant: 'inline',
    name: undefined,
  },
)

const model = defineModel<string | number | null>({ default: null })

const id = useId()

const isChecked = computed(() => model.value === props.value)
</script>

<template>
  <div
    class="radio"
    :class="[`radio--${variant}`, { 'radio--checked': isChecked, 'radio--disabled': disabled }]"
  >
    <input
      :id="id"
      v-model="model"
      class="radio__input"
      type="radio"
      :value="value"
      :name="name"
      :disabled="disabled"
    />

    <label class="radio__label" :for="id">
      <span v-if="variant === 'card' && (icon || logo)" class="radio__media">
        <img v-if="logo" :src="logo" :alt="''" class="radio__logo" />
        <BaseIcon v-else-if="icon" :name="icon" :size="24" />
      </span>

      <span class="radio__body">
        <span class="radio__title"
          ><slot>{{ label }}</slot></span
        >
        <span v-if="description" class="radio__description">{{ description }}</span>
      </span>

      <slot name="trailing" />
    </label>
  </div>
</template>

<style scoped>
.radio__input {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.radio__label {
  display: flex;
  flex: 1;
  gap: var(--space-3);
  align-items: center;
  cursor: pointer;
}

.radio__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
}

.radio__title {
  color: var(--color-on-surface);
  font-weight: 700;
}

.radio__description {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
  line-height: 1.4;
}

/* --- inline --- */
.radio--inline {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.radio--inline .radio__title {
  font-weight: 400;
}

/* --- card --- */
.radio--card {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    background-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.radio--card:hover:not(.radio--disabled) {
  border-color: var(--color-primary);
}

.radio--card.radio--checked {
  border-color: var(--color-primary);
  background-color: var(--color-surface-container-low);
  box-shadow: 0 0 0 1px var(--color-primary);
}

.radio__media {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  color: var(--color-primary);
  background-color: var(--color-surface-container-low);
  border-radius: var(--radius-md);
}

.radio__logo {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
}

.radio--disabled {
  opacity: 0.55;
}

.radio--disabled .radio__input,
.radio--disabled .radio__label {
  cursor: not-allowed;
}
</style>
