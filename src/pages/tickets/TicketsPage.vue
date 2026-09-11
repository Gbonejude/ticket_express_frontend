<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import EventCard from '@/components/event/EventCard.vue'
import { BaseAlert, BaseBadge, BaseButton, BaseEmptyState, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource } from '@/data'
import { displayStatus, isActive, paidPrice, TICKET_STATUS_LABELS } from '@/services'
import type { TicketDisplayStatus } from '@/services'
import type { Event } from '@/types/event'

/**
 * Ticket list — Stitch screen « Liste de mes billets ».
 *
 * Three tabs, because the backend models three different things:
 *  - "À venir" — issued tickets still usable (`valid`, event not over);
 *  - "Passés"  — used, cancelled, refunded, or whose event has ended;
 *  - "En attente" — orders whose payment has not gone through, which have no
 *    tickets issued against them yet.
 */
// One request for both halves: issued tickets and unpaid orders come out of
// the same order list.
const overview = useApiRequest(dataSource.tickets.overview)

const tab = ref<'upcoming' | 'past' | 'pending'>('upcoming')

/**
 * The card needs an event to render, so rows are narrowed to those that carry
 * one. In practice every row does — `GET /orders` eager-loads the event behind
 * each ticket — and the guard exists for the case where the event was deleted
 * after the ticket was issued.
 */
const resolved = computed(() =>
  (overview.data.value?.rows ?? []).filter(
    (row): row is typeof row & { event: Event } => row.event !== null,
  ),
)

const upcoming = computed(() => resolved.value.filter(isActive))
const past = computed(() => resolved.value.filter((row) => !isActive(row)))

const awaiting = computed(() =>
  (overview.data.value?.pending ?? []).filter(
    (row): row is typeof row & { event: Event } => row.event !== null,
  ),
)

const shown = computed(() => (tab.value === 'upcoming' ? upcoming.value : past.value))

const isLoading = computed(() => overview.isLoading.value)

/** Badge colour per state, so a refund never looks like a valid ticket. */
const STATUS_VARIANTS: Record<TicketDisplayStatus, 'success' | 'neutral' | 'warning' | 'danger'> = {
  valid: 'success',
  used: 'neutral',
  expired: 'neutral',
  cancelled: 'danger',
  refunded: 'warning',
  pending: 'warning',
}

const EMPTY_STATES = {
  upcoming: 'Aucun billet à venir',
  past: 'Aucun événement passé',
  pending: 'Aucune commande en attente',
} as const

onMounted(() => {
  void overview.execute()
})
</script>

<template>
  <div>
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
      <button
        v-if="awaiting.length > 0"
        class="tabs__tab"
        :class="{ 'tabs__tab--active': tab === 'pending' }"
        type="button"
        role="tab"
        :aria-selected="tab === 'pending'"
        @click="tab = 'pending'"
      >
        En attente ({{ awaiting.length }})
      </button>
    </div>

    <BaseAlert v-if="overview.error.value" variant="error" title="Chargement impossible">
      {{ overview.error.value.message }}
    </BaseAlert>

    <div v-else-if="isLoading" class="tickets__list">
      <BaseSkeleton v-for="index in 3" :key="index" variant="block" height="12rem" />
    </div>

    <!-- Orders still awaiting payment: no ticket has been issued yet. -->
    <div v-else-if="tab === 'pending'" class="tickets__list">
      <EventCard
        v-for="row in awaiting"
        :key="row.order.id"
        :event="row.event"
        :show-favorite="false"
        :price="row.order.totalAmount"
        price-label="À régler"
        cta-label="Finaliser le paiement"
        :cta-to="{ name: 'checkout', params: { eventId: row.event?.id ?? '' } }"
      >
        <template #footer>
          <span class="ticket-ref">Réf. {{ row.order.orderNumber }}</span>
          <BaseBadge variant="warning">{{ TICKET_STATUS_LABELS.pending }}</BaseBadge>
        </template>
      </EventCard>
    </div>

    <BaseEmptyState
      v-else-if="shown.length === 0"
      icon="confirmation_number"
      :title="EMPTY_STATES[tab]"
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
        :price="paidPrice(row)"
        price-label="Payé"
        cta-label="Voir le billet"
        :cta-to="{ name: 'ticket-detail', params: { id: row.ticket.id } }"
        :title-to="{ name: 'ticket-detail', params: { id: row.ticket.id } }"
      >
        <template #footer>
          <span class="ticket-ref">
            {{ row.ticket.ticketType?.name ?? 'Billet' }} • {{ row.ticket.ticketNumber }}
          </span>
          <BaseBadge :variant="STATUS_VARIANTS[displayStatus(row)]">
            {{ TICKET_STATUS_LABELS[displayStatus(row)] }}
          </BaseBadge>
        </template>
      </EventCard>
    </div>
  </div>
</template>

<style scoped>
/* Ni conteneur ni marge verticale ici : la page vit dans `AccountLayout`, dont
   `.content` pose déjà la largeur maximale et le `padding` de la colonne. Les
   deux se cumulaient et laissaient un vide au-dessus du titre. */
.tickets__header {
  margin-block-end: var(--space-8);
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
