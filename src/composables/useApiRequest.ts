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

  /**
   * Sequence number of the most recent call.
   *
   * Only the latest call may write `data`, `error` or `isLoading`. Without this
   * a slow request can resolve after a newer one and overwrite it — type "jazz"
   * into the search box and the results for "jaz" land last. The composable
   * cannot cancel the HTTP request itself, because it does not know where in a
   * caller's argument list the signal belongs, so it discards the answer
   * instead. Services that want true cancellation take an `AbortSignal` and
   * are called with one directly.
   */
  let latest = 0

  /**
   * Runs the request. Returns the result, or `null` if it failed or was
   * superseded — check `error` to tell the two apart.
   */
  async function execute(...args: TArgs): Promise<TResult | null> {
    latest += 1

    const current = latest

    isLoading.value = true
    error.value = null

    try {
      const result = await request(...args)

      if (current !== latest) return null

      data.value = result

      return result
    } catch (caught) {
      const apiError = normalizeError(caught)

      // A cancelled request was replaced by a newer one; not a failure to show.
      if (current === latest && !apiError.isCanceled) error.value = apiError

      return null
    } finally {
      // A superseded call must not clear the spinner the newer one turned on.
      if (current === latest) isLoading.value = false
    }
  }

  /** Discards any in-flight request and resets the state. */
  function reset(): void {
    latest += 1
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
