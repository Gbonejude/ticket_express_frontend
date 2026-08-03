<script setup lang="ts">
import { computed, ref, useId } from 'vue'

import BaseIcon from './BaseIcon.vue'
import type { IconName } from './icons'

/**
 * Labelled text field.
 *
 * The label, the hint and the error are all wired to the input through
 * `for`/`aria-describedby` using a generated id, so a form is accessible
 * without the caller having to invent unique ids.
 *
 * A `password` field gets its show/hide toggle for free, as in the sign-in
 * mockup.
 */
const props = withDefaults(
  defineProps<{
    label?: string
    type?: 'text' | 'email' | 'password' | 'tel' | 'search' | 'number' | 'date'
    placeholder?: string
    /** Leading decorative icon, inside the field. */
    icon?: IconName
    hint?: string
    /** Message shown under the field; also flags the field as invalid. */
    error?: string
    required?: boolean
    disabled?: boolean
    autocomplete?: string
    inputmode?: 'text' | 'tel' | 'email' | 'numeric' | 'search'
    /** Hides the label visually but keeps it for screen readers. */
    hideLabel?: boolean
  }>(),
  {
    label: undefined,
    type: 'text',
    placeholder: undefined,
    icon: undefined,
    hint: undefined,
    error: undefined,
    autocomplete: undefined,
    inputmode: undefined,
  },
)

const model = defineModel<string | number | null>({ default: '' })

const id = useId()
const hintId = `${id}-hint`
const errorId = `${id}-error`

const isRevealed = ref(false)

const resolvedType = computed(() =>
  props.type === 'password' && isRevealed.value ? 'text' : props.type,
)

const describedBy = computed(() => {
  const ids = [props.hint ? hintId : null, props.error ? errorId : null].filter(Boolean)

  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="field" :class="{ 'field--invalid': error }">
    <div v-if="label" class="field__header" :class="{ 'visually-hidden': hideLabel }">
      <label class="field__label t-label" :for="id">
        {{ label }}
        <span v-if="required" class="field__required" aria-hidden="true">*</span>
      </label>
      <slot name="label-action" />
    </div>

    <div class="field__control">
      <BaseIcon v-if="icon" class="field__icon" :name="icon" :size="20" />

      <input
        :id="id"
        v-model="model"
        class="field__input"
        :class="{
          'field__input--with-icon': icon,
          'field__input--with-action': type === 'password',
        }"
        :type="resolvedType"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :inputmode="inputmode"
        :aria-invalid="error ? true : undefined"
        :aria-describedby="describedBy"
      />

      <button
        v-if="type === 'password'"
        class="field__action"
        type="button"
        :aria-label="isRevealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
        :aria-pressed="isRevealed"
        @click="isRevealed = !isRevealed"
      >
        <BaseIcon :name="isRevealed ? 'visibility' : 'lock'" :size="20" />
      </button>
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

.field__header {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
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

.field__input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  color: var(--color-on-surface);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.field__input--with-icon {
  padding-inline-start: var(--space-12);
}

.field__input--with-action {
  padding-inline-end: var(--space-12);
}

.field__input::placeholder {
  color: var(--color-outline);
  opacity: 0.6;
}

.field__input:focus {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 2px var(--color-focus);
}

.field__input:disabled {
  background-color: var(--color-surface-container-low);
  cursor: not-allowed;
  opacity: 0.7;
}

.field__action {
  position: absolute;
  right: var(--space-3);
  display: flex;
  color: var(--color-on-surface-variant);
  transition: color var(--transition-fast);
}

.field__action:hover {
  color: var(--color-primary);
}

.field__hint {
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}

.field__error {
  color: var(--color-error);
  font-size: var(--text-body-sm);
}

.field--invalid .field__input {
  border-color: var(--color-error);
}

.field--invalid .field__input:focus {
  box-shadow: 0 0 0 2px var(--color-error-container);
}
</style>
