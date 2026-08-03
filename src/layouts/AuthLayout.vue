<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { BaseIcon } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'

/**
 * Layout for sign-in and sign-up.
 *
 * No site navigation: nothing should compete with the form. Only the brand —
 * which doubles as the way back to the home page — and the legal links remain.
 */
const year = new Date().getFullYear()
</script>

<template>
  <div class="auth">
    <header class="auth__header">
      <RouterLink class="auth__brand" :to="{ name: 'home' }">
        <BaseIcon name="confirmation_number" :size="30" />
        <span>{{ APP_CONFIG.name }}</span>
      </RouterLink>
    </header>

    <main id="main-content" tabindex="-1" class="auth__main">
      <RouterView />
    </main>

    <footer class="auth__footer">
      <p>© {{ year }} {{ APP_CONFIG.name }}. Tous droits réservés.</p>
    </footer>
  </div>
</template>

<style scoped>
.auth {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.auth__header {
  display: flex;
  justify-content: center;
  padding: var(--space-stack-md) var(--space-gutter);
  background-color: var(--color-surface-container-lowest);
  border-block-end: 1px solid var(--color-secondary-container);
}

.auth__brand {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-primary-container);
  font-size: var(--text-headline-xl);
  font-weight: 700;
  letter-spacing: var(--tracking-headline);
}

.auth__brand :deep(svg) {
  color: var(--color-primary);
}

.auth__main {
  display: flex;
  flex: 1;
}

.auth__footer {
  padding-block: var(--space-6);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  text-align: center;
}
</style>
