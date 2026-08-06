<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

import CategoryTiles from '@/components/event/CategoryTiles.vue'
import EventCard from '@/components/event/EventCard.vue'
import {
  BaseAlert,
  BaseButton,
  BaseEmptyState,
  BaseIcon,
  BasePagination,
  BaseSkeleton,
} from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { useFavorites } from '@/composables/useFavorites'
import { useSearchStore } from '@/stores/search.store'
import { dataSource } from '@/data'
import type { Event } from '@/types/event'

/**
 * Home page — Stitch screen « Accueil (Style Tikerama Mise à jour) », with the
 * banner image of « Accueil (Optimisé) ».
 *
 * Unlike the other home variant, this one filters in place: picking a category
 * reloads the grid below rather than handing over to the explore page. That is
 * what the count indicator and the "Filtres avancés" shortcut are for.
 */
const router = useRouter()
const favorites = useFavorites()
const searchStore = useSearchStore()

const list = useApiRequest(dataSource.events.list)
const categories = useApiRequest(dataSource.categories.list)

const activeCategory = ref('')
const page = ref(1)

const events = computed<Event[]>(() => list.data.value?.items ?? [])
const meta = computed(() => list.data.value?.meta)
const total = computed(() => list.data.value?.meta.total ?? 0)

const categoryId = computed(
  () => categories.data.value?.find((entry) => entry.slug === activeCategory.value)?.id,
)

/** Twelve per page: three full rows of the four-column grid below. */
const PER_PAGE = 12

function load(): void {
  void list.execute({
    page: page.value,
    per_page: PER_PAGE,
    category_id: categoryId.value,
    // The header search filters the home grid in place rather than sending the
    // visitor to the explore page — they are already looking at events.
    search: searchStore.term || undefined,
    // The home page is a shop window: nothing that has already happened.
    when: 'upcoming',
    sort: 'date-asc',
  })
}

function goToPage(next: number): void {
  page.value = next
  document.getElementById('evenements')?.scrollIntoView({ behavior: 'smooth' })
}

watch(page, load)

// Typing in the header re-queries the grid; the term is debounced there.
watch(
  () => searchStore.term,
  () => {
    if (page.value === 1) load()
    else page.value = 1
  },
)

// Changing category restarts at the first page; page 3 of "Sport" rarely
// exists when page 3 of "tout" did.
watch(activeCategory, () => {
  if (page.value === 1) load()
  else page.value = 1
})

onMounted(async () => {
  await categories.execute()
  load()

  void favorites.ensureLoaded()
})
</script>

<template>
  <div class="home">
    <!--
      Banner: the hero of « Accueil (Optimisé) ». Full-bleed rather than boxed:
      it is the first thing on the page and the photo carries the whole mood.
    -->
    <section class="banner">
      <img class="banner__image" src="/mock/hero-accueil.webp" alt="" aria-hidden="true" />
      <div class="banner__scrim" aria-hidden="true" />

      <div class="banner__content">
        <h1 class="banner__title t-headline-xl">
          Vivez l'instant, réservez vos émotions en un clic.
        </h1>
        <p class="banner__lead">
          Découvrez les meilleurs concerts, festivals et spectacles partout au Togo.
        </p>

        <div class="banner__actions">
          <BaseButton size="lg" :to="{ name: 'events' }" icon-end="keyboard_double_arrow_right">
            Découvrir les événements
          </BaseButton>
          <BaseButton size="lg" variant="glass" :to="{ name: 'about', hash: '#comment-ca-marche' }">
            Comment ça marche&nbsp;?
          </BaseButton>
        </div>
      </div>
    </section>

    <!-- Categories: full-bleed too, so the row can scroll edge to edge -->
    <section class="categories" aria-labelledby="titre-categories">
      <h2 id="titre-categories" class="visually-hidden">Parcourir par catégorie</h2>

      <div class="categories__switch">
        <button class="categories__switch-button" type="button" aria-current="true">
          Événements
        </button>
      </div>

      <CategoryTiles v-model="activeCategory" :categories="categories.data.value ?? []" />
    </section>

    <!-- Count and filters -->
    <h2 id="evenements" class="visually-hidden">Événements</h2>

    <div class="container toolbar">
      <span class="toolbar__count">
        {{ total }} {{ total > 1 ? 'événements trouvés' : 'événement trouvé' }}
      </span>

      <button class="toolbar__filters" type="button" @click="router.push({ name: 'events' })">
        <BaseIcon name="tune" :size="16" />
        Filtres avancés
      </button>
    </div>

    <!-- Event grid -->
    <BaseAlert
      v-if="list.error.value"
      class="container"
      variant="error"
      title="Chargement impossible"
    >
      {{ list.error.value.message }}
    </BaseAlert>

    <div v-else-if="list.isLoading.value" class="container grid">
      <div v-for="index in 4" :key="index" class="grid__skeleton">
        <BaseSkeleton variant="block" height="12rem" />
        <div class="grid__skeleton-body">
          <BaseSkeleton variant="title" width="85%" />
          <BaseSkeleton :lines="3" />
        </div>
      </div>
    </div>

    <BaseEmptyState
      v-else-if="events.length === 0"
      class="container"
      icon="search"
      title="Aucun événement dans cette catégorie"
      description="Choisissez une autre catégorie, ou parcourez l'ensemble du catalogue."
    >
      <template #action>
        <BaseButton @click="activeCategory = ''">Voir toutes les catégories</BaseButton>
      </template>
    </BaseEmptyState>

    <template v-else>
      <div class="container grid">
        <EventCard
          v-for="event in events"
          :key="event.id"
          :event="event"
          :is-favorite="favorites.has(event.id)"
          @toggle-favorite="favorites.toggle"
        />
      </div>

      <div v-if="meta && meta.last_page > 1" class="container pagination">
        <BasePagination
          :page="meta.current_page"
          :total-pages="meta.last_page"
          :total="meta.total"
          :from="meta.from ?? undefined"
          :to="meta.to ?? undefined"
          item-label="événements"
          @update:page="goToPage"
        />
      </div>
    </template>
  </div>
</template>

<style scoped>
.home {
  padding-block-end: var(--space-section-gap);
}

/* --- Banner --- */
.banner {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  /* Taller than the plain banner of the mockup: it now has to hold the
     headline and both buttons without cramping them on a phone. */
  min-height: 22rem;
  margin-block-end: var(--space-8);
  overflow: hidden;
}

.banner__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.banner__scrim {
  position: absolute;
  inset: 0;
  background-color: rgb(0 0 0 / 40%);
}

.banner__content {
  position: relative;
  z-index: 1;
  max-width: 48rem;
  padding: var(--space-10) var(--space-gutter);
  text-align: center;
}

.banner__title {
  margin-block-end: var(--space-4);
  color: #fff;
}

.banner__lead {
  margin-block-end: var(--space-8);
  color: rgb(255 255 255 / 90%);
  font-size: var(--text-body-lg);
}

.banner__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* --- Categories --- */
.categories {
  padding-block: var(--space-4);
  padding-inline: var(--space-component-padding);
  margin-block-end: var(--space-stack-md);
}

.categories__switch {
  display: flex;
  justify-content: center;
  margin-block-end: var(--space-6);
}

.categories__switch-button {
  padding: var(--space-2) var(--space-6);
  color: var(--color-primary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-full);
}

/* --- Toolbar --- */
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: center;
  justify-content: center;
  padding-block: var(--space-6);
}

.toolbar__count {
  padding: 0.375rem var(--space-4);
  color: var(--color-secondary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  background-color: var(--color-surface-container);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-full);
}

.toolbar__filters {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: 0.375rem var(--space-4);
  color: var(--color-secondary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.toolbar__filters:hover {
  background-color: var(--color-surface-variant);
}

/* --- Grid --- */
.pagination {
  margin-block-start: var(--space-section-gap);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

.grid__skeleton {
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
}

.grid__skeleton-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-component-padding);
}

@media (width >= 640px) {
  .banner__actions {
    flex-direction: row;
    justify-content: center;
  }
}

@media (width >= 768px) {
  .banner {
    min-height: 26rem;
  }

  .categories {
    padding-inline: var(--space-gutter);
  }

  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 1024px) {
  .banner {
    min-height: 30rem;
  }

  .grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
