<script setup lang="ts">
/**
 * The section header used all over the site: a small uppercase eyebrow, a
 * headline, and an optional action on the right ("Voir tout →").
 *
 * `level` exists so a page can keep a correct heading outline — the home page
 * uses `h2` under its `h1`, while a panel inside a page may need `h3`.
 */
withDefaults(
  defineProps<{
    eyebrow?: string
    title: string
    description?: string
    level?: 'h2' | 'h3'
  }>(),
  { eyebrow: undefined, description: undefined, level: 'h2' },
)
</script>

<template>
  <div class="section-heading">
    <div>
      <span v-if="eyebrow" class="section-heading__eyebrow t-label">{{ eyebrow }}</span>
      <component :is="level" class="section-heading__title t-headline-lg">{{ title }}</component>
      <p v-if="description" class="section-heading__description">{{ description }}</p>
    </div>

    <div v-if="$slots.action" class="section-heading__action"><slot name="action" /></div>
  </div>
</template>

<style scoped>
.section-heading {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-4);
  align-items: flex-end;
  justify-content: space-between;
  margin-block-end: var(--space-10);
}

.section-heading__eyebrow {
  display: block;
  margin-block-end: var(--space-2);
  color: var(--color-primary);
  text-transform: uppercase;
}

.section-heading__title {
  color: var(--color-on-surface);
}

.section-heading__description {
  margin-block-start: var(--space-2);
  color: var(--color-on-surface-variant);
}

.section-heading__action {
  margin-inline-start: auto;
}
</style>
