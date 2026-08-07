<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import EventCard from '@/components/event/EventCard.vue'
import FaqAccordion from '@/components/event/FaqAccordion.vue'
import TicketTypeCard from '@/components/event/TicketTypeCard.vue'
import { BaseAlert, BaseButton, BaseIcon, BaseSkeleton, SectionHeading } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { useFavorites } from '@/composables/useFavorites'
import { dataSource } from '@/data'
import { useUiStore } from '@/stores/ui.store'
import { eventCover, eventLocation } from '@/utils/event'
import { directionsUrl, osmEmbedUrl } from '@/utils'
import { formatEventSchedule, formatPrice } from '@/utils/format'

/**
 * Event page — Stitch screen « Détails de l'événement (Style Tikerama) », plus
 * the "Cela peut vous plaire" row.
 *
 * Unlike the previous design, tickets are picked from a grid of tiers with one
 * stepper each: a visitor can take two standard seats and one VIP in the same
 * order, which a single radio choice could not express.
 */
const props = defineProps<{ id: string }>()

const router = useRouter()
const ui = useUiStore()

const detail = useApiRequest(dataSource.events.get)
const related = useApiRequest(dataSource.events.related)
const faq = useApiRequest(dataSource.events.faq)

/** Quantity per ticket type id. */
const basket = reactive<Record<string, number>>({})
const isDescriptionOpen = ref(false)

const favorites = useFavorites()

const event = computed(() => detail.data.value)
const ticketTypes = computed(() => event.value?.ticketTypes ?? [])

/** Un 404 sur cette page veut dire « cet événement n'est plus proposé ici ». */
const isGone = computed(() => detail.error.value?.isNotFound ?? false)

/**
 * Plus rien à vendre : tous les tarifs sont épuisés ou hors fenêtre de vente.
 *
 * Même test que la carte du catalogue (`EventCard`), pour que la page et la
 * vignette qui y mène ne se contredisent pas. Un événement sans aucun tarif
 * n'est pas « complet » — il n'a simplement pas encore de billetterie, et
 * `[].every()` répondrait vrai.
 */
const isSoldOut = computed(
  () =>
    ticketTypes.value.length > 0 &&
    ticketTypes.value.every((type) => !type.isAvailableForPurchase),
)

/** Reads through the store, so the heart agrees with the cards elsewhere. */
const isFavorite = computed(() => (event.value ? favorites.has(event.value.id) : false))

const total = computed(() =>
  ticketTypes.value.reduce((sum, type) => sum + type.currentPrice * (basket[type.id] ?? 0), 0),
)

const selectedCount = computed(() =>
  Object.values(basket).reduce((sum, quantity) => sum + quantity, 0),
)

const venueAddress = computed(() => {
  const venue = event.value?.venue

  if (!venue) return null

  return [venue.name, venue.address, venue.city, venue.country].filter(Boolean).join(', ')
})

/** Null when the organiser left the venue without coordinates. */
const venueEmbed = computed(() => {
  const venue = event.value?.venue

  if (!venue || venue.latitude == null || venue.longitude == null) return null

  return osmEmbedUrl(venue.latitude, venue.longitude)
})

/** Long descriptions are cut until the visitor asks for the rest. */
const DESCRIPTION_LIMIT = 260

const isDescriptionLong = computed(
  () => (event.value?.description?.length ?? 0) > DESCRIPTION_LIMIT,
)

const shownDescription = computed(() => {
  const text = event.value?.description ?? ''

  if (!isDescriptionLong.value || isDescriptionOpen.value) return text

  return `${text.slice(0, DESCRIPTION_LIMIT).trimEnd()}…`
})

async function load(): Promise<void> {
  const loaded = await detail.execute(props.id)

  if (!loaded) return

  await favorites.ensureLoaded()
  isDescriptionOpen.value = false

  for (const key of Object.keys(basket)) delete basket[key]
  for (const type of loaded.ticketTypes ?? []) basket[type.id] = 0

  // Passes the loaded event rather than its id: `related` would otherwise
  // fetch the very event this page just received.
  void related.execute(loaded, 4)
  void faq.execute()
}

async function toggleFavorite(): Promise<void> {
  if (!event.value) return

  await favorites.toggle(event.value)
}

function goToCheckout(): void {
  if (!event.value) return

  if (selectedCount.value === 0) {
    ui.notify('Choisissez au moins un billet avant de continuer.', 'warning')
    document.getElementById('billets')?.scrollIntoView({ behavior: 'smooth' })

    return
  }

  const lines = Object.entries(basket)
    .filter(([, quantity]) => quantity > 0)
    .map(([typeId, quantity]) => `${typeId}:${quantity}`)
    .join(',')

  void router.push({
    name: 'checkout',
    params: { eventId: event.value.id },
    query: { billets: lines },
  })
}

watch(() => props.id, load)

onMounted(load)
</script>

<template>
  <div class="container detail">
    <!-- Loading -->
    <div v-if="detail.isLoading.value" class="detail__loading">
      <BaseSkeleton variant="title" width="70%" />
      <BaseSkeleton :lines="4" />
      <BaseSkeleton variant="block" height="18rem" />
    </div>

    <!-- L'API répond 404 pour un événement que le côté public ne montre pas :
         terminé, ou d'un organisateur désactivé. On l'annonce comme une page
         introuvable, sans dire laquelle des deux — la distinction ne regarde pas
         le visiteur, et son message brut (« Ressource introuvable ») ne lui
         apprend rien sur ce qu'il cherchait. -->
    <div v-else-if="detail.error.value" class="detail__loading">
      <BaseAlert
        variant="error"
        :title="isGone ? 'Cet événement n’est plus disponible' : 'Événement indisponible'"
      >
        {{
          isGone
            ? 'Il est peut-être terminé, ou son organisateur ne le propose plus. Parcourez les événements à venir.'
            : detail.error.value.message
        }}
      </BaseAlert>
      <BaseButton :to="{ name: 'events' }">Retour aux événements</BaseButton>
    </div>

    <template v-else-if="event">
      <!-- Hero -->
      <section class="hero">
        <div class="hero__main">
          <div class="hero__heading">
            <h1 class="t-headline-xl">{{ event.title }}</h1>

            <button
              class="hero__favorite"
              type="button"
              :aria-pressed="isFavorite"
              :aria-label="isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'"
              @click="toggleFavorite"
            >
              <!--
                Outline until it is favourited, exactly like the cards. The
                filled glyph on its own painted a solid dark heart on a page the
                visitor had not favourited, which read as "already liked".
              -->
              <BaseIcon :name="isFavorite ? 'favorite' : 'favorite_border'" :size="24" />
            </button>
          </div>

          <p class="hero__description t-body-lg">
            {{ shownDescription }}
            <button
              v-if="isDescriptionLong"
              class="hero__more"
              type="button"
              :aria-expanded="isDescriptionOpen"
              @click="isDescriptionOpen = !isDescriptionOpen"
            >
              {{ isDescriptionOpen ? 'Réduire' : 'Lire plus' }}
              <BaseIcon
                class="hero__more-icon"
                :class="{ 'hero__more-icon--open': isDescriptionOpen }"
                name="expand_more"
                :size="14"
              />
            </button>
          </p>

          <ul class="hero__meta">
            <li class="hero__meta-row">
              <BaseIcon name="calendar_today" :size="22" />
              <span>{{ formatEventSchedule(event.startDate) }}</span>
            </li>
            <li class="hero__meta-row">
              <BaseIcon name="location_on" :size="22" />
              <span>{{ eventLocation(event) }}</span>
            </li>
            <li v-if="venueAddress" class="hero__meta-row">
              <BaseIcon name="hotel" :size="22" />
              <span>{{ venueAddress }}</span>
            </li>
          </ul>

          <div v-if="event.organizer" class="hero__organizer">
            <span class="hero__organizer-avatar">
              <BaseIcon name="person" :size="18" />
            </span>
            <span>
              Publié par
              <!--
                The name stays in the text colour, unadorned: the chevron and
                the hover state carry the affordance. A red underlined name read
                as a warning next to the rest of the black meta block.
              -->
              <RouterLink
                class="hero__organizer-link"
                :to="{ name: 'organizer', params: { id: event.organizer.id } }"
              >
                {{ event.organizer.companyName }}
                <BaseIcon name="chevron_right" :size="16" />
              </RouterLink>
            </span>
          </div>

          <!-- Un événement dont plus aucun tarif n'est disponible le dit sur son
               bouton. Il restait « Acheter tickets », et le clic répondait
               « Choisissez au moins un billet » — un conseil impossible à suivre,
               puisqu'aucun sélecteur de quantité n'est affiché. -->
          <BaseButton
            class="hero__cta"
            block
            size="lg"
            :disabled="isSoldOut"
            :icon-end="isSoldOut ? undefined : 'keyboard_double_arrow_right'"
            @click="goToCheckout"
          >
            <template v-if="isSoldOut">Complet</template>
            <template v-else>
              Acheter tickets
              <template v-if="selectedCount > 0">&nbsp;· {{ formatPrice(total) }}</template>
            </template>
          </BaseButton>
        </div>

        <div class="hero__media">
          <img
            v-if="eventCover(event)"
            :src="eventCover(event)!"
            :alt="`Affiche de ${event.title}`"
          />
        </div>
      </section>

      <hr class="divider" />

      <!-- Ticket selection -->
      <section id="billets" class="section-block">
        <h2 class="t-headline-lg section-block__title">Choisissez vos tickets</h2>

        <div class="tickets">
          <TicketTypeCard
            v-for="type in ticketTypes"
            :key="type.id"
            v-model="basket[type.id]"
            :ticket-type="type"
          />
        </div>
      </section>

      <!-- Location and FAQ -->
      <section class="split">
        <div>
          <h2 class="t-headline-lg section-block__title">Lieu sur carte</h2>

          <div class="map">
            <div v-if="event.venue" class="map__card">
              <div>
                <p class="map__name">{{ event.venue.name }}</p>
                <p class="map__address">
                  {{
                    [event.venue.address, event.venue.city, event.venue.country]
                      .filter(Boolean)
                      .join(', ')
                  }}
                </p>
              </div>

              <a
                class="map__link"
                :href="directionsUrl(venueAddress ?? event.venue.name, event.venue)"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ouvrir dans Google Maps"
              >
                <BaseIcon name="directions" :size="20" />
              </a>
            </div>

            <iframe
              v-if="venueEmbed"
              class="map__frame"
              :src="venueEmbed"
              :title="`Carte : ${event.venue?.name}`"
              loading="lazy"
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>
            <p v-else class="map__missing">Localisation non renseignée par l'organisateur.</p>
          </div>
        </div>

        <div>
          <h2 class="t-headline-lg section-block__title">Questions fréquentes</h2>
          <FaqAccordion :entries="faq.data.value ?? []" />
        </div>
      </section>

      <!-- Related -->
      <section v-if="(related.data.value ?? []).length" class="section-block">
        <SectionHeading
          eyebrow="Dans la même catégorie"
          title="Cela peut vous plaire"
          description="D'autres événements sélectionnés pour vous"
        >
          <template #action>
            <BaseButton variant="ghost" :to="{ name: 'events' }" icon-end="chevron_right">
              Voir tout
            </BaseButton>
          </template>
        </SectionHeading>

        <div class="related">
          <EventCard
            v-for="item in related.data.value ?? []"
            :key="item.id"
            :event="item"
            compact
          />
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.detail {
  padding-block: var(--space-8) var(--space-section-gap);
}

.detail__loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding-block: var(--space-8);
}

/* --- Hero --- */
.hero {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-8);
  margin-block-end: var(--space-section-gap);
}

.hero__main {
  display: flex;
  flex-direction: column;
  justify-content: center;
  order: 2;
}

.hero__media {
  order: 1;
  aspect-ratio: 1;
  overflow: hidden;
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.hero__media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero__heading {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  justify-content: space-between;
  margin-block-end: var(--space-4);
}

.hero__favorite {
  flex-shrink: 0;
  padding: var(--space-2);
  color: var(--color-on-surface-variant);
  transition: color var(--transition-fast);
}

.hero__favorite:hover {
  color: var(--color-primary);
}

/* The favourited heart takes the bright red rather than the deep brand red:
   at icon size #b9000a reads as near-black, which is the whole reason the
   pressed state looked like it had not changed. */
.hero__favorite[aria-pressed='true'] {
  color: var(--color-primary-container);
}

.hero__description {
  margin-block-end: var(--space-6);
  color: var(--color-secondary);
  line-height: 1.7;
}

.hero__more {
  display: inline-flex;
  gap: var(--space-1);
  align-items: center;
  color: inherit;
  font: inherit;
  font-weight: 600;
}

.hero__more:hover {
  text-decoration: underline;
}

.hero__more-icon {
  transition: transform var(--transition-fast);
}

.hero__more-icon--open {
  transform: rotate(180deg);
}

.hero__meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-block-end: var(--space-6);
}

.hero__meta-row {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
}

.hero__organizer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  margin-block-end: var(--space-8);
  font-size: var(--text-body-md);
}

.hero__organizer-link {
  display: inline-flex;
  gap: 0.125rem;
  align-items: center;
  color: var(--color-on-surface);
  font-weight: 700;
  text-decoration: none;
  transition: color var(--transition-fast);
}

.hero__organizer-link:hover {
  color: var(--color-primary);
}

.hero__organizer-avatar {
  display: grid;
  place-items: center;
  width: 2rem;
  height: 2rem;
  color: var(--color-secondary);
  background-color: var(--color-secondary-container);
  border-radius: var(--radius-full);
}

.hero__cta {
  font-size: var(--text-headline-lg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

/* --- Blocks --- */
.divider {
  margin-block-end: var(--space-section-gap);
  border: none;
  border-block-start: 1px solid var(--color-surface-variant);
}

.section-block {
  margin-block-end: var(--space-section-gap);
}

.section-block__title {
  margin-block-end: var(--space-gutter);
}

.tickets {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

.split {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-section-gap);
  margin-block-end: var(--space-section-gap);
}

/* --- Map --- */
.map {
  position: relative;
  height: 25rem;
  overflow: hidden;
  background-color: var(--color-surface-variant);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
}

.map__frame {
  width: 100%;
  height: 100%;
  border: none;
}

.map__missing {
  display: grid;
  place-items: center;
  height: 100%;
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  background-color: var(--color-surface-container);
}

.map__card {
  position: absolute;
  top: var(--space-4);
  left: var(--space-4);
  z-index: 1;
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  justify-content: space-between;
  max-width: 18rem;
  padding: var(--space-3);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-lg);
}

.map__name {
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.map__address {
  margin-block-start: var(--space-1);
  color: var(--color-secondary);
  font-size: 11px;
}

.map__link {
  flex-shrink: 0;
  color: var(--color-primary);
}

/* --- Related --- */
.related {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
}

@media (width >= 640px) {
  .tickets {
    grid-template-columns: repeat(2, 1fr);
  }

  .related {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 768px) {
  .hero {
    grid-template-columns: 7fr 5fr;
  }

  .hero__main {
    order: 1;
  }

  .hero__media {
    order: 2;
  }
}

@media (width >= 1024px) {
  .tickets {
    grid-template-columns: repeat(3, 1fr);
  }

  .split {
    grid-template-columns: repeat(2, 1fr);
  }

  .related {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
