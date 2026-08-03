<script setup lang="ts">
import { BaseIcon } from '@/components/ui'

import type { FaqEntry } from './types'

/**
 * Frequently-asked questions.
 *
 * Built on native `<details>`/`<summary>`: the disclosure semantics, the
 * keyboard handling and the in-page find come from the browser, so there is no
 * ARIA to keep in sync. Entries stay independently open, as the mockup shows.
 */
defineProps<{ entries: FaqEntry[] }>()
</script>

<template>
  <div class="faq">
    <details v-for="entry in entries" :key="entry.question" class="faq__item">
      <summary class="faq__question">
        <span>{{ entry.question }}</span>
        <BaseIcon class="faq__chevron" name="expand_more" :size="22" />
      </summary>

      <div class="faq__answer">{{ entry.answer }}</div>
    </details>
  </div>
</template>

<style scoped>
.faq {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.faq__item {
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
}

.faq__question {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  padding: var(--space-component-padding);
  font-size: var(--text-body-lg);
  font-weight: 600;
  cursor: pointer;
  transition: background-color var(--transition-fast);

  /* Removes the native disclosure triangle in both engines. */
  list-style: none;
}

.faq__question::-webkit-details-marker {
  display: none;
}

.faq__question:hover {
  background-color: var(--color-surface-container-low);
}

.faq__chevron {
  flex-shrink: 0;
  transition: transform var(--transition-fast);
}

.faq__item[open] .faq__chevron {
  transform: rotate(180deg);
}

.faq__answer {
  padding: var(--space-component-padding);
  color: var(--color-secondary);
  font-size: var(--text-body-md);
  border-block-start: 1px solid var(--color-surface-variant);
}
</style>
