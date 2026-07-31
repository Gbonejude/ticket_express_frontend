import { watchEffect } from 'vue'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

import { APP_CONFIG } from '@/constants/app'

/**
 * Keeps `document.title` in sync with a page-level value.
 *
 * The router already sets a title from `route.meta.title`; use this when the
 * title depends on loaded data, such as an event name.
 */
export function usePageTitle(title: MaybeRefOrGetter<string | null | undefined>): void {
  watchEffect(() => {
    const value = toValue(title)

    document.title = value ? `${value} — ${APP_CONFIG.name}` : APP_CONFIG.name
  })
}
