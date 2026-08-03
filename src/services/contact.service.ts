import { ENDPOINTS, postForMessage } from '@/api'
import type { ContactMessagePayload } from '@/types/contact'

/**
 * Support form.
 *
 * The endpoint answers with a confirmation message and no payload — the
 * backend is what actually sends the e-mail, so nothing here needs the body
 * back. `postForMessage` unwraps that envelope.
 */
export const contactService = {
  send(payload: ContactMessagePayload, signal?: AbortSignal): Promise<string> {
    return postForMessage(ENDPOINTS.contact.send, payload, { signal })
  },
}
