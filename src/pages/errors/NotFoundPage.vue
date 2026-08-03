<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <section class="not-found">
    <p class="not-found__code">404</p>
    <h1>Page introuvable</h1>
    <p class="not-found__text">La page que vous cherchez n’existe pas.</p>

    <RouterLink :to="{ name: 'home' }" class="not-found__link"> Retour à l’accueil </RouterLink>
  </section>
</template>

<style scoped>
.not-found {
  max-width: 480px;
  text-align: center;
}

.not-found__code {
  color: var(--color-primary);
  font-weight: 700;
  font-size: 4rem;
  line-height: 1;
}

.not-found h1 {
  margin-block: var(--space-4) var(--space-2);
  font-size: var(--font-size-xl);
}

.not-found__text {
  color: var(--color-text-muted);
}

.not-found__link {
  display: inline-block;
  margin-block-start: var(--space-6);
  padding: var(--space-3) var(--space-6);
  color: #fff;
  background-color: var(--color-primary);
  border-radius: var(--radius-md);
}

.not-found__link:hover {
  color: #fff;
  background-color: var(--color-primary-hover);
}
</style>
