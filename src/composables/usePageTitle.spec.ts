import { describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'

import { usePageTitle } from './usePageTitle'

/**
 * `usePageTitle` calls `watchEffect`, which needs no component instance but does
 * need a flush to observe reactive updates.
 */
describe('usePageTitle', () => {
  it('suffixes a static title with the app name', () => {
    usePageTitle('Concert de la Fanfare')

    expect(document.title).toBe('Concert de la Fanfare — Ticket Express')
  })

  it('falls back to the app name alone when there is no title', () => {
    usePageTitle(null)

    expect(document.title).toBe('Ticket Express')
  })

  it('treats an empty string as no title', () => {
    usePageTitle('')

    expect(document.title).toBe('Ticket Express')
  })

  it('tracks a ref, so a title loaded from the API updates the tab', async () => {
    const title = ref<string | null>(null)

    usePageTitle(title)
    expect(document.title).toBe('Ticket Express')

    title.value = 'Festival des Lumières'
    await nextTick()

    expect(document.title).toBe('Festival des Lumières — Ticket Express')
  })

  it('accepts a getter', async () => {
    const event = ref({ title: 'Concert' })

    usePageTitle(() => event.value.title)
    expect(document.title).toBe('Concert — Ticket Express')

    event.value = { title: 'Théâtre' }
    await nextTick()

    expect(document.title).toBe('Théâtre — Ticket Express')
  })
})
