/** One entry of the event page's FAQ. */
export interface FaqEntry {
  question: string
  answer: string
}

/** Criteria of the explore page, mirrored in the URL query. */
export interface EventFilterState {
  categories: string[]
  period: 'all' | 'weekend' | 'next-week' | 'month'
  /** `YYYY-MM-DD`, as produced by `<input type="date">`. */
  date: string
  maxPrice: number
  /** `all` sends no `event_type`, so both kinds come back. */
  eventType: 'all' | 'physical' | 'online'
  /**
   * Organiser name. Its own filter rather than part of the header search: the
   * quick search must not surface every event of an agency whose name contains
   * the term, but looking a promoter up on purpose is a real need.
   */
  organizer: string
}
