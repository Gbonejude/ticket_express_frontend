import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * The term typed in the header search box.
 *
 * Held here rather than in the URL query on purpose. Two reasons:
 *
 *  - the address bar stays readable — no `?recherche=jazz&format=online&tri=…`
 *    trailing behind every click on a filter;
 *  - the home page and the explore page can both react to the same term
 *    without one of them having to navigate for the other to notice.
 *
 * The trade is that a search is no longer shareable or restored by the back
 * button. That is the deliberate choice: this is a browsing control, not a
 * destination.
 */
export const useSearchStore = defineStore('search', () => {
  const term = ref('')

  function set(value: string): void {
    term.value = value
  }

  function clear(): void {
    term.value = ''
  }

  return { term, set, clear }
})
