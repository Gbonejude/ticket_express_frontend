import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios'

import { STORAGE_KEYS } from '@/constants/storage'
import type { ApiEnvelope, ApiListEnvelope, Paginated } from '@/types/api'
import { storage } from '@/utils/storage'

import { normalizeError } from './errors'

const DEFAULT_TIMEOUT = 15_000

/**
 * The single HTTP client for the whole application.
 *
 * Deliberately one client and not two: the back-office runs an `ofetch` client
 * next to a `useApi` fetch wrapper, and the second one swallows non-2xx
 * responses, which makes 422 validation errors impossible to read. Everything
 * here goes through the same instance and the same error normalisation.
 */
export const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT ?? DEFAULT_TIMEOUT),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
})

// --- Session hook -------------------------------------------------------------

type UnauthenticatedHandler = () => void

let onUnauthenticated: UnauthenticatedHandler | null = null

/**
 * Registers what to do when the API rejects the token (401).
 *
 * The interceptor cannot import the auth store directly — the store imports the
 * services, which import this module — so the app wires the handler at startup.
 */
export function setUnauthenticatedHandler(handler: UnauthenticatedHandler): void {
  onUnauthenticated = handler
}

// --- Interceptors -------------------------------------------------------------

http.interceptors.request.use((config) => {
  const token = storage.get<string>(STORAGE_KEYS.accessToken)

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }

  // Let axios pick the boundary itself for uploads.
  if (config.data instanceof FormData) {
    config.headers.delete('Content-Type')
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeError(error)

    // A rejected token means the session is over, wherever we are in the app.
    if (apiError.isUnauthenticated) {
      onUnauthenticated?.()
    }

    return Promise.reject(apiError)
  },
)

// --- Typed request helpers ----------------------------------------------------
//
// Services use these instead of `http` directly, so the `{ success, message,
// data, meta }` envelope is unwrapped in exactly one place.

/** GET a single resource and return its `data`. */
export async function getOne<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await http.get<ApiEnvelope<T>>(url, config)

  return data.data
}

/** GET a paginated collection and return its items plus pagination meta. */
export async function getList<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
  const { data } = await http.get<ApiListEnvelope<T>>(url, config)

  return { items: data.data ?? [], meta: data.meta }
}

/** POST a body and return the resource in `data`. */
export async function post<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.post<ApiEnvelope<T>>(url, body, config)

  return data.data
}

/** PUT a body and return the resource in `data`. */
export async function put<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.put<ApiEnvelope<T>>(url, body, config)

  return data.data
}

/** PATCH a body and return the resource in `data`. */
export async function patch<T, B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<T> {
  const { data } = await http.patch<ApiEnvelope<T>>(url, body, config)

  return data.data
}

/** DELETE a resource. */
export async function destroy(url: string, config?: AxiosRequestConfig): Promise<void> {
  await http.delete<ApiEnvelope<null>>(url, config)
}

/**
 * POST where only the envelope's `message` matters (OTP, logout, password reset).
 * Returns the message so a caller can surface the server's own wording.
 */
export async function postForMessage<B = unknown>(
  url: string,
  body?: B,
  config?: AxiosRequestConfig,
): Promise<string> {
  const { data } = await http.post<ApiEnvelope<unknown>>(url, body, config)

  return data.message
}
