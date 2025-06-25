/**
 * Configuration options for createLatestFetcher.
 */
export type LatestFetcherOptions = {
  /**
   * Debounce delay in milliseconds.
   * - 0 (default): No debouncing, all requests execute immediately (abort-only mode)
   * - >0: Debounce requests based on the specified strategy
   *
   * @default 0
   */
  debounce?: number;

  /**
   * Debounce strategy to use when debounce > 0.
   *
   * - 'trailing': Only execute the last request after the debounce period.
   *   Best for: Filters, dropdowns, form validation
   *   Timeline: wait → wait → execute last
   *   Requests: 1 (most efficient)
   *
   * - 'leading-trailing': Execute first request immediately AND last request after settling.
   *   Best for: Search-as-you-type, autocomplete, live previews
   *   Timeline: execute first → skip middle → execute last
   *   Requests: 2 (balanced efficiency + instant feedback)
   *
   * @default 'leading-trailing'
   */
  strategy?: 'trailing' | 'leading-trailing';
};

/**
 * Creates a fetch wrapper that ensures only the latest request's result is returned.
 *
 * When multiple requests are made in quick succession, this utility:
 * - Automatically aborts all previous pending requests using AbortController
 * - Returns null for aborted, debounced, or superseded requests
 * - Only resolves with the response from the most recent request(s)
 * - Ensures errors only throw for the latest request, not stale ones
 * - Optionally debounces requests to reduce network traffic
 *
 * This is essential for scenarios like:
 * - Search-as-you-type where each keystroke triggers a new request
 * - Autocomplete dropdowns that need to show results only for the current query
 * - Dynamic data loading where newer requests should always take priority
 * - Any UI where stale data could cause race conditions
 *
 * ## Without Debouncing (debounce: 0, default):
 * ```
 * User types: h → e → l → l → o
 * t=0ms:   fetch('h')     → executes (aborted at t=50ms)
 * t=50ms:  fetch('he')    → executes (aborted at t=100ms)
 * t=100ms: fetch('hel')   → executes (aborted at t=150ms)
 * t=150ms: fetch('hell')  → executes (aborted at t=200ms)
 * t=200ms: fetch('hello') → executes ✓ [5 requests]
 * ```
 *
 * ## With Leading-Trailing Debounce (debounce: 200, strategy: 'leading-trailing'):
 * ```
 * User types: h → e → l → l → o
 * t=0ms:   fetch('h')     → executes immediately ✓ (instant feedback)
 * t=50ms:  fetch('he')    → debounced (returns null)
 * t=100ms: fetch('hel')   → debounced (returns null)
 * t=150ms: fetch('hell')  → debounced (returns null)
 * t=200ms: fetch('hello') → marked as pending
 * t=400ms: fetch('hello') → executes ✓ (final state) [2 requests: 60% reduction]
 * ```
 *
 * ## With Trailing-Only Debounce (debounce: 300, strategy: 'trailing'):
 * ```
 * User selects filter: "Category" → "Status" → "Priority"
 * t=0ms:   fetch('category')  → debounced (returns null)
 * t=100ms: fetch('status')    → debounced (returns null)
 * t=200ms: fetch('priority')  → marked as pending
 * t=500ms: fetch('priority')  → executes ✓ [1 request: maximum efficiency]
 * ```
 *
 * @param options - Configuration options for debouncing behavior
 * @returns A fetch function that automatically manages request cancellation and debouncing
 *
 * @example
 * // Basic usage - no debouncing (current behavior)
 * const basicFetch = createLatestFetcher();
 * const response = await basicFetch('/api/data');
 *
 * @example
 * // Search-as-you-type with leading-trailing debounce (optimal for autocomplete)
 * const searchFetch = createLatestFetcher({
 *   debounce: 200,
 *   strategy: 'leading-trailing'
 * });
 *
 * // User types "hello"
 * const r1 = await searchFetch('/api?q=h');     // Response (immediate)
 * const r2 = await searchFetch('/api?q=he');    // null (debounced)
 * const r3 = await searchFetch('/api?q=hel');   // null (debounced)
 * const r4 = await searchFetch('/api?q=hell');  // null (debounced)
 * const r5 = await searchFetch('/api?q=hello'); // Response (trailing)
 * // Network: 2 requests instead of 5 (60% reduction)
 *
 * @example
 * // Filter dropdown with trailing-only debounce (wait for user to finish)
 * const filterFetch = createLatestFetcher({
 *   debounce: 300,
 *   strategy: 'trailing'
 * });
 *
 * // User clicks through filters quickly
 * const r1 = await filterFetch('/api?filter=a'); // null (debounced)
 * const r2 = await filterFetch('/api?filter=b'); // null (debounced)
 * const r3 = await filterFetch('/api?filter=c'); // Response (trailing)
 * // Network: 1 request instead of 3 (67% reduction)
 *
 * @example
 * // Advanced usage with POST requests
 * const postFetch = createLatestFetcher({ debounce: 200 });
 *
 * const response = await postFetch('/api/save', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ data: 'value' })
 * });
 *
 * if (response?.ok) {
 *   console.log('Saved successfully');
 * }
 */
export function createLatestFetcher(options?: LatestFetcherOptions) {
  const debounceMs = options?.debounce ?? 0;
  const strategy = options?.strategy ?? 'leading-trailing';

  let abortController: AbortController | null = null;
  let latestId = 0;
  let debounceTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingCall: {
    url: RequestInfo | URL;
    init?: RequestInit;
    resolve: (value: Response | null) => void;
    reject: (error: unknown) => void;
  } | null = null;
  let isInDebounce = false;

  async function executeFetch(url: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
    // Abort previous request if it's still pending
    if (abortController) {
      abortController.abort();
    }

    // Create new abort controller and increment request ID
    const requestId = ++latestId;
    abortController = new AbortController();

    try {
      const response = await fetch(url, {
        ...init,
        signal: abortController.signal,
      });

      // Return null if this request has been superseded by a newer one
      if (requestId !== latestId) {
        return null;
      }

      return response;
    } catch (error) {
      // Silently return null for aborted requests (expected behavior)
      if (error instanceof Error && error.name === 'AbortError') {
        return null;
      }

      // Only throw errors for the latest request to avoid error noise from stale requests
      if (requestId === latestId) {
        throw error;
      }

      return null;
    }
  }

  return function (url: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
    // No debounce - execute immediately (original behavior)
    if (debounceMs === 0) {
      return executeFetch(url, init);
    }

    return new Promise((resolve, reject) => {
      // If there's a pending call that hasn't executed yet, resolve it with null (it's being superseded)
      if (pendingCall) {
        pendingCall.resolve(null);
      }

      // Store this call as pending
      pendingCall = {url, init, resolve, reject};

      // Leading-trailing strategy: Execute first call immediately, then wait for trailing
      if (strategy === 'leading-trailing' && !isInDebounce) {
        isInDebounce = true;
        const {url: execUrl, init: execInit, resolve: execResolve, reject: execReject} = pendingCall;
        pendingCall = null;

        // Execute immediately (leading edge)
        executeFetch(execUrl, execInit).then(execResolve).catch(execReject);

        // Start cooldown timer that will handle any trailing calls
        debounceTimeoutId = setTimeout(() => {
          isInDebounce = false;
          debounceTimeoutId = null;

          // Trailing edge: execute if there were calls during cooldown period
          if (pendingCall) {
            const {url: pendingUrl, init: pendingInit, resolve: pendingResolve, reject: pendingReject} = pendingCall;
            pendingCall = null;

            executeFetch(pendingUrl, pendingInit).then(pendingResolve).catch(pendingReject);
          }
        }, debounceMs);

        return;
      }

      // If we're in cooldown (leading-trailing middle calls), don't create new timer
      // The cooldown timer will handle executing the last pending call
      if (isInDebounce) {
        return;
      }

      // Clear existing debounce timer (for trailing-only strategy)
      if (debounceTimeoutId !== null) {
        clearTimeout(debounceTimeoutId);
      }

      // Trailing-only strategy: schedule execution
      debounceTimeoutId = setTimeout(() => {
        isInDebounce = false;
        debounceTimeoutId = null;

        if (pendingCall) {
          const {url: pendingUrl, init: pendingInit, resolve: pendingResolve, reject: pendingReject} = pendingCall;
          pendingCall = null;

          executeFetch(pendingUrl, pendingInit).then(pendingResolve).catch(pendingReject);
        }
      }, debounceMs);
    });
  };
}


