<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

import EventCard from '@/components/event/EventCard.vue'
import EventFilters from '@/components/event/EventFilters.vue'
import OrganizerCard from '@/components/event/OrganizerCard.vue'
import type { EventFilterState } from '@/components/event/types'
import {
  BaseAlert,
  BaseButton,
  BaseDrawer,
  BaseEmptyState,
  BasePagination,
  BaseSkeleton,
} from '@/components/ui'
import { ApiError } from '@/api'
import { useApiRequest } from '@/composables/useApiRequest'
import { useFavorites } from '@/composables/useFavorites'
import { dataSource, type EventSort } from '@/data'
import { useCatalogStore } from '@/stores/catalog.store'
import { useSearchStore } from '@/stores/search.store'
import type { Event } from '@/types/event'

/**
 * Explore page: filter sidebar, sortable grid, pagination.
 *
 * Everything happens in the browser, over the catalogue the store holds, so the
 * controls answer instantly and the URL stays clean. See `filters` below for
 * what that costs, and `catalog.loadEvents` for why it is correct.
 */
const catalog = useCatalogStore()
const searchStore = useSearchStore()
const favorites = useFavorites()

/** Only the catalogue fetch can fail here; the filtering cannot. */
const catalogError = ref<ApiError | null>(null)
const categories = useApiRequest(dataSource.categories.list)

const isFilterDrawerOpen = ref(false)

const PRICE_CEILING = 100000

/**
 * Filter state, held locally.
 *
 * Deliberately *not* mirrored in the URL: the address bar filled up with a
 * trail of `?format=…&prix_max=…&tri=…` behind every click on a control. The
 * cost is that a filtered view is no longer shareable — accepted, because
 * these are browsing controls rather than a destination.
 */
const filters = ref<EventFilterState>({
  categories: [],
  period: 'all',
  date: '',
  maxPrice: PRICE_CEILING,
  eventType: 'all',
  organizer: '',
})

const sort = ref<EventSort>('recent')

const page = ref(1)

/** The header search box writes here; no query parameter is involved. */
const search = computed(() => searchStore.term)

/**
 * Organisers whose name matches the search.
 *
 * Shown above the grid, because searching for "Bawa" means looking for the
 * promoter as much as for their events: matching their events only and never
 * naming them left the visitor with no way to reach the profile.
 *
 * Matched in the browser over the whole directory, like every other filter on
 * this page. Empty while nothing is typed — this is a search result, not a
 * permanent block.
 */
const matchingOrganizers = computed(() => {
  const term = search.value.trim().toLowerCase()

  if (!term) return []

  return catalog.organizers.filter((organizer) =>
    organizer.companyName.toLowerCase().includes(term),
  )
})

const hasActiveFilters = computed(
  () =>
    filters.value.categories.length > 0 ||
    filters.value.period !== 'all' ||
    Boolean(filters.value.date) ||
    filters.value.maxPrice !== PRICE_CEILING ||
    filters.value.eventType !== 'all' ||
    Boolean(filters.value.organizer) ||
    Boolean(search.value),
)

/**
 * The date window behind "ce week-end", "la semaine prochaine" and "ce mois-ci".
 *
 * Resolved here rather than server-side because "this weekend" depends on the
 * visitor's own clock, not the server's. The endpoint takes plain bounds.
 */
function periodWindow(period: EventFilterState['period']): { after?: string; before?: string } {
  if (period === 'all') return {}

  const iso = (date: Date): string => date.toISOString().slice(0, 10)
  const today = new Date()

  if (period === 'weekend') {
    // Saturday of the current week through Sunday.
    const saturday = new Date(today)

    saturday.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7))

    const sunday = new Date(saturday)

    sunday.setDate(saturday.getDate() + 1)

    return { after: iso(saturday), before: iso(sunday) }
  }

  if (period === 'next-week') {
    const start = new Date(today)

    start.setDate(today.getDate() + 7)

    const end = new Date(start)

    end.setDate(start.getDate() + 7)

    return { after: iso(start), before: iso(end) }
  }

  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  return { after: iso(today), before: iso(endOfMonth) }
}

/**
 * Everything below runs in the browser, on the catalogue the store holds.
 *
 * The endpoint supports every one of these filters, and the home page uses it
 * that way. Here they are applied locally because this screen is a control
 * panel: dragging the price slider or ticking three categories would otherwise
 * be a request each, and the grid would flicker behind the cursor.
 *
 * This is only correct because the store loads the *whole* upcoming catalogue
 * (see `loadEvents`). Filtering one page client-side would give wrong results
 * from page two onwards.
 */
const matchesSearch = (event: Event, term: string): boolean => {
  if (!term) return true

  const haystack = [
    event.title,
    event.description,
    event.category?.name,
    event.venue?.name,
    event.venue?.city,
    event.organizer?.companyName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(term.toLowerCase())
}

const startsAt = (event: Event): number =>
  event.startDate ? new Date(event.startDate.datetime).getTime() : 0

const cheapest = (event: Event): number => {
  const prices = (event.ticketTypes ?? []).map((type) => type.currentPrice)

  return prices.length ? Math.min(...prices) : Number.POSITIVE_INFINITY
}

/** The catalogue narrowed by every active criterion, before pagination. */
const filtered = computed<Event[]>(() => {
  const { categories: slugs, maxPrice, eventType, organizer, date, period } = filters.value
  const window = periodWindow(period)

  // An explicit date beats the period preset: picking one is a narrower intent.
  const after = date ? Date.parse(`${date}T00:00:00`) : window.after ? Date.parse(window.after) : null
  const before = date
    ? Date.parse(`${date}T23:59:59`)
    : window.before
      ? Date.parse(`${window.before}T23:59:59`)
      : null

  const organizerTerm = organizer.trim().toLowerCase()

  return catalog.events.filter((event) => {
    if (!matchesSearch(event, search.value)) return false

    // The multi-select is honoured in full here, which the endpoint's single
    // `category_id` could not do.
    if (slugs.length > 0 && !slugs.includes(event.category?.slug ?? '')) return false

    if (eventType !== 'all' && event.eventType !== eventType) return false

    if (organizerTerm && !(event.organizer?.companyName ?? '').toLowerCase().includes(organizerTerm)) {
      return false
    }

    if (maxPrice !== PRICE_CEILING && cheapest(event) > maxPrice) return false

    const start = startsAt(event)

    if (after !== null && start < after) return false
    if (before !== null && start > before) return false

    return true
  })
})

const sorted = computed<Event[]>(() => {
  const rows = [...filtered.value]

  if (sort.value === 'price-asc') return rows.sort((a, b) => cheapest(a) - cheapest(b))
  if (sort.value === 'price-desc') return rows.sort((a, b) => cheapest(b) - cheapest(a))
  if (sort.value === 'date-desc') return rows.sort((a, b) => startsAt(b) - startsAt(a))

  return rows.sort((a, b) => startsAt(a) - startsAt(b))
})

const PER_PAGE = 12

const lastPage = computed(() => Math.max(1, Math.ceil(sorted.value.length / PER_PAGE)))

/**
 * Clamped, so narrowing the filters while on page 4 never leaves the visitor
 * staring at an empty grid.
 */
const currentPage = computed(() => Math.min(Math.max(page.value, 1), lastPage.value))

const events = computed<Event[]>(() =>
  sorted.value.slice((currentPage.value - 1) * PER_PAGE, currentPage.value * PER_PAGE),
)

const total = computed(() => sorted.value.length)

// Narrowing the results restarts at the first page; staying on page 4 of a
// three-page result is how a filter looks broken.
watch([filters, sort, search], () => {
  page.value = 1
}, { deep: true })

function goToPage(next: number): void {
  page.value = next
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function reset(): void {
  filters.value = {
    categories: [],
    period: 'all',
    date: '',
    maxPrice: PRICE_CEILING,
    eventType: 'all',
    organizer: '',
  }
  sort.value = 'recent'
  searchStore.clear()
  page.value = 1
}

onMounted(() => {
  void categories.execute()
  void favorites.ensureLoaded()
  // Failure here is not worth an error banner: the search simply stops naming
  // organisers, and the event grid — the point of the page — is unaffected.
  void catalog.loadOrganizers().catch(() => undefined)
  catalog.loadEvents().catch((error: unknown) => {
    catalogError.value = error instanceof ApiError ? error : new ApiError('Chargement impossible.')
  })
})
</script>

<template>
  <div class="container explore">
    <!-- Filters: sidebar on desktop, drawer below it -->
    <aside class="explore__sidebar">
      <div class="explore__filters-panel">
        <EventFilters
          v-model="filters"
          :categories="categories.data.value ?? []"
          :price-ceiling="PRICE_CEILING"
          @reset="reset"
        />
      </div>
    </aside>

    <div class="explore__content">
      <div class="explore__header">
        <div>
          <h1 class="t-headline-lg">Explorer les événements</h1>
          <p v-if="search" class="explore__search-note">Résultats pour « {{ search }} »</p>
        </div>

        <div class="explore__toolbar">
          <BaseButton
            class="explore__filter-trigger"
            variant="outline"
            icon-start="tune"
            @click="isFilterDrawerOpen = true"
          >
            Filtres
          </BaseButton>

          <div class="explore__sort">
            <label class="t-label explore__sort-label" for="sort">Trier par</label>
            <select id="sort" v-model="sort" class="explore__sort-select">
              <option value="recent">Plus récents</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Organiser hits come before the events: they are the narrower answer
           to a name typed in the search box. -->
      <section v-if="matchingOrganizers.length" class="explore__organizers">
        <h2 class="t-label explore__organizers-title">
          {{ matchingOrganizers.length > 1 ? 'Organisateurs trouvés' : 'Organisateur trouvé' }}
        </h2>

        <div class="explore__organizers-row">
          <OrganizerCard
            v-for="organizer in matchingOrganizers"
            :key="organizer.id"
            :organizer="organizer"
          />
        </div>
      </section>

      <BaseAlert v-if="catalogError" variant="error" title="Chargement impossible">
        {{ catalogError.message }}
      </BaseAlert>

      <div v-else-if="catalog.isLoadingEvents" class="explore__grid">
        <div v-for="index in 6" :key="index" class="explore__skeleton">
          <BaseSkeleton variant="block" height="180px" />
          <BaseSkeleton variant="title" width="80%" />
          <BaseSkeleton :lines="2" />
        </div>
      </div>

      <BaseEmptyState
        v-else-if="events.length === 0"
        icon="search"
        title="Aucun événement ne correspond"
        description="Essayez d'élargir vos critères : une autre catégorie, une période plus large ou un budget plus élevé."
      >
        <template #action>
          <BaseButton v-if="hasActiveFilters" @click="reset">Réinitialiser les filtres</BaseButton>
        </template>
      </BaseEmptyState>

      <template v-else>
        <div class="explore__grid">
          <EventCard
            v-for="event in events"
            :key="event.id"
            :event="event"
            :is-favorite="favorites.has(event.id)"
            @toggle-favorite="favorites.toggle"
          />
        </div>

        <BasePagination
          v-if="lastPage > 1"
          class="explore__pagination"
          :page="currentPage"
          :total-pages="lastPage"
          :total="total"
          :from="(currentPage - 1) * PER_PAGE + 1"
          :to="Math.min(currentPage * PER_PAGE, total)"
          item-label="événements"
          @update:page="goToPage"
        />
      </template>
    </div>

    <BaseDrawer v-model:open="isFilterDrawerOpen" title="Filtres">
      <EventFilters
        v-model="filters"
        :categories="categories.data.value ?? []"
        :price-ceiling="PRICE_CEILING"
        @reset="reset"
      />
    </BaseDrawer>
  </div>
</template>

<style scoped>
.explore {
  display: flex;
  gap: var(--space-8);
  align-items: flex-start;
  padding-block: var(--space-10);
}

.explore__sidebar {
  display: none;
  flex-shrink: 0;
  width: 18rem;
}

.explore__filters-panel {
  position: sticky;
  top: calc(var(--header-height) + var(--space-4));
  padding: var(--space-6);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-lg);
}

.explore__content {
  flex: 1;
  min-width: 0;
}

.explore__header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-8);
}

.explore__search-note {
  margin-block-start: var(--space-1);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-sm);
}

.explore__toolbar {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.explore__sort {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.explore__sort-label {
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

/* A neutral control, not a call to action: the brand red made "Trier par"
   read as the most important thing on the page. */
.explore__sort-select {
  padding: var(--space-2) var(--space-3);
  color: var(--color-on-surface);
  font-weight: 600;
  background-color: var(--color-surface);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.explore__sort-select:hover {
  border-color: var(--color-outline);
}

.explore__sort-select:focus-visible {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--color-focus) 10%, transparent);
}

/* --- Organiser hits --- */
.explore__organizers {
  padding: var(--space-4);
  margin-block-end: var(--space-8);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-lg);
}

.explore__organizers-title {
  margin-block-end: var(--space-3);
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

/* Scrolls sideways rather than wrapping: a name usually matches one or two
   organisers, and a full grid for two tiles reads as an empty section. */
.explore__organizers-row {
  display: flex;
  gap: var(--space-3);
  overflow-x: auto;
}

.explore__organizers-row > * {
  flex: 0 0 9.5rem;
}

.explore__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
  gap: var(--space-gutter);
}

.explore__skeleton {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--color-outline-variant);
  border-radius: var(--radius-md);
}

.explore__pagination {
  margin-block-start: var(--space-12);
  padding-block-start: var(--space-6);
  border-block-start: 1px solid var(--color-outline-variant);
}

@media (width >= 1024px) {
  .explore__sidebar {
    display: block;
  }

  .explore__filter-trigger {
    display: none;
  }
}
</style>
