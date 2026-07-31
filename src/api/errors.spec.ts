import { AxiosError, AxiosHeaders } from 'axios'
import { describe, expect, it } from 'vitest'

import { ApiError, normalizeError } from './errors'

/** Builds an AxiosError carrying a real response, as the interceptor sees it. */
function axiosErrorWithResponse(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const error = new AxiosError('Request failed', 'ERR_BAD_REQUEST', config)

  error.response = {
    status,
    statusText: '',
    data,
    headers: {},
    config,
  } as AxiosError['response']

  return error
}

/** Builds an AxiosError with no response, as a network failure produces. */
function axiosErrorWithoutResponse(code: string): AxiosError {
  return new AxiosError('Network Error', code, { headers: new AxiosHeaders() })
}

describe('ApiError', () => {
  it('exposes a status of 0 when the request never reached the server', () => {
    const error = new ApiError('boom')

    expect(error.status).toBe(0)
    expect(error.errors).toEqual({})
    expect(error.isNetworkError).toBe(false)
  })

  it.each([
    [401, 'isUnauthenticated'],
    [403, 'isForbidden'],
    [404, 'isNotFound'],
    [422, 'isValidationError'],
  ] as const)('maps status %i to %s', (status, flag) => {
    const error = new ApiError('x', { status })

    expect(error[flag]).toBe(true)
  })

  it('treats any 5xx as a server error', () => {
    expect(new ApiError('x', { status: 500 }).isServerError).toBe(true)
    expect(new ApiError('x', { status: 503 }).isServerError).toBe(true)
    expect(new ApiError('x', { status: 422 }).isServerError).toBe(false)
  })

  it('returns the first message for a field', () => {
    const error = new ApiError('x', {
      status: 422,
      errors: { email: ['Adresse invalide.', 'Déjà utilisée.'] },
    })

    expect(error.firstError('email')).toBe('Adresse invalide.')
    expect(error.firstError('phone')).toBeUndefined()
  })
})

describe('normalizeError', () => {
  it('returns an ApiError unchanged', () => {
    const original = new ApiError('déjà normalisée', { status: 418 })

    expect(normalizeError(original)).toBe(original)
  })

  it('flags a network failure and keeps a readable message', () => {
    const error = normalizeError(axiosErrorWithoutResponse('ERR_NETWORK'))

    expect(error.isNetworkError).toBe(true)
    expect(error.status).toBe(0)
    expect(error.message).toContain('Connexion au serveur impossible')
  })

  it('distinguishes a timeout from a plain network failure', () => {
    const error = normalizeError(axiosErrorWithoutResponse('ECONNABORTED'))

    expect(error.isNetworkError).toBe(true)
    expect(error.message).toContain('trop de temps')
  })

  it("prefers the server's own message", () => {
    const error = normalizeError(
      axiosErrorWithResponse(403, { message: 'Cet événement est complet.' }),
    )

    expect(error.message).toBe('Cet événement est complet.')
    expect(error.isForbidden).toBe(true)
  })

  it('falls back to a status-derived message when the body has none', () => {
    expect(normalizeError(axiosErrorWithResponse(404, {})).message).toBe('Ressource introuvable.')
  })

  it('ignores a blank server message', () => {
    const error = normalizeError(axiosErrorWithResponse(500, { message: '   ' }))

    expect(error.message).toBe('Une erreur interne est survenue. Veuillez réessayer plus tard.')
  })

  it('extracts per-field validation errors from a 422', () => {
    const error = normalizeError(
      axiosErrorWithResponse(422, {
        message: 'Données invalides.',
        errors: { email: ['Adresse invalide.'], phone: ['Numéro requis.'] },
      }),
    )

    expect(error.isValidationError).toBe(true)
    expect(error.firstError('email')).toBe('Adresse invalide.')
    expect(error.firstError('phone')).toBe('Numéro requis.')
  })

  it('accepts a bare string as a field error', () => {
    const error = normalizeError(
      axiosErrorWithResponse(422, { errors: { email: 'Adresse invalide.' } }),
    )

    expect(error.errors.email).toEqual(['Adresse invalide.'])
  })

  it('drops non-string entries instead of leaking them into the UI', () => {
    const error = normalizeError(
      axiosErrorWithResponse(422, { errors: { email: ['ok', 42, null] } }),
    )

    expect(error.errors.email).toEqual(['ok'])
  })

  it('tolerates an errors field that is not an object', () => {
    const error = normalizeError(axiosErrorWithResponse(422, { errors: 'nope' }))

    expect(error.errors).toEqual({})
  })

  it('wraps a non-axios error', () => {
    const error = normalizeError(new Error('quelque chose a cassé'))

    expect(error).toBeInstanceOf(ApiError)
    expect(error.message).toBe('quelque chose a cassé')
  })

  it('wraps a thrown non-error value', () => {
    expect(normalizeError('oops').message).toBe('Une erreur inattendue est survenue.')
  })
})
