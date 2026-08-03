<script setup lang="ts">
import { onMounted } from 'vue'

import { BaseButton, BaseIcon } from '@/components/ui'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Sign-out confirmation — Stitch screen « Déconnexion (Style Tikerama) ».
 *
 * The page performs the sign-out itself rather than assuming the caller did.
 * That makes `/deconnexion` a valid destination from anywhere — a link, a
 * bookmark, a redirect — and keeps the session from surviving a direct visit.
 */
const auth = useAuthStore()

onMounted(() => {
  if (auth.isAuthenticated) void auth.logout()
})
</script>

<template>
  <div class="logout">
    <div class="logout__inner">
      <div class="logout__badge">
        <span class="logout__circle">
          <BaseIcon name="check_circle" :size="48" />
        </span>
        <span class="logout__glow" aria-hidden="true" />
      </div>

      <div class="logout__message">
        <h1 class="t-headline-lg">À bientôt !</h1>
        <p class="logout__lead t-body-lg">Vous avez été déconnecté avec succès.</p>
      </div>

      <div class="logout__actions">
        <BaseButton block size="lg" :to="{ name: 'home' }" icon-end="chevron_right">
          Retour à l'accueil
        </BaseButton>
        <RouterLink class="logout__relogin" :to="{ name: 'login' }">Se reconnecter</RouterLink>
      </div>

      <!-- Decorative grid from the mockup; purely atmospheric. -->
      <div class="logout__decor" aria-hidden="true">
        <span class="logout__tile" />
        <span class="logout__tile logout__tile--round logout__tile--muted" />
        <span class="logout__tile logout__tile--round" />
        <span class="logout__tile logout__tile--muted" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.logout {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: var(--space-12) var(--space-gutter);
}

.logout__inner {
  width: 100%;
  max-width: 28rem;
  text-align: center;
}

.logout__badge {
  position: relative;
  display: flex;
  justify-content: center;
  margin-block-end: var(--space-8);
}

.logout__circle {
  display: grid;
  place-items: center;
  width: 6rem;
  height: 6rem;
  color: var(--color-primary);
  background-color: var(--color-surface-container-high);
  border-radius: var(--radius-full);
}

.logout__glow {
  position: absolute;
  top: -1rem;
  right: calc(50% - 4rem);
  width: 3rem;
  height: 3rem;
  background-color: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-radius: var(--radius-full);
  filter: blur(16px);
  animation: pulse 2.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.logout__message {
  margin-block-end: var(--space-10);
}

.logout__lead {
  margin-block-start: var(--space-2);
  color: var(--color-secondary);
}

.logout__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-stack-md);
}

.logout__relogin {
  color: var(--color-secondary);
  font-size: var(--text-body-md);
  text-decoration: underline;
}

.logout__relogin:hover {
  color: var(--color-primary);
}

.logout__decor {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  max-width: 12.5rem;
  margin-inline: auto;
  margin-block-start: var(--space-16);
  opacity: 0.1;
}

.logout__tile {
  aspect-ratio: 1;
  background-color: var(--color-primary-container);
  border-radius: var(--radius-sm);
}

.logout__tile--round {
  border-radius: var(--radius-full);
}

.logout__tile--muted {
  background-color: var(--color-secondary);
}
</style>
