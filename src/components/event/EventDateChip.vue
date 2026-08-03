<script setup lang="ts">
import { computed } from 'vue'

import type { ApiDate } from '@/types/api'

/**
 * The month/day chip pinned to the corner of an event card.
 *
 * It reads the ISO `datetime` rather than the server-rendered `human` label,
 * because it needs the two parts separately — the label is a single sentence.
 */
const props = defineProps<{ date: ApiDate | null }>()

const monthFormatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' })

const parts = computed(() => {
  if (!props.date) return null

  const value = new Date(props.date.datetime)

  return {
    month: monthFormatter.format(value).replace('.', '').toUpperCase(),
    day: String(value.getDate()).padStart(2, '0'),
    iso: props.date.datetime.slice(0, 10),
    label: props.date.human,
  }
})
</script>

<template>
  <time v-if="parts" class="date-chip" :datetime="parts.iso" :aria-label="parts.label">
    <span class="date-chip__month">{{ parts.month }}</span>
    <span class="date-chip__day">{{ parts.day }}</span>
  </time>
</template>

<style scoped>
.date-chip {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-2);
  background-color: rgb(255 255 255 / 90%);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
}

.date-chip__month {
  color: var(--color-primary);
  font-size: var(--text-body-sm);
  font-weight: 700;
  line-height: 1;
}

.date-chip__day {
  color: var(--color-on-surface);
  font-size: var(--text-headline-md);
  font-weight: 800;
  line-height: 1.1;
}
</style>
