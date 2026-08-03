<script setup lang="ts">
import { computed } from 'vue'

import BaseIcon from './BaseIcon.vue'

/**
 * Page navigation for server-paginated lists.
 *
 * Long ranges collapse to `1 … 4 5 6 … 20` so the control keeps a fixed width
 * whatever the number of pages.
 */
const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    /** Total item count, for the "Affichage de 1-3 sur 12" summary. */
    total?: number
    from?: number
    to?: number
    /** Noun used in the summary, e.g. "commandes". */
    itemLabel?: string
  }>(),
  { total: undefined, from: undefined, to: undefined, itemLabel: 'éléments' },
)

const emit = defineEmits<{ 'update:page': [page: number] }>()

/** `-1` marks an ellipsis. */
const pages = computed<number[]>(() => {
  const { page, totalPages } = props

  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)

  const window = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages)
  const result: number[] = [1]

  if (window[0] !== undefined && window[0] > 2) result.push(-1)
  result.push(...window)
  if (window[window.length - 1] !== undefined && window[window.length - 1]! < totalPages - 1) {
    result.push(-1)
  }
  result.push(totalPages)

  return result
})

function go(page: number): void {
  if (page < 1 || page > props.totalPages || page === props.page) return

  emit('update:page', page)
}
</script>

<template>
  <div class="pagination">
    <p v-if="total !== undefined" class="pagination__summary t-label">
      Affichage de {{ from ?? 1 }}-{{ to ?? total }} sur {{ total }} {{ itemLabel }}
    </p>

    <nav class="pagination__nav" aria-label="Pagination">
      <button
        class="pagination__button"
        type="button"
        :disabled="page <= 1"
        aria-label="Page précédente"
        @click="go(page - 1)"
      >
        <BaseIcon name="chevron_left" :size="18" />
      </button>

      <template v-for="(entry, index) in pages" :key="`${entry}-${index}`">
        <span v-if="entry === -1" class="pagination__ellipsis" aria-hidden="true">…</span>
        <button
          v-else
          class="pagination__button"
          :class="{ 'pagination__button--active': entry === page }"
          type="button"
          :aria-label="`Page ${entry}`"
          :aria-current="entry === page ? 'page' : undefined"
          @click="go(entry)"
        >
          {{ entry }}
        </button>
      </template>

      <button
        class="pagination__button"
        type="button"
        :disabled="page >= totalPages"
        aria-label="Page suivante"
        @click="go(page + 1)"
      >
        <BaseIcon name="chevron_right" :size="18" />
      </button>
    </nav>
  </div>
</template>

<style scoped>
.pagination {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
}

.pagination__summary {
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

.pagination__nav {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  margin-inline-start: auto;
}

.pagination__button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding-inline: var(--space-2);
  color: var(--color-on-surface-variant);
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: 600;
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-sm);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.pagination__button:hover:not(:disabled):not(.pagination__button--active) {
  color: var(--color-primary);
  border-color: var(--color-primary);
}

.pagination__button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__button--active {
  color: var(--color-on-primary);
  background-color: var(--color-primary);
  border-color: var(--color-primary);
}

.pagination__ellipsis {
  padding-inline: var(--space-1);
  color: var(--color-outline);
}
</style>
