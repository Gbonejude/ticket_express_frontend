<script setup lang="ts">
import { computed, useId } from 'vue'

import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'
import type { SelectOption } from './types'

/**
 * Labelled `<select>`.
 *
 * A native select is kept on purpose: it is keyboard- and screen-reader-correct
 * out of the box, and on mobile it opens the platform picker. Only the chevron
 * is custom, since the browser's own arrow cannot be styled.
 */
const props = withDefaults(
  defineProps<{
    options: SelectOption[]
    label?: string
    /** Shown as a disabled first entry when the value is empty. */
    placeholder?: string
    icon?: IconName
    hint?: string
    error?: string
    required?: boolean
    disabled?: boolean
    hideLabel?: boolean
  }>(),
  {
    label: undefined,
    placeholder: undefined,
    icon: undefined,
    hint: undefined,
    error: undefined,
  },
)

const model = defineModel<string | number | null>({ default: '' })

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`

const describedBy = computed(() => {
  const ids = [props.hint ? hintId : null, props.error ? errorId : null].filter(Boolean)

  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <label
      v-if="label"
      class="field__label t-label"
      :class="{ 'visually-hidden': hideLabel }"
      :for="id"
    >
      {{ label }}
      <span v-if="required" class="field__required" aria-hidden="true">*</span>
    </label>

    <div class="field__control">
      <BaseIcon v-if="icon" class="field__icon" :name="icon" :size="20" />

      <select
        :id="id"
        v-model="model"
        class="field__select"
        :class="{ 'field__select--with-icon': icon }"
        :required="required"
        :disabled="disabled"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
      >
        <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>

      <BaseIcon class="field__chevron" name="expand_more" :size="20" />
    </div>

    <p v-if="hint && !error" :id="hintId" class="field__hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field__error" role="alert">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.field__label {
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

.field__required {
  color: var(--color-error);
}

.field__control {
  position: relative;
  display: flex;
  align-items: center;
}

.field__icon {
  position: absolute;
  left: var(--space-4);
  color: var(--color-primary);
  pointer-events: none;
}

.field__chevron {
  position: absolute;
  right: var(--space-3);
  color: var(--color-on-surface-variant);
  pointer-events: none;
}

.field__select {
  width: 100%;
  padding: var(--space-3) var(--space-10) var(--space-3) var(--space-4);
  color: var(--color-on-surface);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  cursor: pointer;
  appearance: none;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.field__select--with-icon {
  padding-inline-start: var(--space-12);
}

.field__select:focus {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-focus);
}

.field__select:disabled {
  background-color: var(--color-surface-container-low);
  cursor: not-allowed;
  opacity: 0.7;
}

.field__hint {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}

.field__error {
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

.field--invalid .field__select {
  border-color: var(--color-error);
}
</style>
