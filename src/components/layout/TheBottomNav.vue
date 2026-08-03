<script setup lang="ts">
import { RouterLink, useRouter, type RouteLocationRaw } from 'vue-router'

import { BaseIcon } from '@/components/ui'
import { BOTTOM_NAV } from '@/constants/navigation'
import { useAuthStore } from '@/stores/auth.store'

/**
 * Bottom tab bar — the primary navigation on mobile, hidden from `md` up where
 * the header takes over.
 *
 * "Billets" sits behind the auth guard but keeps its real name for everyone:
 * the tab says what the visitor is going to see. A signed-out tap lands on the
 * sign-in page with the destination remembered, so signing in continues to the
 * tab they asked for instead of dropping them on the home page.
 */
const auth = useAuthStore()
const router = useRouter()

/** Routes that only exist for a signed-in visitor. */
const GUARDED = new Set(['tickets'])

const destinationOf = (route: string): RouteLocationRaw =>
  !auth.isAuthenticated && GUARDED.has(route)
    ? { name: 'login', query: { redirect: router.resolve({ name: route }).fullPath } }
    : { name: route }
</script>

<template>
  <nav class="bottom-nav" aria-label="Navigation principale">
    <RouterLink
      v-for="item in BOTTOM_NAV"
      :key="item.route"
      class="bottom-nav__item"
      :to="destinationOf(item.route)"
      :active-class="
        item.route === 'home' ? 'bottom-nav__item--prefix' : 'bottom-nav__item--active'
      "
      exact-active-class="bottom-nav__item--active"
    >
      <BaseIcon :name="item.icon" :size="24" />
      <span class="bottom-nav__label">{{ item.label }}</span>
    </RouterLink>
  </nav>
</template>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  z-index: var(--z-tabbar);
  display: flex;
  justify-content: space-around;
  width: 100%;
  height: var(--tabbar-height);
  padding-inline: var(--space-4);

  /* Clears the iOS home indicator without pushing content on other devices. */
  padding-block-end: env(safe-area-inset-bottom);
  background-color: var(--color-surface);
  border-block-start: 1px solid var(--color-surface-variant);
  box-shadow: 0 -1px 3px rgb(25 28 29 / 5%);
}

.bottom-nav__item {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  color: var(--color-secondary);
  transition: color var(--transition-fast);
}

.bottom-nav__item:hover {
  color: var(--color-primary);
}

.bottom-nav__item--active {
  color: var(--color-primary);
}

.bottom-nav__label {
  font-size: 11px;
  font-weight: 600;
}

@media (width >= 768px) {
  .bottom-nav {
    display: none;
  }
}
</style>
