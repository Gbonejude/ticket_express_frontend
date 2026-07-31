<script setup lang="ts">
/**
 * Temporary placeholder for a route whose page is not built yet.
 *
 * It exists so the routing, layouts and guards can be exercised end to end
 * during the setup phase. Delete it once every page has real content.
 */
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="container placeholder">
    <h1>{{ title }}</h1>
    <p v-if="description">{{ description }}</p>
    <p class="placeholder__note">Cette page sera développée lors de la phase fonctionnelle.</p>
  </section>
</template>

<style scoped>
.placeholder {
  padding-block: var(--space-16);
}

.placeholder h1 {
  margin-block-end: var(--space-4);
  font-size: var(--font-size-2xl);
}

.placeholder__note {
  margin-block-start: var(--space-4);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
</style>
