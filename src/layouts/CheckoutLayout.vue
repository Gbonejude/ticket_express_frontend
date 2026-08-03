<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'

import { BaseIcon } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'

/**
 * Layout of the payment funnel.
 *
 * Deliberately stripped of navigation: once a visitor is paying, every link out
 * is a way to lose the order. Only the brand — back to the home page — and the
 * security reassurance remain.
 */
</script>

<template>
  <div class="checkout-layout">
    <header class="checkout-layout__header">
      <div class="container checkout-layout__inner">
        <div class="checkout-layout__start">
          <button
            class="checkout-layout__back"
            type="button"
            aria-label="Revenir à l'étape précédente"
            @click="$router.back()"
          >
            <BaseIcon name="arrow_back" :size="24" />
          </button>

          <RouterLink :to="{ name: 'home' }" class="checkout-layout__brand">
            {{ APP_CONFIG.name }}
          </RouterLink>
        </div>

        <p class="checkout-layout__secure t-label">
          <BaseIcon name="lock" :size="18" />
          Paiement sécurisé
        </p>
      </div>
    </header>

    <main id="main-content" tabindex="-1" class="checkout-layout__main">
      <RouterView />
    </main>

    <footer class="checkout-layout__footer">
      <div class="container checkout-layout__footer-inner t-label">
        <span>© {{ new Date().getFullYear() }} TicketExpress</span>
        <a href="#aide">Aide</a>
        <a href="#cgu">Mentions légales</a>
        <a href="#contact">Contact</a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.checkout-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-background);
}

.checkout-layout__header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background-color: var(--color-surface);
  border-block-end: 1px solid var(--color-outline-variant);
}

.checkout-layout__inner {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  min-height: var(--header-height);
}

.checkout-layout__start {
  display: flex;
  gap: var(--space-4);
  align-items: center;
}

.checkout-layout__back {
  display: grid;
  place-items: center;
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.checkout-layout__back:hover {
  background-color: var(--color-surface-variant);
}

.checkout-layout__brand {
  color: var(--color-primary);
  font-size: var(--text-headline-lg);
  font-weight: 700;
  letter-spacing: var(--tracking-headline);
}

.checkout-layout__secure {
  display: flex;
  gap: var(--space-2);
  align-items: center;
  color: var(--color-on-surface-variant);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.checkout-layout__main {
  flex: 1;
  padding-block: var(--space-10) var(--space-16);
}

.checkout-layout__footer {
  border-block-start: 1px solid var(--color-outline-variant);
}

.checkout-layout__footer-inner {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
  justify-content: center;
  padding-block: var(--space-8);
  color: var(--color-on-surface-variant);
  text-transform: uppercase;
}

.checkout-layout__footer-inner a {
  color: inherit;
}

.checkout-layout__footer-inner a:hover {
  color: var(--color-primary);
}
</style>
