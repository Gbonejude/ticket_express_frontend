<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { APP_CONFIG } from '@/constants/app'

/**
 * Layout for login and signup: no site navigation, so nothing competes with
 * the form for the visitor's attention.
 */
</script>

<template>
  <div class="auth-layout">
    <div class="auth-layout__card">
      <RouterLink :to="{ name: 'home' }" class="auth-layout__brand">
        {{ APP_CONFIG.name }}
      </RouterLink>

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: var(--space-4);
  background-color: var(--color-surface);
}

.auth-layout__card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-8);
  background-color: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.auth-layout__brand {
  display: block;
  margin-block-end: var(--space-6);
  color: var(--color-heading);
  font-weight: 700;
  font-size: var(--font-size-lg);
  text-align: center;
}
</style>
