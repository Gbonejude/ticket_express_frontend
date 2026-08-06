<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'

import EventCard from '@/components/event/EventCard.vue'
import { BaseAlert, BaseButton, BaseEmptyState, BaseIcon, BaseSkeleton } from '@/components/ui'
import { useApiRequest } from '@/composables/useApiRequest'
import { useFavorites } from '@/composables/useFavorites'
import { dataSource } from '@/data'
import type { IconName } from '@/components/ui'
import { eventCover } from '@/utils/event'

/**
 * Organiser profile — Stitch screen « Profil de l'organisateur (Ajusté) ».
 *
 * What "Ajusté" adjusts, compared with the earlier variants: the avatar, the
 * follower counts and the follow/collaborate buttons are gone. The mockup's
 * `ProfileSummary` block is deliberately empty, leaving the banner to carry
 * the identity on its own. None of it is reinstated here.
 *
 * The cards are the site's `EventCard`. The mockup draws its own, but the two
 * differ only in where the category badge sits, and a second card would drift
 * from the first the moment either changes.
 */
const props = defineProps<{ id: string }>()

const profile = useApiRequest(dataSource.organizers.get)
const agenda = useApiRequest(dataSource.organizers.events)

type Tab = 'upcoming' | 'past' | 'contact'

const tab = ref<Tab>('upcoming')

const organizer = computed(() => profile.data.value)
const upcoming = computed(() => agenda.data.value?.upcoming ?? [])
const past = computed(() => agenda.data.value?.past ?? [])

const shown = computed(() => (tab.value === 'past' ? past.value : upcoming.value))

const isLoading = computed(() => profile.isLoading.value || agenda.isLoading.value)

/**
 * The organiser's own logo carries the banner.
 *
 * It falls back to the cover of their next event, then to the generic hero:
 * `OrganizerResource` has no dedicated banner field, so a profile without a
 * logo would otherwise show an empty grey band.
 */
const banner = computed(() => {
  const source = upcoming.value[0] ?? past.value[0]

  return (
    organizer.value?.logo ?? (source ? eventCover(source) : null) ?? '/mock/hero-accueil.webp'
  )
})

/**
 * The three ways to reach the organiser directly.
 *
 * Only the ones the profile actually carries are offered: an "Appeler" button
 * on a missing number would dial nothing. The number serves both calling and
 * WhatsApp — the API has no separate WhatsApp field, and organisers here use
 * one line for both.
 *
 * `wa.me` needs the number with no +, spaces or dashes.
 */
type Channel = {
  icon: IconName
  /** Brand mark served locally; falls back to `icon` when absent. */
  logo?: string
  label: string
  value: string
  href: string
  external?: Record<string, string>
}

const channels = computed<Channel[]>(() => {
  const entry = organizer.value

  if (!entry) return []

  const list: Channel[] = []
  const email = entry.user?.email
  const phone = entry.user?.phone

  if (email) {
    list.push({
      icon: 'mail',
      logo: '/mock/icon-mail.svg',
      label: 'Envoyer un e-mail',
      value: email,
      href: `mailto:${email}?subject=${encodeURIComponent(`Question — ${entry.companyName}`)}`,
    })
  }

  if (phone) {
    list.push({
      icon: 'call',
      label: 'Appeler',
      value: phone,
      href: `tel:${phone.replace(/[^+\d]/gu, '')}`,
    })

    list.push({
      icon: 'chat',
      logo: '/mock/icon-whatsapp.svg',
      label: 'Écrire sur WhatsApp',
      value: phone,
      href: `https://wa.me/${phone.replace(/\D/gu, '')}`,
      external: { target: '_blank', rel: 'noopener noreferrer' },
    })
  }

  return list
})

/** The e-mail card sits on its own; the two phone routes share the other. */
const mailChannel = computed(() => channels.value.find((entry) => entry.icon === 'mail') ?? null)
const phoneChannels = computed(() => channels.value.filter((entry) => entry.icon !== 'mail'))

const favorites = useFavorites()

async function load(id: string): Promise<void> {
  await Promise.all([profile.execute(id), agenda.execute(id)])

  void favorites.ensureLoaded()
}

watch(
  () => props.id,
  (id) => void load(id),
)
onMounted(() => void load(props.id))
</script>

<template>
  <div class="organizer">
    <BaseAlert
      v-if="profile.error.value"
      class="container"
      variant="error"
      title="Profil indisponible"
    >
      {{ profile.error.value.message }}
    </BaseAlert>

    <template v-else>
      <!-- Banner -->
      <section class="banner">
        <BaseSkeleton v-if="isLoading" variant="block" height="25rem" />

        <template v-else>
          <img class="banner__image" :src="banner" alt="" aria-hidden="true" />
          <span class="banner__veil" aria-hidden="true" />

          <div class="banner__caption">
            <h1 class="banner__name t-headline-xl">{{ organizer?.companyName }}</h1>
            <p v-if="organizer?.description" class="banner__tagline t-body-md line-clamp-2">
              {{ organizer.description }}
            </p>
          </div>
        </template>
      </section>

      <!-- Tabs -->
      <nav class="tabs" aria-label="Sections du profil">
        <button
          class="tab"
          :class="{ 'tab--active': tab === 'upcoming' }"
          type="button"
          :aria-current="tab === 'upcoming' ? 'true' : undefined"
          @click="tab = 'upcoming'"
        >
          <BaseIcon name="calendar_month" :size="18" />
          À venir
          <span class="tab__count tab__count--accent">{{ upcoming.length }}</span>
        </button>

        <button
          class="tab"
          :class="{ 'tab--active': tab === 'past' }"
          type="button"
          :aria-current="tab === 'past' ? 'true' : undefined"
          @click="tab = 'past'"
        >
          <BaseIcon name="event_available" :size="18" />
          Passés
          <span class="tab__count">{{ past.length }}</span>
        </button>

        <button
          class="tab"
          :class="{ 'tab--active': tab === 'contact' }"
          type="button"
          :aria-current="tab === 'contact' ? 'true' : undefined"
          @click="tab = 'contact'"
        >
          <BaseIcon name="call" :size="18" />
          Contact
        </button>
      </nav>

      <!-- Events -->
      <section v-if="tab !== 'contact'" class="section">
        <header class="section__head">
          <h2 class="section__title t-headline-lg">
            {{ tab === 'upcoming' ? 'Prochains rendez-vous' : 'Événements passés' }}
          </h2>
          <span class="section__rule" aria-hidden="true" />
          <p class="section__lead t-body-md">
            {{
              tab === 'upcoming'
                ? `Nous avons sélectionné ${upcoming.length} événement${upcoming.length > 1 ? 's' : ''} pour vous`
                : `${past.length} événement${past.length > 1 ? 's' : ''} déjà passé${past.length > 1 ? 's' : ''}`
            }}
          </p>
        </header>

        <div v-if="isLoading" class="grid">
          <BaseSkeleton v-for="n in 2" :key="n" variant="block" height="26rem" />
        </div>

        <BaseEmptyState
          v-else-if="shown.length === 0"
          level="h3"
          icon="event"
          :title="tab === 'upcoming' ? 'Aucune date à venir' : 'Aucun événement passé'"
          description="Revenez bientôt : cet organisateur prépare sûrement quelque chose."
        >
          <template #action>
            <BaseButton :to="{ name: 'events' }">Explorer les événements</BaseButton>
          </template>
        </BaseEmptyState>

        <div v-else class="grid">
          <EventCard
            v-for="event in shown"
            :key="event.id"
            :event="event"
            :is-favorite="favorites.has(event.id)"
            compact
            @toggle-favorite="favorites.toggle"
          />
        </div>
      </section>

      <!-- Contact -->
      <section v-else class="section">
        <header class="section__head">
          <h2 class="section__title t-headline-lg">Contacter l'organisateur</h2>
          <span class="section__rule" aria-hidden="true" />
        </header>

        <div class="contact">
          <p class="contact__about t-body-lg">
            Une question sur un événement&nbsp;? Écrivez-nous ou appelez-nous directement.
          </p>

          <div v-if="mailChannel || phoneChannels.length > 0" class="channels">
            <a
              v-if="mailChannel"
              class="channel"
              :href="mailChannel.href"
              v-bind="mailChannel.external"
            >
              <span class="channel__icon">
                <img v-if="mailChannel.logo" :src="mailChannel.logo" alt="" />
                <BaseIcon v-else :name="mailChannel.icon" :size="22" />
              </span>
              <span class="channel__body">
                <span class="channel__label">{{ mailChannel.label }}</span>
                <span class="channel__value">{{ mailChannel.value }}</span>
              </span>
            </a>

            <!-- Call and WhatsApp share one cell: both reach the same number. -->
            <div v-if="phoneChannels.length > 0" class="channel channel--group">
              <a
                v-for="channel in phoneChannels"
                :key="channel.label"
                class="phone"
                :href="channel.href"
                v-bind="channel.external"
              >
                <span class="channel__icon">
                  <img v-if="channel.logo" :src="channel.logo" alt="" />
                  <BaseIcon v-else :name="channel.icon" :size="22" />
                </span>
                <span class="channel__body">
                  <span class="channel__label">{{ channel.label }}</span>
                  <span class="channel__value">{{ channel.value }}</span>
                </span>
              </a>
            </div>
          </div>

          <BaseAlert v-else variant="info" title="Coordonnées non publiées">
            Cet organisateur n'a pas rendu ses coordonnées publiques.
            <RouterLink :to="{ name: 'contact' }">Écrivez-nous</RouterLink> et nous ferons le lien.
          </BaseAlert>

          <ul class="contact__list">
            <li v-if="organizer?.website" class="contact__row">
              <BaseIcon name="language" :size="20" />
              <a :href="organizer.website" target="_blank" rel="noopener noreferrer">
                {{ organizer.website }}
              </a>
            </li>
            <li class="contact__row">
              <BaseIcon name="business_center" :size="20" />
              <span>{{ organizer?.eventsCount ?? 0 }} événements organisés</span>
            </li>
          </ul>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* --- Banner --- */
.banner {
  position: relative;
  min-height: 25rem;
  overflow: hidden;
}

.banner__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;

  /* The mockup zooms the photo slightly so its edges never show. */
  transform: scale(1.05);
}

/* Two stacked gradients in the mockup; one ramp does the same work. */
.banner__veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgb(0 0 0 / 80%) 0%, rgb(0 0 0 / 25%) 45%, transparent 100%);
}

.banner__caption {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  max-width: var(--container-max);
  padding: var(--space-8) var(--space-gutter);
  color: #fff;
}

.banner__name {
  color: #fff;
}

.banner__tagline {
  max-width: 40rem;
  margin-block-start: var(--space-1);
  color: rgb(255 255 255 / 85%);
}

/* --- Tabs --- */
.tabs {
  display: flex;
  gap: var(--space-6);
  justify-content: flex-start;
  width: 100%;
  max-width: 64rem;
  margin-inline: auto;
  margin-block-start: var(--space-10);
  padding-inline: var(--space-gutter);
  overflow-x: auto;
  border-block-end: 1px solid var(--color-surface-variant);
}

.tab {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-2);
  align-items: center;
  padding-block-end: var(--space-4);
  color: var(--color-secondary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  white-space: nowrap;
  border-block-end: 2px solid transparent;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.tab:hover {
  color: var(--color-on-surface);
}

.tab--active {
  color: var(--color-primary);
  border-block-end-color: var(--color-primary);
}

.tab__count {
  padding: 0.125rem var(--space-2);
  color: var(--color-secondary);
  font-size: 10px;
  background-color: var(--color-surface-container);
  border-radius: var(--radius-full);
}

.tab--active .tab__count--accent {
  color: #fff;
  background-color: var(--color-primary-container);
}

/* --- Sections --- */
.section {
  width: 100%;
  max-width: 64rem;
  margin-inline: auto;
  padding: var(--space-section-gap) var(--space-gutter);
}

.section__head {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-block-end: var(--space-12);
  text-align: center;
}

.section__rule {
  width: 3rem;
  height: 0.25rem;
  margin-block-start: var(--space-2);
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
}

.section__lead {
  margin-block-start: var(--space-4);
  color: var(--color-secondary);
}

.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-gutter);
  /* Three columns need the room; 56rem capped it at two however wide the
     viewport was. */
  max-width: 80rem;
  margin-inline: auto;
}

/* --- Contact --- */
.contact {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  align-items: flex-start;
  max-width: 44rem;
  margin-inline: auto;
}

.contact__about {
  width: 100%;
  color: var(--color-on-surface-variant);
  line-height: 1.6;
  text-align: center;
}

.contact__list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.contact__row {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
}

.contact__row a:hover {
  text-decoration: underline;
}

/* --- Direct channels --- */
.channels {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  width: 100%;
}

/* One cell for the e-mail, one for the two phone routes — the "col-6" split.
   Borders stay neutral; the brand marks carry the colour on their own. */
.channel {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  color: var(--color-on-surface);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-md);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

a.channel:hover {
  border-color: var(--color-outline);
  box-shadow: var(--shadow-sm);
}

.channel--group {
  flex-direction: column;
  gap: 0;
  align-items: stretch;
  padding: 0;
}

.phone {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-4);
  color: var(--color-on-surface);
  transition: background-color var(--transition-fast);
}

.phone:hover {
  background-color: var(--color-surface-container-low);
}

.phone + .phone {
  border-block-start: 1px solid var(--color-surface-variant);
}

.channel__icon {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-secondary);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-md);
}

/* A brand mark fills its box; a glyph keeps the tinted square behind it. */
.channel__icon:has(img) {
  background-color: transparent;
}

.channel__icon img {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
}

.channel__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.channel__label {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.channel__value {
  overflow: hidden;
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (width >= 640px) {
  .channels {
    grid-template-columns: repeat(2, 1fr);
    align-items: start;
  }

  /* Two columns on a tablet; the third only appears at 768px, where the cards
     still have room to breathe. */
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (width >= 768px) {
  .banner__caption {
    left: 50%;
    padding-inline: var(--space-component-padding);
    transform: translateX(-50%);
  }

  .tabs {
    gap: var(--space-12);
    justify-content: center;
  }

  .grid {
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-10);
  }
}
</style>
