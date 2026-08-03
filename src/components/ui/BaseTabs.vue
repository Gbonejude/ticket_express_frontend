<script setup lang="ts">
import { computed, ref } from 'vue'

import type { TabItem } from './types'

/**
 * Tab bar following the WAI-ARIA tabs pattern: arrow keys move between tabs,
 * Home/End jump to the ends, and only the active tab is in the tab order.
 *
 * It renders the tab list only. The caller renders the panels and links each
 * one with `:id` / `aria-labelledby` — that keeps the component reusable for
 * panels that are pages, not just blocks.
 */
const props = defineProps<{
  tabs: TabItem[]
  /** Unique per tab bar; used to build the tab and panel ids. */
  idPrefix: string
}>()

const model = defineModel<string>({ required: true })

const buttons = ref<HTMLButtonElement[]>([])

const activeIndex = computed(() => props.tabs.findIndex((tab) => tab.value === model.value))

function focusTab(index: number): void {
  const bounded = (index + props.tabs.length) % props.tabs.length
  const tab = props.tabs[bounded]

  if (!tab) return

  model.value = tab.value
  buttons.value[bounded]?.focus()
}

function onKeydown(event: KeyboardEvent): void {
  const moves: Record<string, number> = {
    ArrowRight: activeIndex.value + 1,
    ArrowLeft: activeIndex.value - 1,
    Home: 0,
    End: props.tabs.length - 1,
  }

  const next = moves[event.key]

  if (next === undefined) return

  event.preventDefault()
  focusTab(next)
}
</script>

<template>
  <div class="tabs" role="tablist" @keydown="onKeydown">
    <button
      v-for="(tab, index) in tabs"
      :id="`${idPrefix}-tab-${tab.value}`"
      :key="tab.value"
      :ref="
        (element) => {
          if (element) buttons[index] = element as HTMLButtonElement
        }
      "
      class="tabs__tab"
      :class="{ 'tabs__tab--active': tab.value === model }"
      type="button"
      role="tab"
      :aria-controls="`${idPrefix}-panel-${tab.value}`"
      :aria-selected="tab.value === model"
      :tabindex="tab.value === model ? 0 : -1"
      @click="model = tab.value"
    >
      {{ tab.label }}
      <span v-if="tab.count !== undefined" class="tabs__count">{{ tab.count }}</span>
    </button>
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  border-block-end: 1px solid var(--color-outline-variant);
  scrollbar-width: none;
}

.tabs::-webkit-scrollbar {
  display: none;
}

.tabs__tab {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  padding: var(--space-3) var(--space-4);
  color: var(--color-on-surface-variant);
  font-family: var(--font-sans);
  font-size: var(--text-body-sm);
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
  border-block-end: 2px solid transparent;
  margin-block-end: -1px;
  transition:
    color var(--transition-fast),
    border-color var(--transition-fast);
}

.tabs__tab:hover {
  color: var(--color-primary);
}

.tabs__tab--active {
  color: var(--color-primary);
  border-block-end-color: var(--color-primary);
}

.tabs__count {
  padding: 0.125rem var(--space-2);
  color: var(--color-on-surface-variant);
  background-color: var(--color-surface-container);
  border-radius: var(--radius-full);
}

.tabs__tab--active .tabs__count {
  color: var(--color-on-primary);
  background-color: var(--color-primary);
}
</style>
