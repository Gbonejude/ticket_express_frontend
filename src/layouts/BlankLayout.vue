<script setup lang="ts">
import { RouterView } from 'vue-router'

/**
 * Bare layout with no chrome: error pages, payment redirects, print views.
 *
 * It still carries the `main` landmark — the skip link in `App.vue` targets
 * `#main-content`, and without it an error page has no landmark at all.
 */
</script>

<template>
  <main id="main-content" tabindex="-1" class="blank-layout">
    <RouterView />
  </main>
</template>

<style scoped>
.blank-layout {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-4);
}
</style>
