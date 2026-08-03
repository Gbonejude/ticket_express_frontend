import type { RouteLocationRaw } from 'vue-router'

/**
 * Shapes shared between a design-system component and its callers.
 *
 * They live here rather than in the `.vue` files because `<script setup>`
 * cannot re-export declarations, and a page needs to be able to type the array
 * it passes in.
 */

export interface SelectOption {
  value: string | number
  label: string
}

export interface TabItem {
  value: string
  label: string
  /** Optional count shown next to the label, e.g. "Billets actifs 2". */
  count?: number
}

export interface Crumb {
  label: string
  /** Omit on the last crumb: the current page is not a link. */
  to?: RouteLocationRaw
}
