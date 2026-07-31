import AxiosMockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { STORAGE_KEYS } from '@/constants/storage'
import { storage } from '@/utils/storage'

import { ApiError } from './errors'
import {
  destroy,
  getList,
  getOne,
  http,
  post,
  postForMessage,
  put,
  setUnauthenticatedHandler,
} from './http'

let mock: AxiosMockAdapter

beforeEach(() => {
  mock = new AxiosMockAdapter(http)
})

afterEach(() => {
  mock.restore()
  // Leave no handler behind for the next file.
  setUnauthenticatedHandler(() => {})
})

describe('request interceptor', () => {
  it('sends no Authorization header when signed out', async () => {
    mock.onGet('events').reply(200, { success: true, message: '', data: [], meta: {} })

    await getList('events')

    expect(mock.history.get[0]?.headers?.Authorization).toBeUndefined()
  })

  it('attaches the stored token as a bearer', async () => {
    storage.set(STORAGE_KEYS.accessToken, 'tok_123')
    mock.onGet('events').reply(200, { success: true, message: '', data: [], meta: {} })

    await getList('events')

    expect(mock.history.get[0]?.headers?.Authorization).toBe('Bearer tok_123')
  })

  it('lets axios set the boundary itself for multipart uploads', async () => {
    mock.onPost('events').reply(200, { success: true, message: '', data: {} })

    await post('events', new FormData())

    expect(mock.history.post[0]?.headers?.['Content-Type']).not.toBe('application/json')
  })
})

describe('envelope unwrapping', () => {
  it('getOne returns the data payload', async () => {
    mock.onGet('events/01J').reply(200, {
      success: true,
      message: 'ok',
      data: { id: '01J', title: 'Concert' },
    })

    await expect(getOne('events/01J')).resolves.toEqual({ id: '01J', title: 'Concert' })
  })

  it('getList returns items and pagination meta', async () => {
    const meta = { current_page: 1, per_page: 15, total: 2, last_page: 1, from: 1, to: 2 }

    mock.onGet('events').reply(200, {
      success: true,
      message: 'ok',
      data: [{ id: '01J' }, { id: '02K' }],
      meta,
    })

    await expect(getList('events')).resolves.toEqual({
      items: [{ id: '01J' }, { id: '02K' }],
      meta,
    })
  })

  it('getList yields an empty array when data is null', async () => {
    mock.onGet('events').reply(200, { success: true, message: '', data: null, meta: {} })

    const result = await getList('events')

    expect(result.items).toEqual([])
  })

  it('forwards query parameters', async () => {
    mock.onGet('events').reply(200, { success: true, message: '', data: [], meta: {} })

    await getList('events', { params: { page: 2, search: 'concert' } })

    expect(mock.history.get[0]?.params).toEqual({ page: 2, search: 'concert' })
  })

  it('post returns the created resource', async () => {
    mock.onPost('orders').reply(201, {
      success: true,
      message: 'Commande créée.',
      data: { id: '01J', orderNumber: 'TE-001' },
    })

    await expect(post('orders', { items: [] })).resolves.toEqual({
      id: '01J',
      orderNumber: 'TE-001',
    })
  })

  it('put returns the updated resource', async () => {
    mock.onPut('orders/01J').reply(200, { success: true, message: '', data: { id: '01J' } })

    await expect(put('orders/01J', {})).resolves.toEqual({ id: '01J' })
  })

  it('destroy resolves without a value', async () => {
    mock.onDelete('orders/01J').reply(200, { success: true, message: '', data: null })

    await expect(destroy('orders/01J')).resolves.toBeUndefined()
  })

  it('postForMessage returns the envelope message', async () => {
    mock.onPost('auth/send-otp').reply(200, { success: true, message: 'OTP envoyé.', data: null })

    await expect(postForMessage('auth/send-otp', { phone: '+228' })).resolves.toBe('OTP envoyé.')
  })
})

describe('response interceptor', () => {
  it('rejects with an ApiError, not a raw AxiosError', async () => {
    mock.onGet('events/nope').reply(404, { message: 'Événement introuvable.' })

    await expect(getOne('events/nope')).rejects.toBeInstanceOf(ApiError)
  })

  it('preserves validation errors through the interceptor', async () => {
    mock.onPost('orders').reply(422, {
      message: 'Données invalides.',
      errors: { email: ['Adresse invalide.'] },
    })

    await expect(post('orders', {})).rejects.toMatchObject({
      status: 422,
      errors: { email: ['Adresse invalide.'] },
    })
  })

  it('calls the unauthenticated handler on a 401', async () => {
    const onUnauthenticated = vi.fn()

    setUnauthenticatedHandler(onUnauthenticated)
    mock.onGet('me').reply(401, { message: 'Unauthenticated.' })

    await expect(getOne('me')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthenticated).toHaveBeenCalledOnce()
  })

  it('does not call the unauthenticated handler on other statuses', async () => {
    const onUnauthenticated = vi.fn()

    setUnauthenticatedHandler(onUnauthenticated)
    mock.onGet('events').reply(403, { message: 'Interdit.' })

    await expect(getList('events')).rejects.toBeInstanceOf(ApiError)
    expect(onUnauthenticated).not.toHaveBeenCalled()
  })

  it('reports a network failure as such', async () => {
    mock.onGet('events').networkError()

    await expect(getList('events')).rejects.toMatchObject({ isNetworkError: true, status: 0 })
  })
})
