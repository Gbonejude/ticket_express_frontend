import type { RouteRecordRaw } from 'vue-router'

import AccountLayout from '@/layouts/AccountLayout.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import BlankLayout from '@/layouts/BlankLayout.vue'
import CheckoutLayout from '@/layouts/CheckoutLayout.vue'
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
        meta: { title: 'Explorer les événements' },
      },
      {
        path: 'evenements/:id',
        name: 'event-detail',
        component: () => import('@/pages/EventDetailPage.vue'),
        props: true,
        meta: { title: 'Détail de l’événement' },
      },

      {
        path: 'organisateurs/:id',
        name: 'organizer',
        component: () => import('@/pages/OrganizerPage.vue'),
        props: true,
        meta: { title: 'Organisateur' },
      },
      {
        // Public: an organizer signs up here and never comes back. They have
        // no account *on this site* — their events are managed in
        // TicketExpress-dashboard, whose URL reaches them by e-mail once an
        // administrator approves. Guarding this would have asked a visitor to
        // create a client account before they could ask for an organizer one.
        path: 'devenir-organisateur',
        name: 'become-organizer',
        component: () => import('@/pages/organizer/BecomeOrganizerPage.vue'),
        meta: { title: 'Devenir organisateur' },
      },
      {
        path: 'qui-sommes-nous',
        name: 'about',
        component: () => import('@/pages/AboutPage.vue'),
        meta: { title: 'Qui sommes-nous' },
      },
      {
        path: 'contact',
        name: 'contact',
        component: () => import('@/pages/ContactPage.vue'),
        meta: { title: 'Contact' },
      },

      {
        // Shown after signing out, so it must stay reachable to a visitor.
        path: 'deconnexion',
        name: 'logout',
        component: () => import('@/pages/auth/LogoutPage.vue'),
        meta: { title: 'Déconnexion' },
      },
    ],
  },

  // --- Checkout (minimal chrome: nothing competes with the payment) ---
  {
    path: '/',
    component: CheckoutLayout,
    children: [
      {
        // Guest checkout is allowed, so this route is deliberately not guarded.
        path: 'reservation/:eventId',
        name: 'checkout',
        component: () => import('@/pages/CheckoutPage.vue'),
        props: true,
        meta: { title: 'Paiement sécurisé' },
      },
    ],
  },

  // --- Signed-in area (sidebar navigation) ---
  {
    path: '/mon-espace',
    component: AccountLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/account/DashboardPage.vue'),
        meta: { title: 'Tableau de bord', requiresAuth: true },
      },
      // "Mes billets" is one of the account sidebar entries, so it belongs
      // inside this layout: leaving it in the public tree dropped the sidebar
      // the moment the visitor clicked it.
      {
        path: 'billets',
        name: 'tickets',
        component: () => import('@/pages/tickets/TicketsPage.vue'),
        meta: { title: 'Mes billets', requiresAuth: true },
      },
      {
        path: 'billets/:id',
        name: 'ticket-detail',
        component: () => import('@/pages/tickets/TicketDetailPage.vue'),
        props: true,
        meta: { title: 'Mon billet', requiresAuth: true },
      },
      {
        path: 'commandes',
        name: 'orders',
        component: () => import('@/pages/account/OrdersPage.vue'),
        meta: { title: 'Historique des commandes', requiresAuth: true },
      },
      {
        path: 'favoris',
        name: 'favorites',
        component: () => import('@/pages/account/FavoritesPage.vue'),
        meta: { title: 'Mes favoris', requiresAuth: true },
      },
      {
        path: 'notifications',
        name: 'notifications',
        component: () => import('@/pages/account/NotificationsPage.vue'),
        meta: { title: 'Notifications', requiresAuth: true },
      },
      {
        path: 'profil',
        name: 'profile',
        component: () => import('@/pages/account/ProfilePage.vue'),
        meta: { title: 'Mon profil', requiresAuth: true },
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
