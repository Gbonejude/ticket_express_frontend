<script setup lang="ts">
import { BaseButton, BaseCheckbox, BaseIcon } from '@/components/ui'
import type { EventCategory } from '@/types/event'
import { formatPrice } from '@/utils/format'

import type { EventFilterState } from './types'

/**
 * Filter panel of the explore page: categories, period, price ceiling.
 *
 * It owns no state — the page does, because the filters are mirrored in the URL
 * query. This component only renders the current state and reports changes, so
 * it can be dropped into the sidebar on desktop and into a drawer on mobile
 * without either copy drifting.
 */
defineProps<{
  categories: EventCategory[]
  /** Upper bound of the price slider, in the platform currency. */
  priceCeiling?: number
}>()

const model = defineModel<EventFilterState>({ required: true })

const emit = defineEmits<{ reset: [] }>()

const periods = [
  { value: 'weekend', label: 'Ce week-end' },
  { value: 'next-week', label: 'La semaine prochaine' },
  { value: 'month', label: 'Ce mois-ci' },
] as const

function toggleCategory(slug: string, checked: boolean): void {
  const next = new Set(model.value.categories)

  if (checked) next.add(slug)
  else next.delete(slug)

  model.value = { ...model.value, categories: [...next] }
}

function selectPeriod(value: EventFilterState['period']): void {
  // Clicking the active period clears it, so the control is a toggle.
  model.value = {
    ...model.value,
    period: model.value.period === value ? 'all' : value,
  }
}

const eventTypes = [
  { value: 'physical', label: 'Sur place', icon: 'location_on' },
  { value: 'online', label: 'En ligne', icon: 'videocam' },
] as const

function selectEventType(value: 'physical' | 'online'): void {
  model.value = {
    ...model.value,
    eventType: model.value.eventType === value ? 'all' : value,
  }
}
</script>

<template>
  <div class="filters">
    <fieldset class="filters__group">
      <legend class="filters__legend t-label">Catégories</legend>

      <div class="filters__list">
        <BaseCheckbox
          v-for="category in categories"
          :key="category.id"
          :model-value="model.categories.includes(category.slug)"
          :label="category.name"
          :count="category.upcomingEventsCount"
          @update:model-value="toggleCategory(category.slug, $event)"
        />
      </div>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend t-label">Date</legend>

      <div class="filters__list">
        <button
          v-for="period in periods"
          :key="period.value"
          class="filters__period"
          :class="{ 'filters__period--active': model.period === period.value }"
          type="button"
          :aria-pressed="model.period === period.value"
          @click="selectPeriod(period.value)"
        >
          {{ period.label }}
        </button>

        <label class="visually-hidden" for="filter-date">Date précise</label>
        <input
          id="filter-date"
          class="filters__date"
          type="date"
          :value="model.date"
          @input="model = { ...model, date: ($event.target as HTMLInputElement).value }"
        />
      </div>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend t-label">Organisateur</legend>

      <label class="visually-hidden" for="filter-organizer">Nom de l'organisateur</label>
      <input
        id="filter-organizer"
        class="filters__date"
        type="search"
        placeholder="Ex. Lomé Live Productions"
        :value="model.organizer"
        @change="model = { ...model, organizer: ($event.target as HTMLInputElement).value }"
      />
    </fieldset>

    <fieldset class="filters__group">
      <legend class="filters__legend t-label">Format</legend>

      <div class="filters__list filters__list--inline">
        <button
          v-for="type in eventTypes"
          :key="type.value"
          class="filters__period"
          :class="{ 'filters__period--active': model.eventType === type.value }"
          type="button"
          :aria-pressed="model.eventType === type.value"
          @click="selectEventType(type.value)"
        >
          <BaseIcon :name="type.icon" :size="16" />
          {{ type.label }}
        </button>
      </div>
    </fieldset>

    <fieldset class="filters__group">
      <legend class="visually-hidden">Prix</legend>

      <div class="filters__price-header">
        <span class="filters__legend t-label" aria-hidden="true">Prix</span>
        <span class="filters__price-value t-label">
          Max&nbsp;: {{ formatPrice(model.maxPrice) }}
        </span>
      </div>

      <label class="visually-hidden" for="filter-price">Prix maximum</label>
      <input
        id="filter-price"
        class="filters__range"
        type="range"
        min="0"
        :max="priceCeiling ?? 100000"
        step="5000"
        :value="model.maxPrice"
        @input="model = { ...model, maxPrice: Number(($event.target as HTMLInputElement).value) }"
      />

      <div class="filters__scale t-label">
        <span>{{ formatPrice(0) }}</span>
        <span>{{ formatPrice(priceCeiling ?? 100000) }}</span>
      </div>
    </fieldset>

    <BaseButton variant="outline" block @click="emit('reset')">Réinitialiser</BaseButton>
  </div>
</template>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.filters__group {
  border: none;
}

.filters__legend {
  display: block;
  margin-block-end: var(--space-4);
  color: var(--color-on-surface);
  text-transform: uppercase;
}

.filters__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.filters__list--inline {
  flex-direction: row;
  flex-wrap: wrap;
}

.filters__period {
  padding: var(--space-2) var(--space-3);
  color: var(--color-on-surface-variant);
  text-align: start;
  border-radius: var(--radius-md);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.filters__period:hover {
  background-color: var(--color-surface-container-low);
}

.filters__period--active {
  color: var(--color-primary);
  font-weight: 700;
  background-color: var(--color-surface-variant);
}

.filters__date {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  margin-block-start: var(--space-2);
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
}

.filters__date:focus {
  border-color: var(--color-focus);
  outline: none;
}

.filters__price-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-4);
}

.filters__price-value {
  color: var(--color-primary);
  font-weight: 700;
  text-transform: uppercase;
}

.filters__range {
  width: 100%;
  height: 0.5rem;
  background-color: var(--color-surface-container-high);
  border-radius: var(--radius-md);
  cursor: pointer;
  accent-color: var(--color-primary);
  appearance: none;
}

.filters__range::-webkit-slider-thumb {
  width: 1.125rem;
  height: 1.125rem;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  appearance: none;
}

.filters__range::-moz-range-thumb {
  width: 1.125rem;
  height: 1.125rem;
  background-color: var(--color-primary);
  border: none;
  border-radius: var(--radius-full);
}

.filters__scale {
  display: flex;
  justify-content: space-between;
  margin-block-start: var(--space-2);
  color: var(--color-outline);
}
</style>
