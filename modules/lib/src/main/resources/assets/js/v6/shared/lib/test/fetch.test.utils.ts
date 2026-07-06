import { vi, type Mock } from 'vitest';

//
// * Fetch stubbing for `*.api.test.ts`
//
// The api layer's only side effect is `fetch`, so pinning its URL and payload is
// the regression guard for every request migrated to the Result client. Pair
// `stubFetch()` in `beforeEach` with `restoreFetch()` in `afterEach`.
//

/** JSON 200 `Response` for a stubbed `fetch`. */
export const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

/** Empty error `Response` for a stubbed `fetch` (non-ok paths). */
export const errorResponse = (status: number, statusText?: string): Response =>
    new Response(null, { status, statusText });

/** Stub the global `fetch` with a fresh mock and return it. */
export function stubFetch(): Mock {
    const mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
    return mockFetch;
}

/** Restore the real `fetch`, undoing `stubFetch()`. */
export function restoreFetch(): void {
    vi.unstubAllGlobals();
}
