import { readonly, ref, shallowRef } from 'vue'

import { ApiError, normalizeError } from '@/api'

/**
 * Runs a service call while tracking its loading and error state.
 *
 * Pages otherwise repeat the same `isLoading = true / try / catch / finally`
 * block around every request. Errors are surfaced as `ApiError`, never thrown
 * at the call site, so a template can render them directly.
 *
 * @example
 * const { data, isLoading, error, execute } = useApiRequest(eventsService.list)
 * await execute({ page: 1 })
 */
export function useApiRequest<TResult, TArgs extends unknown[] = []>(
  request: (...args: TArgs) => Promise<TResult>,
) {
  const data = shallowRef<TResult | null>(null)
  const error = ref<ApiError | null>(null)
  const isLoading = ref(false)

  /** In-flight request, aborted when a newer call supersedes it. */
  let controller: AbortController | null = null

  /**
   * Runs the request. Returns the result, or `null` if it failed or was
   * superseded — check `error` to tell the two apart.
   */
  async function execute(...args: TArgs): Promise<TResult | null> {
    controller?.abort()
    controller = new AbortController()

    isLoading.value = true
    error.value = null

    try {
      const result = await request(...args)

      data.value = result

      return result
    } catch (caught) {
      const apiError = normalizeError(caught)

      // A cancelled request was replaced by a newer one; not a failure to show.
      if (!apiError.isCanceled) error.value = apiError

      return null
    } finally {
      isLoading.value = false
    }
  }

  /** Aborts any in-flight request and resets the state. */
  function reset(): void {
    controller?.abort()
    controller = null
    data.value = null
    error.value = null
    isLoading.value = false
  }

  return {
    data,
    error: readonly(error),
    isLoading: readonly(isLoading),
    execute,
    reset,
  }
}
