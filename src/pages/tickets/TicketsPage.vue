<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EventCard from '@/components/event/EventCard.vue'
import { BaseAlert, BaseButton, BaseEmptyState, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource } from '@/data'

/**
 * Ticket list — Stitch screen « Liste de mes billets ».
 *
 * Split into "À venir" and "Passés" on the event's date rather than on the
 * ticket's status: a ticket for last month is still `valid`, but it belongs in
 * the history, not at the top of the list.
 */
const rows = useApiRequest(dataSource.tickets.list)

const tab = ref<'upcoming' | 'past'>('upcoming')

const now = Date.now()

const upcoming = computed(() =>
  (rows.data.value ?? []).filter((row) => Date.parse(row.event.startDate?.datetime ?? '') >= now),
)

const past = computed(() =>
  (rows.data.value ?? []).filter((row) => Date.parse(row.event.startDate?.datetime ?? '') < now),
)

const shown = computed(() => (tab.value === 'upcoming' ? upcoming.value : past.value))

onMounted(() => {
  void rows.execute()
})
</script>

<template>
  <div class="container tickets">
    <header class="tickets__header">
      <h1 class="t-headline-xl">Mes Billets</h1>
      <p class="tickets__lead t-body-lg">
        Retrouvez tous vos événements à venir et vos souvenirs passés.
      </p>
    </header>

    <h2 class="visually-hidden">
      {{ tab === 'upcoming' ? 'Billets à venir' : 'Événements passés' }}
    </h2>

    <div class="tabs hide-scrollbar" role="tablist" aria-label="Filtrer les billets">
      <button
        class="tabs__tab"
        :class="{ 'tabs__tab--active': tab === 'upcoming' }"
        type="button"
        role="tab"
        :aria-selected="tab === 'upcoming'"
        @click="tab = 'upcoming'"
      >
        À venir ({{ upcoming.length }})
      </button>
      <button
        class="tabs__tab"
        :class="{ 'tabs__tab--active': tab === 'past' }"
        type="button"
        role="tab"
        :aria-selected="tab === 'past'"
        @click="tab = 'past'"
      >
        Passés ({{ past.length }})
      </button>
    </div>

    <BaseAlert v-if="rows.error.value" variant="error" title="Chargement impossible">
      {{ rows.error.value.message }}
    </BaseAlert>

    <div v-else-if="rows.isLoading.value" class="tickets__list">
      <BaseSkeleton v-for="index in 3" :key="index" variant="block" height="12rem" />
    </div>

    <BaseEmptyState
      v-else-if="shown.length === 0"
      icon="confirmation_number"
      :title="tab === 'upcoming' ? 'Aucun billet à venir' : 'Aucun événement passé'"
      description="Vos billets apparaîtront ici dès votre première commande."
    >
      <template #action>
        <BaseButton :to="{ name: 'events' }">Découvrir les événements</BaseButton>
      </template>
    </BaseEmptyState>

    <div v-else class="tickets__list">
      <EventCard
        v-for="row in shown"
        :key="row.ticket.id"
        :event="row.event"
        :show-favorite="false"
        cta-label="Voir le billet"
        :cta-to="{ name: 'ticket-detail', params: { id: row.ticket.id } }"
        :title-to="{ name: 'ticket-detail', params: { id: row.ticket.id } }"
      >
        <template #footer>
          <span class="ticket-ref">
            {{ row.ticket.ticketType?.name ?? 'Billet' }} • {{ row.ticket.ticketNumber }}
          </span>
        </template>
      </EventCard>
    </div>
  </div>
</template>

<style scoped>
.tickets {
  padding-block: var(--space-8) var(--space-section-gap);
}

.tickets__header {
  margin-block-end: var(--space-section-gap);
}

.tickets__lead {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
}

/* --- Tabs --- */
.tabs {
  display: flex;
  gap: var(--space-stack-md);
  margin-block-end: var(--space-gutter);
  padding-block-end: var(--space-2);
  overflow-x: auto;
}

.tabs__tab {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-6);
  color: var(--color-on-surface-variant);
  font-size: var(--text-label-bold);
  font-weight: 700;
  white-space: nowrap;
  border-radius: var(--radius-full);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.tabs__tab:hover {
  background-color: var(--color-surface-variant);
}

.tabs__tab--active {
  color: var(--color-on-primary-container);
  background-color: var(--color-primary-container);
}

/* Same grid as the home page: the cards are the same component. */
.tickets__list {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

.ticket-ref {
  color: var(--color-secondary);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

@media (width >= 640px) {
  .tickets__list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 1024px) {
  .tickets__list {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
