<script setup lang="ts">
import { RouterLink } from 'vue-router'

import { APP_CONFIG } from '@/constants/app'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Site header: branding, primary navigation, session actions.
 * Structural shell only — the visual design comes later with the pages.
 */
const auth = useAuthStore()
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink :to="{ name: 'home' }" class="header__brand">
        {{ APP_CONFIG.name }}
      </RouterLink>

      <nav class="header__nav" aria-label="Navigation principale">
        <RouterLink :to="{ name: 'home' }">Accueil</RouterLink>
        <RouterLink :to="{ name: 'events' }">Événements</RouterLink>
      </nav>

      <div class="header__actions">
        <template v-if="auth.isAuthenticated">
          <RouterLink :to="{ name: 'orders' }">Mes commandes</RouterLink>
          <RouterLink :to="{ name: 'account' }">{{ auth.displayName || 'Mon compte' }}</RouterLink>
        </template>
        <template v-else>
          <RouterLink :to="{ name: 'login' }">Connexion</RouterLink>
          <RouterLink :to="{ name: 'register' }">Créer un compte</RouterLink>
        </template>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--color-background);
  border-block-end: 1px solid var(--color-border);
}

.header__inner {
  display: flex;
  gap: var(--space-6);
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
}

.header__brand {
  color: var(--color-heading);
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.header__nav,
.header__actions {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.header__nav a,
.header__actions a {
  color: var(--color-text);
  font-size: var(--font-size-sm);
}

.header__nav a.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
}

@media (width <= 768px) {
  .header__nav {
    display: none;
  }
}
</style>
