import { ENDPOINTS, getList, getOne, post } from '@/api'
import type { Paginated, Ulid } from '@/types/api'
import type { Event, Organizer } from '@/types/event'
import type { OrganizerRegistrationPayload, User } from '@/types/user'

import { eventsService } from './events.service'

/**
 * Public organiser profiles, and the application a visitor sends to become one.
 *
 * Creating or editing events is not here and never will be: that belongs to
 * TicketExpress-dashboard. The public site only reads organiser profiles and
 * submits the application that eventually grants access to the back-office.
 */
export const organizersService = {
  /** Public organiser directory. */
  list(page = 1, signal?: AbortSignal): Promise<Paginated<Organizer>> {
    return getList<Organizer>(ENDPOINTS.organizers.list, { params: { page }, signal })
  },

  /** One public organiser profile, with the account behind it. */
  get(id: Ulid, signal?: AbortSignal): Promise<Organizer> {
    return getOne<Organizer>(ENDPOINTS.organizers.detail(id), { signal })
  },

  /**
   * Everything an organiser has on sale, split by whether it has happened.
   *
   * Two requests rather than one because the API splits on `when`; they are
   * issued in parallel so the profile's tabs fill in a single round-trip's
   * worth of latency.
   */
  async events(
    id: Ulid,
    signal?: AbortSignal,
  ): Promise<{ upcoming: Event[]; past: Event[] }> {
    const [upcoming, past] = await Promise.all([
      eventsService.list(
        { organizer_id: id, when: 'upcoming', sort: 'date-asc', per_page: 50 },
        signal,
      ),
      eventsService.list(
        { organizer_id: id, when: 'past', sort: 'date-desc', per_page: 50 },
        signal,
      ),
    ])

    return { upcoming: upcoming.items, past: past.items }
  },

  /**
   * Applies to become an organiser, from the public form.
   *
   * Creates the account *and* the pending organiser profile in one step, and
   * deliberately returns no token: an organiser has nothing to do on this site
   * while they wait, and nothing to do on it afterwards either — their events
   * are managed in TicketExpress-dashboard.
   *
   * What happens next is entirely e-mail: the administrators are notified, the
   * applicant gets an acknowledgement, and approval brings the back-office URL.
   */
  register(payload: OrganizerRegistrationPayload): Promise<{ user: User }> {
    const { logo, ...fields } = payload

    // Multipart only when there is a file: a plain JSON body keeps the request
    // readable in the network tab, and the logo is optional.
    if (!logo) {
      return post<{ user: User }>(ENDPOINTS.auth.registerOrganizerManager, fields)
    }

    const body = new FormData()

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined && value !== null) body.append(key, String(value))
    }

    body.append('logo', logo)

    return post<{ user: User }, FormData>(ENDPOINTS.auth.registerOrganizerManager, body)
  },
}
