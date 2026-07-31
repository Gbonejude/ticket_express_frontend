import axios from 'axios'

import type { ApiValidationErrors } from '@/types/api'

/**
 * Every failure that reaches application code is an `ApiError`.
 *
 * Callers get one exception type with a message already fit to display, instead
 * of having to unpack `error.response.data.message` at each call site and guess
 * whether the request even reached the server.
 */
export class ApiError extends Error {
  /** HTTP status, or 0 when the request never got a response. */
  readonly status: number

  /** Per-field messages from a 422 response. */
  readonly errors: ApiValidationErrors

  /** True when the network failed or the request timed out. */
  readonly isNetworkError: boolean

  /** True when the request was cancelled by an AbortController. */
  readonly isCanceled: boolean

  constructor(
    message: string,
    options: {
      status?: number
      errors?: ApiValidationErrors
      isNetworkError?: boolean
      isCanceled?: boolean
      cause?: unknown
    } = {},
  ) {
    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.status = options.status ?? 0
    this.errors = options.errors ?? {}
    this.isNetworkError = options.isNetworkError ?? false
    this.isCanceled = options.isCanceled ?? false
  }

  /** Credentials are missing or expired. */
  get isUnauthenticated(): boolean {
    return this.status === 401
  }

  /** Authenticated, but not allowed to perform the action. */
  get isForbidden(): boolean {
    return this.status === 403
  }

  get isNotFound(): boolean {
    return this.status === 404
  }

  /** Validation failed; `errors` holds the per-field messages. */
  get isValidationError(): boolean {
    return this.status === 422
  }

  get isServerError(): boolean {
    return this.status >= 500
  }

  /** First message for a field, if the API reported one. */
  firstError(field: string): string | undefined {
    return this.errors[field]?.[0]
  }
}

/** Fallback messages, in French — this is a French-speaking public site. */
const STATUS_MESSAGES: Record<number, string> = {
  400: 'Requête invalide.',
  401: 'Votre session a expiré. Veuillez vous reconnecter.',
  403: "Vous n'avez pas l'autorisation d'effectuer cette action.",
  404: 'Ressource introuvable.',
  409: 'Cette opération entre en conflit avec l’état actuel de la ressource.',
  422: 'Certaines informations saisies sont invalides.',
  429: 'Trop de requêtes. Merci de patienter quelques instants.',
  500: 'Une erreur interne est survenue. Veuillez réessayer plus tard.',
  503: 'Le service est temporairement indisponible.',
}

const NETWORK_MESSAGE = 'Connexion au serveur impossible. Vérifiez votre connexion internet.'
const TIMEOUT_MESSAGE = 'Le serveur met trop de temps à répondre. Veuillez réessayer.'
const UNKNOWN_MESSAGE = 'Une erreur inattendue est survenue.'

/** Body shape the API uses for errors, as far as we rely on it. */
interface ErrorBody {
  message?: unknown
  errors?: unknown
}

function extractValidationErrors(body: ErrorBody): ApiValidationErrors {
  if (!body.errors || typeof body.errors !== 'object') return {}

  const result: ApiValidationErrors = {}

  for (const [field, messages] of Object.entries(body.errors as Record<string, unknown>)) {
    if (Array.isArray(messages)) {
      result[field] = messages.filter((m): m is string => typeof m === 'string')
    } else if (typeof messages === 'string') {
      result[field] = [messages]
    }
  }

  return result
}

/**
 * Converts anything thrown by axios into an `ApiError`.
 *
 * Prefers the server's own `message` when there is one, because the backend
 * already returns user-facing French text; falls back to a generic message
 * derived from the status otherwise.
 */
export function normalizeError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (axios.isCancel(error)) {
    return new ApiError('Requête annulée.', { isCanceled: true, cause: error })
  }

  if (axios.isAxiosError(error)) {
    const { response, code } = error

    if (!response) {
      const timedOut = code === 'ECONNABORTED' || code === 'ETIMEDOUT'

      return new ApiError(timedOut ? TIMEOUT_MESSAGE : NETWORK_MESSAGE, {
        isNetworkError: true,
        cause: error,
      })
    }

    const body: ErrorBody = (response.data ?? {}) as ErrorBody
    const serverMessage =
      typeof body.message === 'string' && body.message.trim() ? body.message : null

    return new ApiError(serverMessage ?? STATUS_MESSAGES[response.status] ?? UNKNOWN_MESSAGE, {
      status: response.status,
      errors: extractValidationErrors(body),
      cause: error,
    })
  }

  return new ApiError(error instanceof Error ? error.message : UNKNOWN_MESSAGE, { cause: error })
}
