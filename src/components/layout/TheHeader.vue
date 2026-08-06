<script setup lang="ts">
import { onClickOutside, useDebounceFn } from '@vueuse/core'
import { ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'

import LogoutConfirm from '@/components/layout/LogoutConfirm.vue'
import { BaseAvatar, BaseButton, BaseDrawer, BaseIcon } from '@/components/ui'
import { APP_CONFIG } from '@/constants/app'
import { SEARCH_DEBOUNCE_MS } from '@/constants/app'
import { ACCOUNT_NAV, HEADER_NAV } from '@/constants/navigation'
import { useAuthStore } from '@/stores/auth.store'
import { useSearchStore } from '@/stores/search.store'
import { useUiStore } from '@/stores/ui.store'

/**
 * Top app bar: menu, brand, search, session actions.
 *
 * The mockup is drawn for a phone and only hints at the desktop bar; the search
 * field and the primary links appear from `md` up, which is the extrapolation
 * agreed for wide screens. Below that the row stays as drawn — burger, brand,
 * search icon, account — and the bottom tab bar carries the navigation.
 */
const auth = useAuthStore()
const ui = useUiStore()
const searchStore = useSearchStore()
const route = useRoute()
const router = useRouter()

const search = ref('')
const isMenuOpen = ref(false)
const isSearchOpen = ref(false)
const menu = ref<HTMLElement | null>(null)

onClickOutside(menu, () => {
  isMenuOpen.value = false
})

// A navigation must never leave a menu or drawer hanging open behind it.
watch(
  () => route.fullPath,
  () => {
    isMenuOpen.value = false
    isSearchOpen.value = false
    ui.toggleMobileMenu(false)
  },
)

/**
 * Search as you type, and stay where you are when the page can already answer.
 *
 * The term goes into a store rather than the URL, so the home page and the
 * explore page both react to it without either having to navigate. Typing on a
 * page that shows events therefore filters it in place — leaving the home page,
 * where the visitor is already looking at events, to go and ask the same
 * question elsewhere made no sense.
 *
 * From anywhere else — contact, à propos, a ticket — there is nothing to
 * filter, so the search hands over to the explore page.
 */
const PAGES_THAT_LIST_EVENTS = ['home', 'events']

const applySearch = useDebounceFn(() => {
  searchStore.set(search.value.trim())

  if (!PAGES_THAT_LIST_EVENTS.includes(String(route.name))) {
    void router.push({ name: 'events' })
  }
}, SEARCH_DEBOUNCE_MS)

/** Enter skips the debounce; nothing is submitted, the term is already live. */
function submitSearch(): void {
  searchStore.set(search.value.trim())

  if (!PAGES_THAT_LIST_EVENTS.includes(String(route.name))) {
    void router.push({ name: 'events' })
  }
}

/** Opened by the account menu; the dialog is what routes to `/deconnexion`. */
const isLogoutConfirmOpen = ref(false)

function askSignOut(): void {
  isMenuOpen.value = false
  isLogoutConfirmOpen.value = true
}

/**
 * "Accueil" is `/`, which prefixes every other path, so the router's
 * `router-link-active` marks it active on every page. Only the home link is
 * matched exactly; the others stay prefix-matched so `/evenements/:id` still
 * lights up "Événements".
 */
const NEVER = 'header__nav-link--prefix'
</script>

<template>
  <header class="header">
    <div class="header__inner">
      <div class="header__start">
        <button
          class="header__icon-button"
          type="button"
          aria-label="Ouvrir le menu"
          :aria-expanded="ui.isMobileMenuOpen"
          @click="ui.toggleMobileMenu(true)"
        >
          <BaseIcon name="menu" :size="24" />
        </button>

        <RouterLink :to="{ name: 'home' }" class="header__brand">
          {{ APP_CONFIG.name }}
        </RouterLink>

        <nav class="header__nav" aria-label="Navigation principale">
          <RouterLink
            v-for="item in HEADER_NAV"
            :key="item.route"
            class="header__nav-link"
            :to="{ name: item.route }"
            :active-class="item.route === 'home' ? NEVER : 'header__nav-link--active'"
            exact-active-class="header__nav-link--active"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>

      <form class="header__search" role="search" @submit.prevent="submitSearch">
        <label class="visually-hidden" for="header-search">Rechercher un événement</label>
        <input
          id="header-search"
          v-model="search"
          class="header__search-input"
          type="search"
          placeholder="Rechercher un événement, une catégorie, un organisateur…"
          @input="applySearch"
        />
        <button class="header__search-button" type="submit" aria-label="Lancer la recherche">
          <BaseIcon name="search" :size="22" />
        </button>
      </form>

      <div class="header__end">
        <button
          class="header__icon-button header__icon-button--mobile"
          type="button"
          aria-label="Rechercher"
          :aria-expanded="isSearchOpen"
          @click="isSearchOpen = !isSearchOpen"
        >
          <BaseIcon name="search" :size="24" />
        </button>

        <BaseButton class="header__publish" pill :to="{ name: 'become-organizer' }">
          Devenir organisateur
        </BaseButton>

        <RouterLink
          class="header__icon-button header__icon-button--muted"
          :to="{ name: 'favorites' }"
        >
          <BaseIcon name="favorite_border" :size="22" label="Mes favoris" />
        </RouterLink>

        <RouterLink
          class="header__icon-button header__icon-button--muted"
          :to="{ name: 'tickets' }"
        >
          <BaseIcon name="confirmation_number" :size="22" label="Mes billets" />
        </RouterLink>

        <div ref="menu" class="header__account">
          <button
            class="header__icon-button"
            type="button"
            :aria-expanded="isMenuOpen"
            aria-haspopup="menu"
            :aria-label="auth.isAuthenticated ? 'Menu du compte' : 'Se connecter'"
            @click="isMenuOpen = !isMenuOpen"
          >
            <BaseAvatar v-if="auth.isAuthenticated" :name="auth.displayName" :size="30" />
            <BaseIcon v-else name="person" :size="24" />
          </button>

          <Transition name="menu">
            <div v-if="isMenuOpen" class="menu" role="menu">
              <template v-if="auth.isAuthenticated">
                <p class="menu__header">
                  <span class="menu__name">{{ auth.displayName || 'Mon compte' }}</span>
                  <span class="menu__email">{{ auth.user?.email }}</span>
                </p>

                <RouterLink
                  v-for="item in ACCOUNT_NAV"
                  :key="item.route"
                  class="menu__item"
                  role="menuitem"
                  :to="{ name: item.route }"
                >
                  <BaseIcon :name="item.icon" :size="18" /> {{ item.label }}
                </RouterLink>

                <button
                  class="menu__item menu__item--danger"
                  role="menuitem"
                  type="button"
                  @click="askSignOut"
                >
                  <BaseIcon name="logout" :size="18" /> Se déconnecter
                </button>
              </template>

              <template v-else>
                <RouterLink class="menu__item" role="menuitem" :to="{ name: 'login' }">
                  <BaseIcon name="person" :size="18" /> Connexion
                </RouterLink>
                <RouterLink class="menu__item" role="menuitem" :to="{ name: 'register' }">
                  <BaseIcon name="person_add" :size="18" /> Créer un compte
                </RouterLink>
              </template>
            </div>
          </Transition>
        </div>
      </div>
    </div>

    <!-- Mobile search, revealed under the bar -->
    <Transition name="search">
      <form
        v-if="isSearchOpen"
        class="header__mobile-search"
        role="search"
        @submit.prevent="submitSearch"
      >
        <label class="visually-hidden" for="header-search-mobile">Rechercher un événement</label>
        <input
          id="header-search-mobile"
          v-model="search"
          class="header__search-input"
          type="search"
          placeholder="Rechercher un événement, une catégorie, un organisateur…"
          @input="applySearch"
        />
        <button class="header__search-button" type="submit" aria-label="Lancer la recherche">
          <BaseIcon name="search" :size="22" />
        </button>
      </form>
    </Transition>

    <BaseDrawer :open="ui.isMobileMenuOpen" title="Menu" @update:open="ui.toggleMobileMenu($event)">
      <nav class="drawer-nav" aria-label="Navigation">
        <RouterLink
          v-for="item in HEADER_NAV"
          :key="item.route"
          class="drawer-nav__link"
          :to="{ name: item.route }"
          :active-class="item.route === 'home' ? NEVER : 'drawer-nav__link--active'"
          exact-active-class="drawer-nav__link--active"
        >
          {{ item.label }}
        </RouterLink>

        <!-- The account section is a disclosure, not a list: it is secondary to
             the four public links above it, and unfolding it is one tap. What
             it contains depends on the session — a signed-out visitor has no
             use for four links that all bounce off the auth guard. -->
        <details class="drawer-group">
          <summary class="drawer-nav__link drawer-group__summary">
            <span>{{ auth.isAuthenticated ? 'Mon espace' : 'Compte' }}</span>
            <BaseIcon class="drawer-group__chevron" name="expand_more" :size="20" />
          </summary>

          <div class="drawer-group__body">
            <template v-if="auth.isAuthenticated">
              <RouterLink
                v-for="item in ACCOUNT_NAV"
                :key="item.route"
                class="drawer-nav__link drawer-nav__link--nested"
                :to="{ name: item.route }"
                active-class="drawer-nav__link--active"
              >
                {{ item.label }}
              </RouterLink>
            </template>

            <template v-else>
              <RouterLink class="drawer-nav__link drawer-nav__link--nested" :to="{ name: 'login' }">
                Connexion
              </RouterLink>
              <RouterLink
                class="drawer-nav__link drawer-nav__link--nested"
                :to="{ name: 'register' }"
              >
                Créer un compte
              </RouterLink>
            </template>
          </div>
        </details>

        <!-- The header's own "Devenir organisateur" is desktop-only; without
             this the action is unreachable on a phone. -->
        <BaseButton class="drawer-nav__publish" block pill :to="{ name: 'become-organizer' }">
          Devenir organisateur
        </BaseButton>

        <button
          v-if="auth.isAuthenticated"
          class="drawer-nav__link drawer-nav__link--danger"
          type="button"
          @click="askSignOut"
        >
          Se déconnecter
        </button>
      </nav>
    </BaseDrawer>

    <LogoutConfirm v-model:open="isLogoutConfirmOpen" />
  </header>
</template>

<style scoped>
.header {
  position: fixed;
  top: 0;
  z-index: var(--z-header);
  width: 100%;
  background-color: var(--color-surface);
  border-block-end: 1px solid var(--color-surface-variant);
}

.header__inner {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: var(--container-max);
  height: var(--header-height);
  margin-inline: auto;
  padding-inline: var(--space-gutter);
}

.header__start,
.header__end {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

/* The brand needs room from the first nav link, or the two read as one block —
   but that gap is desktop-only: on a phone there is no nav, and the spacing
   pushed the brand into the search and account buttons. */
.header__start {
  gap: var(--space-2);
  min-width: 0;
}

/* `min-width: 0` on the link itself: a flex item will not shrink past its
   content without it, and the brand was overlapping the icons at 320 px. */
.header__brand {
  min-width: 0;
  overflow: hidden;
  color: var(--color-primary);
  font-size: clamp(1rem, 4.6vw, var(--text-headline-lg));
  font-weight: 700;
  letter-spacing: var(--tracking-headline);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* The end cluster keeps its buttons at full size; the brand yields instead. */
.header__end {
  flex-shrink: 0;
}

.header__icon-button {
  display: flex;
  padding: var(--space-2);
  color: var(--color-primary);
  border-radius: var(--radius-full);
  transition: background-color var(--transition-fast);
}

.header__icon-button:hover {
  background-color: var(--color-surface-variant);
}

/* --- Search --- */
.header__search {
  position: relative;
  display: none;
  flex: 1;
  max-width: 36rem;
  margin-inline: var(--space-8);
}

.header__mobile-search {
  position: relative;
  display: flex;
  padding: var(--space-3) var(--space-gutter);
  background-color: var(--color-surface);
  border-block-end: 1px solid var(--color-surface-variant);
}

.header__search-input {
  width: 100%;
  padding: 0.625rem var(--space-12) 0.625rem var(--space-4);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-full);
}

/* Neutral, like every other field: red is kept for errors and active choices. */
.header__search-input:focus {
  border-color: var(--color-focus);
  outline: none;
  box-shadow: 0 0 0 1px var(--color-focus);
}

.header__search-button {
  position: absolute;
  top: 50%;
  right: var(--space-1);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  color: #fff;
  background-color: var(--color-primary-container);
  border-radius: var(--radius-full);
  transform: translateY(-50%);
  transition: transform var(--transition-fast);
}

.header__mobile-search .header__search-button {
  right: calc(var(--space-gutter) + var(--space-1));
}

.header__search-button:active {
  transform: translateY(-50%) scale(0.95);
}

/* Favoris et billets : deux raccourcis de même rang, donc même traitement —
   tracé gris, pas de pastille. Le cœur prend la variante `favorite_border`
   pour garder le même poids de trait que le billet à côté. */
.header__icon-button--muted {
  display: none;
  color: var(--color-on-surface-variant);
}

/* --- Links --- */
.header__nav {
  display: none;
  gap: var(--space-6);
  align-items: center;
}

.header__nav-link {
  color: var(--color-on-surface);
  font-size: var(--text-label-bold);
  font-weight: 700;
  transition: color var(--transition-fast);
}

.header__nav-link:hover,
.header__nav-link--active {
  color: var(--color-primary);
}

.header__publish {
  display: none;
}

/* Below md the bottom tab bar carries "Profil"; two entry points to the same
   account, one above and one below, is one too many on a phone. The drawer
   still offers Connexion / Créer un compte to a signed-out visitor. */
.header__account {
  position: relative;
  display: none;
}

/* --- Account menu --- */
.menu {
  position: absolute;
  top: calc(100% + var(--space-2));
  right: 0;
  z-index: var(--z-drawer);
  display: flex;
  flex-direction: column;
  min-width: 15rem;
  padding: var(--space-2);
  background-color: var(--color-surface-container-lowest);
  border: 1px solid var(--color-surface-variant);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.menu__header {
  display: flex;
  flex-direction: column;
  padding: var(--space-3);
  margin-block-end: var(--space-1);
  border-block-end: 1px solid var(--color-surface-variant);
}

.menu__name {
  color: var(--color-on-surface);
  font-weight: 700;
}

.menu__email {
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  overflow-wrap: anywhere;
}

.menu__item {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding: var(--space-3);
  color: var(--color-on-surface-variant);
  font-size: var(--text-body-md);
  text-align: start;
  border-radius: var(--radius-md);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.menu__item:hover {
  color: var(--color-primary);
  background-color: var(--color-surface-container-low);
}

.menu__item--danger:hover {
  color: var(--color-error);
  background-color: var(--color-error-container);
}

.menu-enter-active,
.menu-leave-active,
.search-enter-active,
.search-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.menu-enter-from,
.menu-leave-to,
.search-enter-from,
.search-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* --- Drawer --- */
.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

/* --- Collapsible account group --- */
.drawer-group__summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  list-style: none;
}

.drawer-group__summary::-webkit-details-marker {
  display: none;
}

.drawer-group__chevron {
  transition: transform var(--transition-fast);
}

.drawer-group[open] .drawer-group__chevron {
  transform: rotate(180deg);
}

.drawer-group__body {
  display: flex;
  flex-direction: column;
}

.drawer-nav__link--nested {
  padding-inline-start: var(--space-4);
  font-size: var(--text-body-md);
}

.drawer-nav__publish {
  margin-block-start: var(--space-4);
}

.drawer-nav__link--danger {
  color: var(--color-error);
  text-align: start;
}

.drawer-nav__heading {
  padding: var(--space-4) var(--space-3) var(--space-2);
  color: var(--color-secondary);
  font-size: var(--text-body-sm);
  font-weight: 700;
  text-transform: uppercase;
}

.drawer-nav__link {
  padding: var(--space-3);
  color: var(--color-on-surface);
  border-radius: var(--radius-md);
}

.drawer-nav__link:hover,
.drawer-nav__link--active {
  color: var(--color-primary);
  background-color: var(--color-surface-container-low);
}

@media (width >= 768px) {
  .header__icon-button--mobile,
  .header__mobile-search {
    display: none;
  }

  .header__search,
  .header__icon-button--muted {
    display: flex;
  }

  .header__account {
    display: block;
  }
}

@media (width >= 1024px) {
  .header__start {
    gap: var(--space-10);
  }

  .header__nav,
  .header__publish {
    display: flex;
  }

  /* The burger only carries the account sections once the bar shows the rest. */
  .header__start > .header__icon-button:first-child {
    display: none;
  }
}
</style>
