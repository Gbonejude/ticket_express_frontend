import type { RouteRecordRaw } from 'vue-router'

import AuthLayout from '@/layouts/AuthLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

/**
 * Route table of the public site.
 *
 * Routes are declared explicitly rather than generated from the filesystem.
 * The back-office uses `unplugin-vue-router`, and the escape hatches it needed
 * (`beforeWriteFiles`, a hand-written `recursiveLayouts`) are the reason this
 * project does not: an explicit table is greppable, and layouts are just
 * nesting, with no build-time magic to reason about.
 *
 * Every page is lazy-loaded so the initial bundle stays small.
 *
 * Route meta:
 *  - `title`             — document title, suffixed with the app name.
 *  - `requiresAuth`      — redirects visitors to login, keeping the target.
 *  - `guestOnly`         — redirects signed-in users away (login, signup).
 */
export const routes: RouteRecordRaw[] = [
  // --- Public site (header + footer) ---
  {
    path: '/',
    component: DefaultLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: () => import('@/pages/HomePage.vue'),
        meta: { title: 'Accueil' },
      },
      {
        path: 'evenements',
        name: 'events',
        component: () => import('@/pages/EventsPage.vue'),
        meta: { title: 'Événements' },
      },
      {
        path: 'evenements/:id',
        name: 'event-detail',
        component: () => import('@/pages/EventDetailPage.vue'),
        props: true,
        meta: { title: 'Détail de l’événement' },
      },

      // --- Signed-in area ---
      {
        path: 'mon-compte',
        name: 'account',
        component: () => import('@/pages/AccountPage.vue'),
        meta: { title: 'Mon compte', requiresAuth: true },
      },
      {
        path: 'mes-commandes',
        name: 'orders',
        component: () => import('@/pages/OrdersPage.vue'),
        meta: { title: 'Mes commandes', requiresAuth: true },
      },
    ],
  },

  // --- Authentication (bare layout, no site navigation) ---
  {
    path: '/',
    component: AuthLayout,
    children: [
      {
        path: 'connexion',
        name: 'login',
        component: () => import('@/pages/auth/LoginPage.vue'),
        meta: { title: 'Connexion', guestOnly: true },
      },
      {
        path: 'inscription',
        name: 'register',
        component: () => import('@/pages/auth/RegisterPage.vue'),
        meta: { title: 'Créer un compte', guestOnly: true },
      },
    ],
  },

  // --- Errors ---
  {
    path: '/',
    component: BlankLayout,
    children: [
      {
        // Catch-all: must stay last so it never shadows a real route.
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('@/pages/errors/NotFoundPage.vue'),
        meta: { title: 'Page introuvable' },
      },
    ],
  },
]
