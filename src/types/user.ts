import type { ApiDate, Ulid } from './api'

/** Roles defined by the backend. Only `client` matters on the public site. */
export type UserRole = 'super-admin' | 'admin' | 'organizer-manager' | 'client'

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
