import { ENDPOINTS, getOne, post, postForMessage } from '@/api'
import type {
  AuthSession,
  LoginPayload,
  MeResponse,
  RegisterClientPayload,
  ResetPasswordPayload,
  VerifyOtpResult,
} from '@/types/user'

/**
 * Authentication against the TicketExpress API.
 *
 * Two flows exist and both are wired here:
 *  - email + password (`login`, `registerClient`),
 *  - phone + OTP (`sendOtp` → `verifyOtp` → `completeRegistration` if new).
 *
 * Tokens are Sanctum personal access tokens; persisting them is the auth
 * store's job, not this module's.
 */
export const authService = {
  /** Signs in with email and password. */
  login(payload: LoginPayload): Promise<AuthSession> {
    return post<AuthSession, LoginPayload>(ENDPOINTS.auth.login, payload)
  },

  /**
   * Creates a client account and returns a session.
   * Signing up already proves the credentials, so the API issues a token here
   * and the visitor is never shown a login form straight after registering.
   */
  registerClient(payload: RegisterClientPayload): Promise<AuthSession> {
    return post<AuthSession, RegisterClientPayload>(ENDPOINTS.auth.registerClient, payload)
  },

  /** Sends a one-time code by SMS. Rate-limited to 3 requests per minute. */
  sendOtp(phone: string): Promise<string> {
    return postForMessage(ENDPOINTS.auth.sendOtp, { phone })
  },

  /**
   * Verifies the code. A known phone number yields a token and the user;
   * an unknown one yields `is_new_user: true` and must go through registration.
   */
  verifyOtp(phone: string, code: string): Promise<VerifyOtpResult> {
    return post<VerifyOtpResult>(ENDPOINTS.auth.verifyOtp, { phone, code })
  },

  /** Finishes signup after OTP verification and returns a session. */
  completeRegistration(payload: Record<string, unknown>): Promise<AuthSession> {
    return post<AuthSession>(ENDPOINTS.auth.register, payload)
  },

  /** Emails a password reset link. */
  forgotPassword(email: string): Promise<string> {
    return postForMessage(ENDPOINTS.auth.forgotPassword, { email })
  },

  /**
   * Sets a new password from the token in the reset e-mail.
   * Every existing session is revoked server-side, so the visitor signs in again.
   */
  resetPassword(payload: ResetPasswordPayload): Promise<string> {
    return postForMessage(ENDPOINTS.auth.resetPassword, payload)
  },

  /** Revokes the current token server-side. */
  logout(): Promise<string> {
    return postForMessage(ENDPOINTS.auth.logout)
  },

  /** Profile of the signed-in user; used to rehydrate a persisted session. */
  me(signal?: AbortSignal): Promise<MeResponse> {
    return getOne<MeResponse>(ENDPOINTS.auth.me, { signal })
  },
}
