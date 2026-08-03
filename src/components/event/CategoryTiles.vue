<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, ref, watch } from 'vue'

import { BaseIcon } from '@/components/ui'
import { CATEGORY_FALLBACK_ICON, CATEGORY_ICONS } from '@/constants/navigation'
import type { EventCategory } from '@/types/event'

/**
 * Horizontally scrolling row of square category tiles.
 *
 * The tiles behave as a single-choice filter, with the empty value meaning
 * "Toutes". They are buttons carrying `aria-pressed` rather than radios: the
 * mockup draws a scrolling toolbar, and a radio group would announce a form
 * field that is never submitted.
 *
 * The arrows only appear when the row actually overflows, and each one hides
 * once that end is reached — an arrow that does nothing is worse than none.
 * They are hidden from assistive technology: the buttons are already in the
 * tab order, so a screen reader has no use for a scroll shortcut.
 */
const props = defineProps<{ categories: EventCategory[] }>()

/** Empty string means no category filter. */
const model = defineModel<string>({ default: '' })

const iconFor = (slug: string) => CATEGORY_ICONS[slug] ?? CATEGORY_FALLBACK_ICON

/** Sum across all categories, shown on the "Toutes" tile. */
const totalCount = computed(() =>
  props.categories.reduce((total, category) => total + (category.eventsCount ?? 0), 0),
)

const track = ref<HTMLElement | null>(null)

const canScrollLeft = ref(false)
const canScrollRight = ref(false)

/**
 * Recomputed on scroll, on resize and whenever the list length changes.
 *
 * The overflow is measured directly rather than through VueUse's
 * `arrivedState`, which starts out reporting "arrived" on an element that has
 * not been scrolled yet — the arrows would never appear on first paint.
 */
function measure(): void {
  const element = track.value

  if (!element) {
    canScrollLeft.value = false
    canScrollRight.value = false

    return
  }

  const max = element.scrollWidth - element.clientWidth

  canScrollLeft.value = element.scrollLeft > 1
  canScrollRight.value = max > 1 && element.scrollLeft < max - 1
}

useResizeObserver(track, measure)
watch(
  () => props.categories.length,
  () => void nextTick(measure),
)
onMounted(() => void nextTick(measure))

/** Scrolls by roughly two tiles, so the row never jumps past a whole screen. */
function scrollBy(direction: -1 | 1): void {
  track.value?.scrollBy({ left: direction * 240, behavior: 'smooth' })
}
</script>

<template>
  <div class="tiles-wrapper">
    <Transition name="arrow">
      <button
        v-if="canScrollLeft"
        class="arrow arrow--prev"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        @click="scrollBy(-1)"
      >
        <BaseIcon name="chevron_left" :size="22" />
      </button>
    </Transition>

    <div
      ref="track"
      class="tiles hide-scrollbar"
      role="group"
      aria-label="Filtrer par catégorie"
      @scroll="measure"
    >
      <button
        class="tile"
        :class="{ 'tile--active': model === '' }"
        type="button"
        :aria-pressed="model === ''"
        @click="model = ''"
      >
        <BaseIcon class="tile__icon" name="grid_view" :size="28" />
        <span class="tile__label">Toutes</span>
        <span class="tile__count">{{ totalCount }} événements</span>
      </button>

      <button
        v-for="category in categories"
        :key="category.id"
        class="tile"
        :class="{ 'tile--active': model === category.slug }"
        type="button"
        :aria-pressed="model === category.slug"
        @click="model = category.slug"
      >
        <BaseIcon class="tile__icon" :name="iconFor(category.slug)" :size="28" />
        <span class="tile__label">{{ category.name }}</span>
        <span v-if="category.eventsCount !== undefined" class="tile__count">
          {{ category.eventsCount }} {{ category.eventsCount > 1 ? 'événements' : 'événement' }}
        </span>
      </button>
    </div>

    <Transition name="arrow">
      <button
        v-if="canScrollRight"
        class="arrow arrow--next"
        type="button"
        tabindex="-1"
        aria-hidden="true"
        @click="scrollBy(1)"
      >
        <BaseIcon name="chevron_right" :size="22" />
      </button>
    </Transition>
  </div>
</template>

<style scoped>
.tiles-wrapper {
  position: relative;
}

.tiles {
  display: flex;
  gap: var(--space-4);
  padding-block-end: var(--space-2);
  overflow-x: auto;

  /* No scroll-snap: it would clamp every scroll back to a tile boundary, so an
     intermediate position — where both arrows are relevant — never survives. */
}

.tile {
  display: flex;
  flex: 0 0 7.5rem;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  height: 7.5rem;
  padding-inline: var(--space-2);
  color: var(--color-secondary);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.tile:hover {
  color: var(--color-primary);
  border-color: var(--color-primary-container);
  box-shadow: var(--shadow-md);
}

.tile--active {
  color: var(--color-primary);

  /* The mockup tints the active tile with 10 % of the bright red. */
  background-color: color-mix(in srgb, var(--color-primary-container) 10%, transparent);
  border-width: 2px;
  border-color: var(--color-primary-container);
}

.tile__label {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.tile__count {
  color: var(--color-secondary);
  font-size: 10px;
  line-height: 1.2;
  text-align: center;
}

.tile--active .tile__count {
  color: var(--color-primary);
}

/* --- Arrows --- */
.arrow {
  position: absolute;
  top: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-md);
  transform: translateY(-50%);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.arrow:hover {
  background-color: var(--color-surface-container-low);
}

.arrow:active {
  transform: translateY(-50%) scale(0.9);
}

.arrow--prev {
  left: calc(var(--space-2) * -1);
}

.arrow--next {
  right: calc(var(--space-2) * -1);
}

.arrow-enter-active,
.arrow-leave-active {
  transition: opacity var(--transition-fast);
}

.arrow-enter-from,
.arrow-leave-to {
  opacity: 0;
}
</style>
