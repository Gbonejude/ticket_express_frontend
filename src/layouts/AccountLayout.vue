<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

import LogoutConfirm from '@/components/layout/LogoutConfirm.vue'
import { BaseAvatar, BaseDrawer, BaseIcon } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'
import { ACCOUNT_NAV, HEADER_NAV } from '@/constants/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useSearchStore } from '@/stores/search.store'

/**
 * Shell of the signed-in area — the sidebar, top bar and dark footer shared by
 * « Tableau de bord », « Mes Favoris » and « Historique des achats ».
 *
 * The sidebar is fixed from `md` up, as the mockups draw it. Below that it
 * moves into a drawer: the mockups simply hide it, which would leave a phone
 * visitor with no way between the four sections.
 */
const auth = useAuthStore()
const searchStore = useSearchStore()
const route = useRoute()
const router = useRouter()

const isNavOpen = ref(false)
const isLogoutConfirmOpen = ref(false)

/**
 * "Accueil" is `/`, a prefix of every path, so `router-link-active` would mark
 * it active everywhere. Only that link is matched exactly.
 */
const NEVER = 'topbar__link--prefix'
const search = ref('')

watch(
  () => route.fullPath,
  () => {
    isNavOpen.value = false
  },
)

/**
 * Hands the term to the search store, then goes to the explore page.
 *
 * The term used to travel as `?recherche=…`; it now goes through the store like
 * every other search on the site, so the explore page reads it from one place
 * and the address bar stays `/evenements`.
 */
function submitSearch(): void {
  searchStore.set(search.value.trim())
  void router.push({ name: 'events' })
}

const year = new Date().getFullYear()
</script>

<template>
  <div class="account">
    <!-- Sidebar -->
    <nav class="sidebar" aria-label="Navigation du compte">
      <RouterLink :to="{ name: 'home' }" class="sidebar__brand">{{ APP_CONFIG.name }}</RouterLink>

      <div class="sidebar__identity">
        <BaseAvatar :src="auth.user?.image" :name="auth.displayName" :size="40" />
        <div>
          <p class="sidebar__account">Mon compte</p>
          <p class="sidebar__hint">Gérer mes achats</p>
        </div>
      </div>

      <div class="sidebar__links">
        <RouterLink
          v-for="item in ACCOUNT_NAV"
          :key="item.route"
          class="sidebar__link"
          :to="{ name: item.route }"
        >
          <BaseIcon :name="item.icon" :size="24" />
          <span>{{ item.label }}</span>
        </RouterLink>
      </div>

      <button class="sidebar__logout" type="button" @click="isLogoutConfirmOpen = true">
        <BaseIcon name="logout" :size="24" />
        <span>Déconnexion</span>
      </button>
    </nav>

    <!-- Main column -->
    <div class="main">
      <header class="topbar">
        <div class="topbar__inner">
          <div class="topbar__start">
            <button
              class="topbar__burger"
              type="button"
              aria-label="Ouvrir la navigation du compte"
              :aria-expanded="isNavOpen"
              @click="isNavOpen = true"
            >
              <BaseIcon name="menu" :size="24" />
            </button>

            <RouterLink :to="{ name: 'home' }" class="topbar__brand">
              {{ APP_CONFIG.name }}
            </RouterLink>

            <nav class="topbar__nav" aria-label="Navigation du site">
              <RouterLink
                v-for="item in HEADER_NAV"
                :key="item.route"
                class="topbar__link"
                :to="{ name: item.route }"
                :active-class="item.route === 'home' ? NEVER : 'topbar__link--active'"
                exact-active-class="topbar__link--active"
              >
                {{ item.label }}
              </RouterLink>
            </nav>
          </div>

          <form class="topbar__search" role="search" @submit.prevent="submitSearch">
            <label class="visually-hidden" for="account-search">Rechercher un événement</label>
            <input
              id="account-search"
              v-model="search"
              type="search"
              placeholder="Rechercher un événement…"
            />
            <button type="submit" aria-label="Lancer la recherche">
              <BaseIcon name="search" :size="20" />
            </button>
          </form>

          <div class="topbar__end">
            <RouterLink class="topbar__bell" :to="{ name: 'tickets' }" aria-label="Notifications">
              <BaseIcon name="notifications" :size="22" />
              <span class="topbar__dot" aria-hidden="true" />
            </RouterLink>

            <span class="topbar__divider" aria-hidden="true" />

            <BaseAvatar :src="auth.user?.image" :name="auth.displayName" :size="36" />
          </div>
        </div>
      </header>

      <main id="main-content" tabindex="-1" class="content">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>

      <footer class="footer">
        <div class="footer__inner">
          <div>
            <p class="footer__brand">{{ APP_CONFIG.name }}</p>
            <p class="footer__legal">© {{ year }} {{ APP_CONFIG.name }}. Tous droits réservés.</p>
          </div>
        </div>
      </footer>
    </div>

    <BaseDrawer v-model:open="isNavOpen" title="Mon espace">
      <div class="sidebar__links">
        <RouterLink
          v-for="item in ACCOUNT_NAV"
          :key="item.route"
          class="sidebar__link"
          :to="{ name: item.route }"
        >
          <BaseIcon :name="item.icon" :size="24" />
          <span>{{ item.label }}</span>
        </RouterLink>

        <button class="sidebar__logout" type="button" @click="isLogoutConfirmOpen = true">
          <BaseIcon name="logout" :size="24" />
          <span>Déconnexion</span>
        </button>
      </div>
    </BaseDrawer>

    <LogoutConfirm v-model:open="isLogoutConfirmOpen" />
  </div>
</template>

<style scoped>
.account {
  min-height: 100vh;
  background-color: var(--color-background);
}

/* --- Sidebar --- */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  z-index: var(--z-header);
  display: none;
  flex-direction: column;
  width: 16rem;
  height: 100%;
  padding: var(--space-stack-md);
  background-color: var(--color-surface-bright);
  box-shadow: var(--shadow-sm);
}

.sidebar__brand {
  display: block;
  padding-inline: var(--space-component-padding);
  margin-block-end: var(--space-8);
  color: var(--color-primary);
  font-size: var(--text-headline-md);
  font-weight: 700;
}

.sidebar__identity {
  display: flex;
  gap: var(--space-stack-md);
  align-items: center;
  padding-inline: var(--space-component-padding);
  margin-block-end: var(--space-8);
}

.sidebar__account {
  font-size: var(--text-label-bold);
  font-weight: 700;
}

.sidebar__hint {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
}

.sidebar__links {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--space-2);
}

.sidebar__link {
  display: flex;
  gap: var(--space-stack-md);
  align-items: center;
  padding: var(--space-component-padding);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
  border-radius: var(--radius-md);
  transition:
    color var(--transition-base),
    background-color var(--transition-base);
}

.sidebar__link:hover {
  color: var(--color-on-surface);
}

/* The current section is marked on the text alone — no filled pill, no hover
   wash. `exact-active` matters: /mon-espace prefixes every child route, so the
   plain active class would light the dashboard up on all four pages. */
.sidebar__link.router-link-exact-active {
  color: var(--color-primary);
  font-weight: 700;
}

.sidebar__logout {
  display: flex;
  gap: var(--space-stack-md);
  align-items: center;
  padding: var(--space-component-padding);
  margin-block-start: auto;
  color: var(--color-primary);
  font-size: var(--text-label-bold);
  font-weight: 700;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
}

.sidebar__logout:hover {
  color: var(--color-on-surface);
}

/* --- Main --- */
.main {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  height: 5rem;
  background-color: var(--color-surface-container-lowest);
  border-block-end: 1px solid var(--color-secondary-container);
}

.topbar__inner {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: var(--container-max);
  height: 100%;
  margin-inline: auto;
  padding-inline: var(--space-gutter);
}

/* The generous gap is for the desktop nav that sits beside the brand; on a
   phone there is no nav and it was pushing the brand into the avatar. */
.topbar__start {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  min-width: 0;
}

.topbar__burger {
  display: flex;
  color: var(--color-primary);
}

/* Fluid size and `min-width: 0`: a flex item will not shrink past its content
   without it, and the brand was overflowing the bar by 43 px at 320 px. */
.topbar__brand {
  min-width: 0;
  overflow: hidden;
  color: var(--color-primary);
  font-size: clamp(1rem, 4.6vw, var(--text-headline-lg));
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.topbar__nav {
  display: none;
  gap: var(--space-6);
}

.topbar__link {
  color: var(--color-secondary);
  font-size: var(--text-body-md);
}

.topbar__link:hover,
.topbar__link--active {
  color: var(--color-primary);
}

.topbar__search {
  position: relative;
  display: none;
  flex: 1;
  max-width: 28rem;
  margin-inline: var(--space-8);
}

.topbar__search input {
  width: 100%;
  padding: 0.625rem var(--space-12) 0.625rem var(--space-4);
  background-color: var(--color-surface-container-low);
  border: none;
  border-radius: var(--radius-full);
}

.topbar__search input:focus {
  outline: 2px solid var(--color-focus);
}

.topbar__search button {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  bottom: 0.25rem;
  display: flex;
  align-items: center;
  padding-inline: var(--space-4);
  color: #fff;
  background-color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.topbar__search button:hover {
  background-color: var(--color-primary-container);
}

.topbar__end {
  flex-shrink: 0;
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.topbar__bell {
  position: relative;
  display: flex;
  padding: var(--space-2);
  color: var(--color-secondary);
  border-radius: var(--radius-full);
}

.topbar__bell:hover {
  color: var(--color-primary);
  background-color: var(--color-surface-container);
}

.topbar__dot {
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  width: 0.5rem;
  height: 0.5rem;
  background-color: var(--color-primary);
  border: 2px solid var(--color-surface-container-lowest);
  border-radius: var(--radius-full);
}

.topbar__divider {
  width: 1px;
  height: 2rem;
  margin-inline: var(--space-2);
  background-color: var(--color-outline-variant);
}

/**
 * The account area runs at a smaller scale than the public site.
 *
 * The public type ramp is drawn for full-width marketing pages; here the same
 * sizes sit in a column narrowed by a 16 rem sidebar, next to tables and stat
 * cards, and read as oversized. Overriding the tokens on this container is
 * enough — every `.t-headline-*` class already resolves through them, so no
 * page needs its own font sizes.
 */
.content {
  --text-headline-xl: 26px;
  --text-headline-lg: 20px;
  --text-headline-md: 16px;
  --text-body-lg: 15px;

  flex: 1;
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding: var(--space-8) var(--space-gutter);
}

@media (width >= 1024px) {
  .content {
    --text-headline-xl: 30px;
    --text-headline-lg: 22px;
  }
}

/* --- Footer --- */
.footer {
  background-color: #4a4d50;
}

/* The legal links are gone, so the brand and the copyright are the whole
     footer: centred rather than pinned left against an empty half. */
.footer__inner {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
  width: 100%;
  text-align: center;
  max-width: var(--container-max);
  margin-inline: auto;
  padding: var(--space-8) var(--space-gutter);
}

.footer__brand {
  color: #fff;
  font-size: var(--text-headline-md);
  font-weight: 700;
}

.footer__legal {
  margin-block-start: var(--space-1);
  color: rgb(255 255 255 / 70%);
  font-size: var(--text-body-sm);
}

@media (width >= 768px) {
  .sidebar {
    display: flex;
  }

  .topbar__start {
    gap: var(--space-8);
  }

  .main {
    margin-inline-start: 16rem;
  }

  .topbar__burger,
  .topbar__brand {
    display: none;
  }

  .topbar__search {
    display: block;
  }
}

@media (width >= 1024px) {
  .topbar__nav {
    display: flex;
  }
}
</style>
