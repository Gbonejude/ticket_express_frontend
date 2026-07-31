<script setup lang="ts">
import { RouterView } from 'vue-router'

/** Bare layout with no chrome: error pages, payment redirects, print views. */
</script>

<template>
  <div class="blank-layout">
    <RouterView />
  </div>
</template>

<style scoped>
.blank-layout {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-4);
}
</style>
