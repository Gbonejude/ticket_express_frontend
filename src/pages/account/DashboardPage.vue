<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'

import StatCard from '@/components/account/StatCard.vue'
import EventCard from '@/components/event/EventCard.vue'
import { BaseAlert, BaseButton, BaseIcon, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { dataSource } from '@/data'
import { useAuthStore } from '@/stores/auth.store'
import { formatRelativeFromIso } from '@/utils/format'

/** Dashboard — Stitch screen « Tableau de bord ». */
const auth = useAuthStore()

const summary = useApiRequest(dataSource.account.dashboard)

const data = computed(() => summary.data.value)

const firstName = computed(() => auth.user?.firstName || auth.displayName || 'à vous')

/** "il y a 2 jours", or a dash until the visitor has ordered anything. */
const lastPurchase = computed(() => formatRelativeFromIso(data.value?.lastOrderAt))

onMounted(() => {
  void summary.execute()
})
</script>

<template>
  <div>
    <!-- Greeting -->
    <header class="greeting">
      <div>
        <h1 class="t-headline-xl">Bonjour, {{ firstName }} !</h1>
        <p class="greeting__lead t-body-lg">Voici ce qui se passe aujourd'hui avec vos billets.</p>
      </div>

      <BaseButton :to="{ name: 'events' }" size="lg" icon-end="arrow_forward">
        Explorer les événements
      </BaseButton>
    </header>

    <BaseAlert v-if="summary.error.value" variant="error" title="Chargement impossible">
      {{ summary.error.value.message }}
    </BaseAlert>

    <template v-else>
      <!-- Stats -->
      <div class="stats">
        <template v-if="summary.isLoading.value">
          <BaseSkeleton v-for="n in 3" :key="n" variant="block" height="7rem" />
        </template>

        <template v-else>
          <StatCard
            icon="confirmation_number"
            label="Billets actifs"
            :value="data?.ticketsCount ?? 0"
          />
          <StatCard icon="favorite" label="Favoris" :value="data?.favoritesCount ?? 0" />
          <StatCard icon="history" label="Dernier achat" :value="lastPurchase" />
        </template>
      </div>

      <!-- Two columns -->
      <div class="columns">
        <section>
          <header class="section-head">
            <h2 class="t-headline-lg">Événements à venir</h2>
            <RouterLink class="section-head__link" :to="{ name: 'tickets' }">
              Voir tout <BaseIcon name="chevron_right" :size="18" />
            </RouterLink>
          </header>

          <div v-if="summary.isLoading.value" class="upcoming">
            <BaseSkeleton v-for="n in 2" :key="n" variant="block" height="8rem" />
          </div>

          <div v-else class="upcoming">
            <EventCard
              v-for="event in data?.upcoming ?? []"
              :key="event.id"
              :event="event"
              :show-favorite="false"
              compact
              cta-label="Voir le billet"
              :cta-to="{ name: 'event-detail', params: { id: event.id } }"
            />
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.greeting {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-block-end: var(--space-10);
}

.greeting__lead {
  margin-block-start: var(--space-1);
  color: var(--color-secondary);
}

/* --- Stats --- */
.stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
  margin-block-end: var(--space-12);
}

/* --- Columns --- */
.columns {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  align-items: start;
}

.section-head {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  margin-block-end: var(--space-6);
}

.section-head__link {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  font-size: var(--text-label-bold);
  font-weight: 700;
}

/* Same grid as the home page: the cards are the same component. */
.upcoming {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

@media (width >= 640px) {
  .greeting {
    flex-direction: row;
    align-items: flex-end;
    justify-content: space-between;
  }
}

@media (width >= 768px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }

  .upcoming {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 1280px) {
  .upcoming {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
