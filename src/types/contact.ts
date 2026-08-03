/** Body for `POST /contact`. Request bodies are snake_case. */
export interface ContactMessagePayload {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}
