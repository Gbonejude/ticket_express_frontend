import type { ApiDate, Ulid } from './api'

/** Roles defined by the backend. Only `participant` matters on the public site. */
export type UserRole = 'super-admin' | 'admin' | 'organizer-manager' | 'participant'

/** Shape returned by `UserResource` (camelCase, like every API response). */
export interface User {
  id: Ulid
  firstName: string
  lastName: string
  fullName: string
  email: string | null
  phone: string | null
  address?: string | null
  gender?: string | null
  birthday?: ApiDate | null
  image?: string | null
  thumbnail?: string | null
  role?: UserRole
  createdAt?: ApiDate | null

}

/** Request body for `auth/admin/login` — request bodies are snake_case. */
export interface LoginPayload {
  email: string
  password: string
}

/** Request body for `auth/register/client`. */
export interface RegisterClientPayload {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  password_confirmation?: string
}

/**
 * Successful authentication payload.
 *
 * Returned identically by `auth/login`, `auth/register/client`,
 * `auth/register` and `auth/verify-otp`, so one type covers every public entry
 * point. (The back-office route `auth/admin/login` uses different key names —
 * `accessToken` / `userData` — and is not consumed here.)
 */
export interface AuthSession {
  token: string
  user: User
}

/** `verify-otp` answers with either a session or a "finish your signup" flag. */
export type VerifyOtpResult =
  { is_new_user: true; phone: string } | ({ is_new_user: false } & AuthSession)

/** `GET /me` response. `screens` drives back-office menus and is unused here. */
export interface MeResponse {
  user: User
  screens: string[]
}

/**
 * Body for `PUT /users/{id}`, used by the account page to edit its own profile.
 *
 * The route is only `auth:sanctum`-gated, so a user may target their own id.
 * Every field is optional — the backend patches what it receives.
 */
export interface UpdateProfilePayload {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  address?: string | null
  gender?: string | null
  birthday?: string | null
}

/** Body for `POST /auth/reset-password`, from the link in the reset e-mail. */
export interface ResetPasswordPayload {
  email: string
  token: string
  password: string
  password_confirmation: string
}

/** Password change, sent through the same `PUT /users/{id}` route. */
export interface ChangePasswordPayload {
  password: string
  password_confirmation: string
}

/**
 * Body for `POST /auth/register/organizer-manager`.
 *
 * Creates the account and the pending organiser profile in one step. It returns
 * no token on purpose: an organiser never signs in on the public site — their
 * events live in TicketExpress-dashboard, whose URL reaches them by e-mail once
 * an administrator approves.
 */
export interface OrganizerRegistrationPayload {
  first_name: string
  last_name: string
  email: string
  phone: string
  password: string
  password_confirmation: string
  company_name: string
  description: string
  website?: string
  /** Optional; sent as multipart when present. */
  logo?: File | null
}

