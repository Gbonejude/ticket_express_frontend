<script setup lang="ts">
/**
 * Grey placeholder shown while data loads.
 *
 * A skeleton shaped like the content it replaces is used rather than a spinner,
 * so the layout does not jump when the data arrives. The pulse is dropped under
 * `prefers-reduced-motion` by the global rule in base.css.
 */
withDefaults(
  defineProps<{
    /** Any CSS length; `text` and `title` presets set a sensible height. */
    width?: string
    height?: string
    variant?: 'text' | 'title' | 'block' | 'circle'
    /** Number of stacked lines; only meaningful for `text`. */
    lines?: number
  }>(),
  { width: '100%', height: undefined, variant: 'text', lines: 1 },
)
</script>

<template>
  <div v-if="lines > 1" class="skeleton-group" aria-hidden="true">
    <span
      v-for="line in lines"
      :key="line"
      class="skeleton"
      :class="`skeleton--${variant}`"
      :style="{ width: line === lines ? '70%' : width, height }"
    />
  </div>

  <span
    v-else
    class="skeleton"
    :class="`skeleton--${variant}`"
    :style="{ width, height }"
    aria-hidden="true"
  />
</template>

<style scoped>
.skeleton-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.skeleton {
  display: block;
  background-color: var(--color-surface-container);
  border-radius: var(--radius-sm);
  animation: pulse 1.6s ease-in-out infinite;
}

.skeleton--text {
  height: 0.875rem;
}

.skeleton--title {
  height: 1.5rem;
}

.skeleton--block {
  height: 100%;
  border-radius: var(--radius-md);
}

.skeleton--circle {
  aspect-ratio: 1;
  border-radius: var(--radius-full);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
