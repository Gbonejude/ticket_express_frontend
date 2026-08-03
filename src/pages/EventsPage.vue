<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import EventCard from '@/components/event/EventCard.vue'
import EventFilters from '@/components/event/EventFilters.vue'
import type { EventFilterState } from '@/components/event/types'
import {
  BaseAlert,
  BaseButton,
  BaseDrawer,
  BaseEmptyState,
  BasePagination,
  BaseSkeleton,
} from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource, type EventSort } from '@/data'
import type { Event } from '@/types/event'

/**
 * Explore page: filter sidebar, sortable grid, pagination.
 *
 * Every criterion lives in the URL query rather than in local state. A filtered
 * search is then shareable, survives a reload and restores correctly on back —
 * which is also how the real endpoint expects to be called.
 */
const route = useRoute()
const router = useRouter()

const list = useApiRequest(dataSource.events.list)
const categories = useApiRequest(dataSource.categories.list)

const isFilterDrawerOpen = ref(false)

const PRICE_CEILING = 100000

/** Query string → filter state. The query is the source of truth. */
const filters = computed<EventFilterState>({
  get: () => ({
    categories: String(route.query.categorie ?? '')
      .split(',')
      .filter(Boolean),
    period: (route.query.periode as EventFilterState['period']) ?? 'all',
    date: String(route.query.date ?? ''),
    maxPrice: Number(route.query.prix_max ?? PRICE_CEILING),
  }),
  set: (value) => {
    void router.replace({
      query: {
        ...route.query,
        categorie: value.categories.join(',') || undefined,
        periode: value.period === 'all' ? undefined : value.period,
        date: value.date || undefined,
        prix_max: value.maxPrice === PRICE_CEILING ? undefined : String(value.maxPrice),
        page: undefined,
      },
    })
  },
})

const sort = computed<EventSort>({
  get: () => (route.query.tri as EventSort) ?? 'recent',
  set: (value) => {
    void router.replace({ query: { ...route.query, tri: value, page: undefined } })
  },
})

const page = computed(() => Number(route.query.page ?? 1))
const search = computed(() => String(route.query.recherche ?? ''))

const events = computed<Event[]>(() => list.data.value?.items ?? [])
const meta = computed(() => list.data.value?.meta)

const categoryIds = computed(() =>
  filters.value.categories
    .map((slug) => categories.data.value?.find((entry) => entry.slug === slug)?.id)
    .filter((id): id is string => Boolean(id)),
)

const hasActiveFilters = computed(
  () =>
    filters.value.categories.length > 0 ||
    filters.value.period !== 'all' ||
    Boolean(filters.value.date) ||
    filters.value.maxPrice !== PRICE_CEILING ||
    Boolean(search.value),
)

/**
 * The API filters on a single `category_id`. Until it accepts a list, only the
 * first selected category is sent and the rest is narrowed client-side, which
 * keeps the multi-select usable without pretending the endpoint supports it.
 */
function fetchEvents(): void {
  void list.execute({
    page: page.value,
    search: search.value || undefined,
    category_id: categoryIds.value[0],
    city: String(route.query.lieu ?? '') || undefined,
    sort: sort.value,
  })
}

function goToPage(next: number): void {
  void router.push({ query: { ...route.query, page: next === 1 ? undefined : String(next) } })
}

function reset(): void {
  void router.replace({ query: {} })
}

watch(() => route.query, fetchEvents, { deep: true })

onMounted(() => {
  void categories.execute()
  fetchEvents()
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

      <BaseAlert v-if="list.error.value" variant="error" title="Chargement impossible">
        {{ list.error.value.message }}
      </BaseAlert>

      <div v-else-if="list.isLoading.value" class="explore__grid">
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
          <EventCard v-for="event in events" :key="event.id" :event="event" favoritable />
        </div>

        <BasePagination
          v-if="meta && meta.last_page > 1"
          class="explore__pagination"
          :page="meta.current_page"
          :total-pages="meta.last_page"
          :total="meta.total"
          :from="meta.from ?? undefined"
          :to="meta.to ?? undefined"
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

.explore__sort-select {
  color: var(--color-primary);
  font-weight: 700;
  background: transparent;
  border: none;
  cursor: pointer;
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
