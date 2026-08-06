import type { IconName } from '@/components/ui'

/**
 * Navigation entries shared by the header, the bottom tab bar, the account
 * sidebar and the footer.
 *
 * Declared once so they never drift apart, and so renaming a section is a
 * one-line change.
 */

export interface NavItem {
  label: string
  route: string
  icon: IconName
}

/**
 * Tabs of the mobile bottom bar.
 *
 * Only "Billets" of the account section is here: the rest of `ACCOUNT_NAV` —
 * historique, favoris, tableau de bord — is one tap away in the drawer, and a
 * tab bar that lists half the account is a second navigation competing with it.
 */
export const BOTTOM_NAV: NavItem[] = [
  { label: 'Accueil', route: 'home', icon: 'home' },
  { label: 'Événements', route: 'events', icon: 'explore' },
  { label: 'Billets', route: 'tickets', icon: 'confirmation_number' },
]

/** Primary links of the desktop header, in the order the mockups show them. */
export const HEADER_NAV: NavItem[] = [
  { label: 'Accueil', route: 'home', icon: 'home' },
  { label: 'Événements', route: 'events', icon: 'explore' },
  { label: 'Qui sommes-nous', route: 'about', icon: 'info' },
  { label: 'Contact', route: 'contact', icon: 'call' },
]

/**
 * Icon shown on each category tile.
 *
 * The API's `EventCategory` carries no icon, and the mockup gives one per
 * category — so the mapping lives here, keyed by slug, with a neutral fallback
 * for any category the backend adds later.
 */
export const CATEGORY_ICONS: Record<string, IconName> = {
  concert: 'music_note',
  festival: 'festival',
  culture: 'palette',
  theatre: 'theater_comedy',
  sport: 'sports_soccer',
  formation: 'school',
  conference: 'group',
  soiree: 'wine_bar',
  gastronomie: 'restaurant',
  tourisme: 'map',
  science: 'science',
  religieux: 'church',
  cinema: 'videocam',
  business: 'business_center',
}

export const CATEGORY_FALLBACK_ICON: IconName = 'local_activity'

export interface FooterColumn {
  title: string
  links: { label: string; to?: { name: string; query?: Record<string, string> }; href?: string }[]
}

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    title: 'À propos',
    links: [
      { label: 'Qui sommes-nous ?', to: { name: 'about' } },
      { label: 'Tous les événements', to: { name: 'events' } },
      { label: 'Devenir organisateur', to: { name: 'become-organizer' } },
      { label: 'Nous contacter', to: { name: 'contact' } },
    ],
  },
  {
    title: 'Légal',
    links: [
      { label: 'Conditions générales', href: '#cgu' },
      { label: 'Politique de confidentialité', href: '#confidentialite' },
      { label: 'Cookies', href: '#cookies' },
    ],
  },
]

/** Sections of the signed-in area, used by the account sidebar. */
export const ACCOUNT_NAV: NavItem[] = [
  { label: 'Tableau de bord', route: 'dashboard', icon: 'dashboard' },
  { label: 'Mes billets', route: 'tickets', icon: 'confirmation_number' },
  { label: 'Historique', route: 'orders', icon: 'history' },
  { label: 'Favoris', route: 'favorites', icon: 'favorite' },
  { label: 'Notifications', route: 'notifications', icon: 'notifications' },
  { label: 'Mon profil', route: 'profile', icon: 'account_circle' },
]
