<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import { ApiError } from '@/api'
import StatCard from '@/components/account/StatCard.vue'
import {
  BaseAlert,
  BaseBadge,
  BaseButton,
  BaseEmptyState,
  BaseIcon,
  BasePagination,
  BaseSelect,
  BaseSkeleton,
} from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource } from '@/data'
import { useUiStore } from '@/stores/ui.store'
import type { SelectOption } from '@/components/ui'
import { pdfDownloadUrl } from '@/services'
import type { Event } from '@/types/event'
import type { Order, OrderStatus } from '@/types/order'
import { eventCover, eventTitle } from '@/utils/event'

// La référence de transaction (le « Ref: … » du SMS PayGate) permet de relier
// le message reçu à la bonne commande.
const paymentRef = (order: Order): string | null =>
  order.payments?.find(p => p.transactionReference)?.transactionReference ?? null
import { formatDate, formatPrice, formatTime } from '@/utils/format'

/**
 * Purchase history — Stitch screen « Historique des achats ».
 *
 * The table becomes a stack of cards below `md`: a five-column row with an
 * image and two buttons cannot shrink to a phone without becoming unreadable,
 * and horizontal scrolling on a list you scan vertically is worse.
 */
const ui = useUiStore()

const orders = useApiRequest(dataSource.orders.history)

const page = ref(1)

/** Statuses `GET /orders` accepts, plus an "all" entry that sends none. */
const STATUS_OPTIONS: SelectOption[] = [
  { value: '', label: 'Tous les statuts' },
  { value: 'paid', label: 'Payées' },
  { value: 'pending', label: 'En attente' },
  { value: 'cancelled', label: 'Annulées' },
  { value: 'refunded', label: 'Remboursées' },
]

const status = ref('')

/** Badge colour per order status, so a cancelled order never reads as paid. */
const STATUS_VARIANTS: Record<OrderStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  pending: 'warning',
  cancelled: 'danger',
  refunded: 'neutral',
  failed: 'danger',
}

/** Id of the order being cancelled, so only its button shows a spinner. */
const cancelling = ref<string | null>(null)

const rows = computed(() => orders.data.value?.items ?? [])
const meta = computed(() => orders.data.value?.meta)

/** Only paid orders count towards the totals. */
const totals = computed(() => {
  const paid = rows.value.filter((row) => row.order.status === 'paid')

  return {
    spent: paid.reduce((sum, row) => sum + row.order.totalAmount, 0),
    tickets: paid.reduce((sum, row) => sum + (row.order.ticketsCount ?? 0), 0),
  }
})

/**
 * Events still ahead among the ones already paid for.
 *
 * This replaces a loyalty-points card the backend has no counterpart for: a
 * figure nothing can ever compute is worse than no card at all. Here the
 * number comes from the same rows the table below lists.
 */
const startsAt = (event: { startDate: { datetime: string } | null }): number =>
  event.startDate ? new Date(event.startDate.datetime).getTime() : 0

const upcoming = computed(() => {
  const now = Date.now()

  // `startDate` is nullable on the API type, so undated events are simply not
  // "upcoming" rather than being sorted against NaN.
  const events = rows.value
    .filter((row) => row.order.status === 'paid')
    .map((row) => row.event)
    // An order whose ticket type no longer resolves to an event has no date to
    // sort on, so it is not "upcoming" either.
    .filter((event): event is Event => Boolean(event?.startDate) && startsAt(event!) > now)
    .sort((a, b) => startsAt(a) - startsAt(b))

  return { count: events.length, next: events[0] ?? null }
})

/**
 * Downloads the order's tickets.
 *
 * The link is token-authenticated and public, so the browser fetches it
 * directly. It is not a `<a href>` in the template because the URL only exists
 * once the order is paid, and a dead button reads better than a link to
 * nowhere — the notice below says why when it is missing.
 */
function download(order: Order): void {
  const url = pdfDownloadUrl(order)

  if (!url) {
    ui.notify(
      order.status === 'paid'
        ? 'Le lien de téléchargement a expiré ou atteint sa limite.'
        : 'Les billets seront disponibles une fois la commande payée.',
      'warning',
    )

    return
  }

  window.open(url, '_blank', 'noopener,noreferrer')
}

/**
 * Cancels an order that has not been paid.
 *
 * The backend releases the held stock, so the list is refetched rather than
 * patched locally: the availability shown elsewhere has changed too.
 */
async function cancel(order: Order): Promise<void> {
  cancelling.value = order.id

  try {
    await dataSource.orders.cancel(order.id)
    ui.notify(`Commande ${order.orderNumber} annulée.`, 'success')
    fetchOrders()
  } catch (error) {
    ui.notify(error instanceof ApiError ? error.message : 'Annulation impossible.', 'error')
  } finally {
    cancelling.value = null
  }
}

function fetchOrders(): void {
  void orders.execute({ page: page.value, status: (status.value || undefined) as OrderStatus | undefined })
}

watch(page, fetchOrders)

// Changing the filter restarts at the first page: page 3 of "payées" rarely
// exists when page 3 of "toutes" did.
watch(status, () => {
  if (page.value === 1) fetchOrders()
  else page.value = 1
})

onMounted(() => {
  fetchOrders()
})
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1 class="t-headline-xl">Historique d'achat</h1>
        <p class="head__lead t-body-lg">
          Consultez et téléchargez vos factures pour toutes vos commandes passées.
        </p>
      </div>

      <div class="head__actions">
        <!-- `GET /orders` filters on status server-side, so this is a real
             query rather than a client-side pass over the current page. -->
        <BaseSelect
          v-model="status"
          label="Filtrer par statut"
          hide-label
          :options="STATUS_OPTIONS"
        />
      </div>
    </header>

    <h2 class="visually-hidden">Récapitulatif</h2>

    <BaseAlert v-if="orders.error.value" variant="error" title="Chargement impossible">
      {{ orders.error.value.message }}
    </BaseAlert>

    <template v-else>
      <div class="stats">
        <template v-if="orders.isLoading.value">
          <BaseSkeleton v-for="n in 3" :key="n" variant="block" height="7rem" />
        </template>

        <template v-else>
          <!-- No year-on-year hint here: nothing in the API returns a previous
               period to compare against, and a hard-coded "+12 %" is a claim
               about the visitor's own spending that would simply be false. -->
          <StatCard icon="payments" label="Total dépensé" :value="formatPrice(totals.spent)" />
          <StatCard
            icon="confirmation_number"
            label="Billets achetés"
            :value="totals.tickets"
            :hint="`${rows.length} commandes affichées`"
            hint-icon="event"
          />
          <StatCard
            icon="event_available"
            label="Événements à venir"
            :value="upcoming.count"
            :hint="upcoming.next ? `Prochain : ${upcoming.next.title}` : 'Aucune date à venir'"
            hint-icon="schedule"
            tone="solid"
          >
            <template #action>
              <BaseButton
                variant="inverse"
                size="sm"
                icon-end="chevron_right"
                :to="{ name: 'tickets' }"
              >
                Voir mes billets
              </BaseButton>
            </template>
          </StatCard>
        </template>
      </div>

      <div v-if="orders.isLoading.value" class="skeletons">
        <BaseSkeleton v-for="n in 4" :key="n" variant="block" height="5rem" />
      </div>

      <BaseEmptyState
        v-else-if="rows.length === 0"
        icon="receipt_long"
        title="Aucune commande"
        description="Vos achats apparaîtront ici avec leurs factures téléchargeables."
      >
        <template #action>
          <BaseButton :to="{ name: 'events' }">Découvrir les événements</BaseButton>
        </template>
      </BaseEmptyState>

      <template v-else>
        <!-- Table from md up -->
        <table class="table">
          <caption class="visually-hidden">
            Historique de vos commandes
          </caption>
          <thead>
            <tr>
              <th scope="col">Événement &amp; réf.</th>
              <th scope="col">Date d'achat</th>
              <th scope="col">Montant</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.order.id">
              <td>
                <div class="event">
                  <img
                    v-if="eventCover(row.event)"
                    class="event__thumb"
                    :src="eventCover(row.event)!"
                    alt=""
                    aria-hidden="true"
                  />
                  <div>
                    <p class="event__name">
                      {{ eventTitle(row.event) }}
                    </p>
                    <p class="event__ref">
                      Réf. {{ row.order.orderNumber }} • {{ row.order.ticketsCount ?? 0 }} billet(s)<span v-if="paymentRef(row.order)"> • Paiement réf. {{ paymentRef(row.order) }}</span>
                    </p>
                  </div>
                </div>
              </td>
              <td class="table__date">
                <span class="table__date-day">{{ formatDate(row.order.createdAt) }}</span>
                <span class="table__date-time">{{ formatTime(row.order.createdAt) }}</span>
              </td>
              <td class="table__amount">{{ formatPrice(row.order.totalAmount) }}</td>
              <td>
                <div class="row-actions">
                  <BaseBadge :variant="STATUS_VARIANTS[row.order.status]">
                    {{ row.order.statusLabel }}
                  </BaseBadge>
                  <BaseButton
                    v-if="row.order.status === 'pending'"
                    size="sm"
                    variant="danger"
                    icon-start="close"
                    :loading="cancelling === row.order.id"
                    @click="cancel(row.order)"
                  >
                    Annuler
                  </BaseButton>
                  <BaseButton
                    size="sm"
                    variant="outline"
                    icon-start="file_download"
                    @click="download(row.order)"
                  >
                    Facture
                  </BaseButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Cards below md -->
        <ul class="cards">
          <li v-for="row in rows" :key="row.order.id" class="order-card">
            <div class="order-card__head">
              <p class="event__name">{{ eventTitle(row.event) }}</p>
              <span class="table__amount">{{ formatPrice(row.order.totalAmount) }}</span>
            </div>

            <p class="event__ref">
              Réf. {{ row.order.orderNumber }} • {{ row.order.ticketsCount ?? 0 }} billet(s)<span v-if="paymentRef(row.order)"> • Paiement réf. {{ paymentRef(row.order) }}</span>
            </p>
            <p class="order-card__date">
              <BaseIcon name="calendar_month" :size="16" />
              {{ formatDate(row.order.createdAt) }} • {{ formatTime(row.order.createdAt) }}
            </p>

            <div class="row-actions">
              <BaseBadge :variant="STATUS_VARIANTS[row.order.status]">
                    {{ row.order.statusLabel }}
                  </BaseBadge>
                  <BaseButton
                    v-if="row.order.status === 'pending'"
                    size="sm"
                    variant="danger"
                    icon-start="close"
                    :loading="cancelling === row.order.id"
                    @click="cancel(row.order)"
                  >
                    Annuler
                  </BaseButton>
              <BaseButton
                size="sm"
                variant="outline"
                icon-start="file_download"
                @click="download(row.order)"
              >
                Facture
              </BaseButton>
            </div>
          </li>
        </ul>

        <BasePagination
          v-if="meta"
          class="pagination"
          :page="meta.current_page"
          :total-pages="meta.last_page"
          :total="meta.total"
          :from="meta.from ?? undefined"
          :to="meta.to ?? undefined"
          item-label="achats"
          @update:page="page = $event"
        />
      </template>
    </template>
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

.head__actions {
  display: flex;
  gap: var(--space-3);
}

.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
  margin-block-end: var(--space-8);
}

.skeletons {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

/* --- Table --- */
.table {
  display: none;
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
}

.table thead {
  background-color: var(--color-surface-container-low);
}

.table th {
  padding: var(--space-4) var(--space-5);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  font-weight: 600;
  letter-spacing: 0.04em;
  text-align: start;
  text-transform: uppercase;
}

.table td {
  padding: var(--space-4) var(--space-5);
  border-block-start: 1px solid var(--color-outline-variant);
  vertical-align: middle;
}

.event {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.event__thumb {
  flex-shrink: 0;
  width: 2.75rem;
  height: 2.75rem;
  object-fit: cover;
  border-radius: var(--radius-md);
}

.event__name {
  color: var(--color-on-surface);
  font-weight: 600;
}

.event__ref {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

/* Date on top, time centred underneath it. */
.table__date {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
  white-space: nowrap;
}

.table__date-time {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  font-variant-numeric: tabular-nums;
}

.table__amount {
  color: var(--color-on-surface);
  font-size: var(--text-body-lg);
  font-weight: 700;
  white-space: nowrap;
}

.row-actions {
  display: flex;
  gap: var(--space-2);
  justify-content: flex-end;
}

/* --- Cards --- */
.cards {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.order-card {
  padding: var(--space-4);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
}

.order-card__head {
  display: flex;
  gap: var(--space-3);
  align-items: baseline;
  justify-content: space-between;
}

.order-card__date {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  margin-block: var(--space-2) var(--space-4);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}

.order-card .row-actions {
  justify-content: flex-start;
}

.pagination {
  margin-block-start: var(--space-6);
}

@media (width >= 640px) {
  .head {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

@media (width >= 768px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* The table only takes over at 1024, not 768: five columns carrying a cover
   image, a reference, a date, an amount and two buttons need about 990 px, and
   at 768 it was pushing 222 px of horizontal scroll onto the page. Below that
   the card stack says the same thing without the scroll. */
@media (width >= 1024px) {
  .table {
    display: table;
    width: 100%;
  }

  .cards {
    display: none;
  }
}
</style>
