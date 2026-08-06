<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EventCard from '@/components/event/EventCard.vue'
import { BaseAlert, BaseButton, BaseEmptyState, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { useFavorites } from '@/composables/useFavorites'
import { useFavoritesStore } from '@/stores/favorites.store'
import type { Event } from '@/types/event'
import { eventStartingPrice } from '@/utils/event'

/**
 * Favourites — Stitch screen « Mes Favoris ».
 *
 * Removing a favourite drops the card from the list straight away rather than
 * refetching: the visitor asked for it to go, and a round-trip would leave it
 * sitting there for a beat.
 *
 * The tiles are the home page's `EventCard`, not a second card that happens to
 * look similar: the heart here always starts filled, and clicking it removes
 * the favourite instead of toggling it.
 */
const store = useFavoritesStore()
const favorites = useFavorites()

/**
 * The list comes from the store, not from a request of its own.
 *
 * Removing a favourite here has to be visible everywhere else at once — the
 * header count, the hearts on the home page — and the store already drops the
 * card optimistically, so no local "removed" set is needed to hide it.
 */
const list = useApiRequest(() => store.load(true))

const sort = ref<'recent' | 'date' | 'price'>('recent')

const events = computed<Event[]>(() => {
  const rows = store.events

  if (sort.value === 'price') {
    return [...rows].sort((a, b) => (eventStartingPrice(a) ?? 0) - (eventStartingPrice(b) ?? 0))
  }

  if (sort.value === 'date') {
    return [...rows].sort((a, b) =>
      (a.startDate?.datetime ?? '').localeCompare(b.startDate?.datetime ?? ''),
    )
  }

  return rows
})

async function remove(event: Event): Promise<void> {
  await favorites.toggle(event)
}

onMounted(() => {
  void list.execute()
})
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1 class="t-headline-xl">Mes Favoris</h1>
        <p class="head__lead t-body-lg">
          Retrouvez ici tous les événements que vous avez marqués d'un cœur.
        </p>
      </div>

      <div class="head__filter">
        <label class="head__filter-label" for="sort">Filtrer par :</label>
        <select id="sort" v-model="sort" class="head__select">
          <option value="recent">Plus récents</option>
          <option value="date">Date de l'événement</option>
          <option value="price">Prix croissant</option>
        </select>
      </div>
    </header>

    <h2 class="visually-hidden">Vos événements favoris</h2>

    <BaseAlert v-if="list.error.value" variant="error" title="Chargement impossible">
      {{ list.error.value.message }}
    </BaseAlert>

    <div v-else-if="list.isLoading.value" class="grid">
      <BaseSkeleton v-for="n in 3" :key="n" variant="block" height="24rem" />
    </div>

    <BaseEmptyState
      v-else-if="events.length === 0"
      icon="heart_broken"
      title="Aucun favori pour le moment"
      description="Touchez le cœur sur un événement pour le retrouver ici."
    >
      <template #action>
        <BaseButton :to="{ name: 'events' }">Découvrir les événements</BaseButton>
      </template>
    </BaseEmptyState>

    <div v-else class="grid">
      <EventCard
        v-for="event in events"
        :key="event.id"
        :event="event"
        is-favorite
        @toggle-favorite="remove"
      />
    </div>
  </div>
</template>

<style scoped>
.head {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-block-end: var(--space-8);
}

.head__lead {
  margin-block-start: var(--space-1);
  color: var(--color-secondary);
}

.head__filter {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.head__filter-label {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

.head__select {
  padding: var(--space-2) var(--space-4);
  background-color: var(--color-surface-container);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
}

/* Without this the browser draws its own accent ring, which picks up the
   brand red from `accent-color`. */
.head__select:focus-visible {
  border-color: var(--color-focus);
  outline: none;
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

@media (width >= 640px) {
  .head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 1024px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
