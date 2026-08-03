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
}
