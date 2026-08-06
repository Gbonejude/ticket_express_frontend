<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'

import { BaseBadge, BaseButton, BaseIcon } from '@/components/ui'
import { CATEGORY_FALLBACK_ICON, CATEGORY_ICONS } from '@/constants/navigation'
import type { Event } from '@/types/event'
import {
  eventCover,
  eventDiscount,
  eventHighlight,
  eventLocation,
  eventStartingPrice,
  HIGHLIGHT_LABELS,
  HIGHLIGHT_VARIANTS,
  promotionalReference,
} from '@/utils/event'
import { formatEventSchedule, formatPrice } from '@/utils/format'

/**
 * The event card, used on the home page, the explore page and the dashboard.
 *
 * There is one card, not three: only the grid around it changes.
 *
 * The whole card is not a link — the buy button, the favourite toggle and the
 * favourite toggle are separate actions, and nesting them inside an
 * anchor would be invalid markup. The title carries the link and is stretched
 * over the card instead.
 *
 * The action and the footer are overridable so the same card serves screens
 * where the visitor already owns a ticket: "Mes billets" points at the ticket
 * rather than at the checkout, hides the favourite toggle, and puts the ticket
 * number where the organiser chip normally sits. One card, several contexts —
 * not several cards that drift apart.
 */
const props = withDefaults(
  defineProps<{
    event: Event
    isFavorite?: boolean
    /** Hides the organiser footer; for narrow columns. */
    compact?: boolean
    /** Overrides the call to action; defaults to buying a ticket. */
    ctaLabel?: string
    ctaTo?: RouteLocationRaw
    /** The title link, when it should not lead to the event page. */
    titleTo?: RouteLocationRaw
    /** Off on screens where favouriting makes no sense. */
    showFavorite?: boolean
  }>(),
  {
    isFavorite: false,
    compact: false,
    ctaLabel: undefined,
    ctaTo: undefined,
    titleTo: undefined,
    showFavorite: true,
  },
)

defineEmits<{ 'toggle-favorite': [event: Event] }>()

const cover = computed(() => eventCover(props.event))

/** The corner flag: last chance, sold out, en cours… */
const highlight = computed(() => eventHighlight(props.event))

/**
 * A promotion is flagged on its own, next to — not instead of — the stock flag.
 * The percentage is what makes the badge worth the space it takes.
 */
const discount = computed(() => eventDiscount(props.event))
const startingPrice = computed(() => eventStartingPrice(props.event))
/** Price before the discount, struck through beside the current one. */
const reference = computed(() => promotionalReference(props.event))
/**
 * "Complet" means every tier is gone — not that we were told about none.
 *
 * The length check is the point: `[].every()` is `true`, so an event whose
 * ticket types the endpoint did not load read as sold out and the buy button
 * came back greyed on every card.
 */
const isSoldOut = computed(() => {
  const types = props.event.ticketTypes ?? []

  return types.length > 0 && types.every((type) => !type.isAvailableForPurchase)
})

const categoryIcon = computed(
  () => CATEGORY_ICONS[props.event.category?.slug ?? ''] ?? CATEGORY_FALLBACK_ICON,
)

const to = computed<RouteLocationRaw>(() => ({
  name: 'event-detail',
  params: { id: props.event.id },
}))

const titleDestination = computed(() => props.titleTo ?? to.value)
const ctaDestination = computed(() => props.ctaTo ?? to.value)

/** A card pointing somewhere other than the checkout is never "sold out". */
const isCtaDisabled = computed(() => isSoldOut.value && !props.ctaTo)

/** Initial shown in the organiser chip when there is no logo. */
const organizerInitial = computed(() =>
  (props.event.organizer?.companyName ?? '?').charAt(0).toUpperCase(),
)
</script>

<template>
  <article class="event-card">
    <div class="event-card__media">
      <img
        v-if="cover"
        class="event-card__image"
        :src="cover"
        :alt="`Affiche de ${event.title}`"
        loading="lazy"
        decoding="async"
      />
      <div v-else class="event-card__image event-card__image--empty" aria-hidden="true">
        <BaseIcon name="local_activity" :size="36" />
      </div>

      <span v-if="event.category" class="event-card__category">
        <BaseIcon :name="categoryIcon" :size="12" />
        {{ event.category.name }}
      </span>

      <!--
        Opposite corner from the category chip: both used to be pinned top-right,
        so the badge painted over the chip and a promotion looked like a bug.

        Two flags, stacked, because they answer different questions — the green
        one is about the price, the one under it about what is left in stock.
      -->
      <div class="event-card__flags">
        <BaseBadge v-if="discount" variant="success" icon="loyalty" pill>
          Promo −{{ discount }}&nbsp;%
        </BaseBadge>

        <BaseBadge v-if="highlight" :variant="HIGHLIGHT_VARIANTS[highlight]" pill>
          {{ HIGHLIGHT_LABELS[highlight] }}
        </BaseBadge>
      </div>
    </div>

    <div class="event-card__body">
      <div class="event-card__head">
        <h3 class="event-card__title t-headline-md line-clamp-2">
          <RouterLink class="event-card__link" :to="titleDestination">{{ event.title }}</RouterLink>
        </h3>

        <button
          v-if="showFavorite"
          class="event-card__favorite"
          type="button"
          :aria-pressed="isFavorite"
          :aria-label="
            isFavorite ? `Retirer ${event.title} des favoris` : `Ajouter ${event.title} aux favoris`
          "
          @click="$emit('toggle-favorite', event)"
        >
          <BaseIcon :name="isFavorite ? 'favorite' : 'favorite_border'" :size="20" />
          <span class="event-card__favorite-count">{{ event.favoritesCount ?? 0 }}</span>
        </button>
      </div>

      <ul class="event-card__meta">
        <li class="event-card__meta-row">
          <BaseIcon name="calendar_month" :size="16" />
          <span>{{ formatEventSchedule(event.startDate) }}</span>
        </li>
        <li class="event-card__meta-row event-card__meta-row--price">
          <BaseIcon name="payments" :size="16" />
          <span v-if="startingPrice === null">Tarifs à venir</span>
          <span v-else>
            À partir de {{ formatPrice(startingPrice) }}
            <!-- The old price only makes sense next to the discounted one; the
                 badge alone left the visitor guessing what the promotion is off. -->
            <s v-if="reference !== null && reference > startingPrice" class="event-card__was">
              {{ formatPrice(reference) }}
            </s>
          </span>
        </li>
        <li class="event-card__meta-row">
          <BaseIcon name="location_on" :size="16" />
          <span class="line-clamp-1">{{ eventLocation(event) }}</span>
        </li>
      </ul>

      <BaseButton
        class="event-card__cta"
        variant="deep"
        block
        :to="ctaDestination"
        :disabled="isCtaDisabled"
      >
        {{ isCtaDisabled ? 'Complet' : (ctaLabel ?? 'Acheter tickets') }}
      </BaseButton>

      <div v-if="$slots.footer" class="event-card__organizer"><slot name="footer" /></div>

      <div v-else-if="!compact && event.organizer" class="event-card__organizer">
        <RouterLink
          class="event-card__organizer-identity"
          :to="{ name: 'organizer', params: { id: event.organizer.id } }"
        >
          <img
            v-if="event.organizer.logoThumbnail"
            class="event-card__organizer-logo"
            :src="event.organizer.logoThumbnail"
            alt=""
          />
          <span v-else class="event-card__organizer-initial" aria-hidden="true">
            {{ organizerInitial }}
          </span>

          <span class="event-card__organizer-name line-clamp-1">
            {{ event.organizer.companyName }}
          </span>
        </RouterLink>
      </div>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-base);
}

.event-card:hover {
  box-shadow: var(--shadow-md);
}

.event-card__media {
  position: relative;
  height: 12rem;
  overflow: hidden;
}

.event-card__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.event-card__image--empty {
  display: grid;
  place-items: center;
  color: var(--color-surface-dim);
  background-color: var(--color-surface-container);
}

/* Stacked in the corner opposite the category chip, so neither covers the
   other however many flags an event ends up carrying. */
.event-card__flags {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: flex-end;
}

.event-card__category {
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  display: flex;
  gap: var(--space-1);
  align-items: center;
  padding: 0.125rem var(--space-2);
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  background-color: color-mix(in srgb, var(--color-primary) 90%, transparent);
  border-radius: var(--radius-sm);
}

.event-card__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  padding: var(--space-component-padding);
}

.event-card__head {
  display: flex;
  gap: var(--space-2);
  align-items: flex-start;
  justify-content: space-between;
  margin-block-end: var(--space-2);
}

.event-card__title {
  color: var(--color-on-surface);
}

.event-card__link {
  color: inherit;
}

/* Makes the whole card activate the title link, while the buttons above it
   stay independently clickable. */
.event-card__link::after {
  position: absolute;
  inset: 0;
  content: '';
}

.event-card__link:hover {
  color: var(--color-primary);
}

.event-card__favorite {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  align-items: center;
  color: var(--color-on-surface-variant);
  transition: color var(--transition-fast);
}

.event-card__favorite:hover {
  color: var(--color-primary);
}

/* Bright red, not the deep brand red — see the same note on the event page. */
.event-card__favorite[aria-pressed='true'] {
  color: var(--color-primary-container);
}

.event-card__favorite-count {
  color: var(--color-secondary);
  font-size: 10px;
}

.event-card__meta {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  margin-block-end: var(--space-4);
}

.event-card__meta-row {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

/* The price is the one line that must catch the eye in a scan of the grid. */
.event-card__meta-row--price {
  color: var(--color-success);
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.event-card__was {
  margin-inline-start: var(--space-1);
  color: var(--color-secondary);
  font-weight: 500;
}

.event-card__cta {
  position: relative;
  z-index: 1;
}

.event-card__organizer {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  justify-content: space-between;
  margin-block-start: var(--space-4);
  padding-block-start: var(--space-4);
  border-block-start: 1px solid var(--color-surface-variant);
}

/* Sits above the title's stretched link so the organiser chip stays clickable
   on a card whose title otherwise covers the whole surface. */
.event-card__organizer-identity {
  position: relative;
  z-index: 1;
  display: flex;
  gap: var(--space-2);
  align-items: center;
  min-width: 0;
  transition: color var(--transition-fast);
}

.event-card__organizer-identity:hover {
  color: var(--color-primary);
}

.event-card__organizer-logo,
.event-card__organizer-initial {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  border-radius: var(--radius-full);
}

.event-card__organizer-logo {
  object-fit: cover;
}

.event-card__organizer-initial {
  display: grid;
  place-items: center;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  background-color: var(--color-primary);
}

.event-card__organizer-name {
  color: var(--color-on-surface-variant);
  font-size: 11px;
  font-weight: 600;
}
</style>
