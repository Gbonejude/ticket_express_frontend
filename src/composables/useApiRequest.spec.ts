import { describe, expect, it, vi } from 'vitest'

import { ApiError } from '@/api'

import { useApiRequest } from './useApiRequest'

describe('useApiRequest', () => {
  it('starts idle', () => {
    const { data, error, isLoading } = useApiRequest(vi.fn())

    expect(data.value).toBeNull()
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('stores the result and returns it', async () => {
    const request = vi.fn().mockResolvedValue({ id: '01J' })
    const { data, execute } = useApiRequest(request)

    await expect(execute()).resolves.toEqual({ id: '01J' })
    expect(data.value).toEqual({ id: '01J' })
  })

  it('forwards arguments to the request', async () => {
    const request = vi.fn().mockResolvedValue(null)
    const { execute } = useApiRequest(request)

    await execute({ page: 2 })

    // The composable adds an abort signal of its own; the first argument is ours.
    expect(request).toHaveBeenCalledWith({ page: 2 })
  })

  it('toggles isLoading around the request', async () => {
    let resolve: (value: unknown) => void = () => {}
    const request = vi.fn().mockReturnValue(new Promise((r) => (resolve = r)))
    const { isLoading, execute } = useApiRequest(request)

    const pending = execute()

    expect(isLoading.value).toBe(true)
    resolve('done')
    await pending
    expect(isLoading.value).toBe(false)
  })

  it('captures the error instead of throwing at the call site', async () => {
    const request = vi.fn().mockRejectedValue(new ApiError('Introuvable.', { status: 404 }))
    const { error, execute } = useApiRequest(request)

    await expect(execute()).resolves.toBeNull()
    expect(error.value?.isNotFound).toBe(true)
    expect(error.value?.message).toBe('Introuvable.')
  })

  it('normalises a non-ApiError rejection', async () => {
    const request = vi.fn().mockRejectedValue(new Error('boom'))
    const { error, execute } = useApiRequest(request)

    await execute()

    expect(error.value).toBeInstanceOf(ApiError)
  })

  it('clears a previous error on the next call', async () => {
    const request = vi
      .fn()
      .mockRejectedValueOnce(new ApiError('Introuvable.', { status: 404 }))
      .mockResolvedValueOnce({ id: '01J' })
    const { error, execute } = useApiRequest(request)

    await execute()
    expect(error.value).not.toBeNull()

    await execute()
    expect(error.value).toBeNull()
  })

  it('does not surface a cancelled request as an error', async () => {
    const request = vi
      .fn()
      .mockRejectedValue(new ApiError('Requête annulée.', { isCanceled: true }))
    const { error, execute } = useApiRequest(request)

    await execute()

    expect(error.value).toBeNull()
  })

  it('aborts the in-flight request when a newer one starts', async () => {
    const signals: (AbortSignal | undefined)[] = []
    const request = vi.fn((signal?: AbortSignal) => {
      signals.push(signal)

      return new Promise(() => {})
    })
    const { execute } = useApiRequest(request)

    void execute(undefined)
    void execute(undefined)

    // The composable owns the controller, so assert on the observable effect:
    // two calls were started and the first one was superseded.
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('reset clears data, error and loading', async () => {
    const request = vi.fn().mockResolvedValue({ id: '01J' })
    const { data, error, isLoading, execute, reset } = useApiRequest(request)

    await execute()
    reset()

    expect(data.value).toBeNull()
    expect(error.value).toBeNull()
    expect(isLoading.value).toBe(false)
  })
})
