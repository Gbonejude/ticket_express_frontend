<script setup lang="ts">
import { useId } from 'vue'

/**
 * Checkbox with its label. Used for "Se souvenir de moi", the CGU acceptance
 * and the category filters on the explore page.
 *
 * The native input is kept and only visually replaced, so keyboard and screen
 * reader behaviour are the browser's, not a reimplementation.
 */
withDefaults(
  defineProps<{
    label?: string
    /** Small grey text under the label. */
    hint?: string
    disabled?: boolean
    required?: boolean
    /** Right-aligned counter, as on the category filters. */
    count?: number | string
  }>(),
  { label: undefined, hint: undefined, count: undefined },
)

const model = defineModel<boolean>({ default: false })

const id = useId()
</script>

<template>
  <div class="checkbox" :class="{ 'checkbox--disabled': disabled }">
    <input
      :id="id"
      v-model="model"
      class="checkbox__input"
      type="checkbox"
      :disabled="disabled"
      :required="required"
    />

    <label class="checkbox__label" :for="id">
      <span class="checkbox__text">
        <slot>{{ label }}</slot>
        <span v-if="hint" class="checkbox__hint">{{ hint }}</span>
      </span>
      <span v-if="count !== undefined" class="checkbox__count t-label">{{ count }}</span>
    </label>
  </div>
</template>

<style scoped>
.checkbox {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.checkbox__input {
  flex-shrink: 0;
  width: 1.125rem;
  height: 1.125rem;
  margin-block-start: 0.1875rem;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.checkbox__label {
  display: flex;
  flex: 1;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
  font-size: var(--text-body-sm);
  cursor: pointer;
}

.checkbox__text {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  color: var(--color-on-surface-variant);
}

.checkbox__hint {
  color: var(--color-outline);
  font-size: var(--text-body-sm);
}

.checkbox__count {
  color: var(--color-outline);
}

.checkbox--disabled {
  opacity: 0.55;
}

.checkbox--disabled .checkbox__input,
.checkbox--disabled .checkbox__label {
  cursor: not-allowed;
}
</style>
