import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppError } from '@enonic/ui-utils';
import { requestHead } from './client';

const mockFetch = vi.fn();

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
});

describe('requestHead', () => {
    it('should send a HEAD request that includes cookies and forwards the signal', async () => {
        const controller = new AbortController();
        mockFetch.mockResolvedValue(new Response(null, { status: 200 }));

        await requestHead('/api/probe', { signal: controller.signal });

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/probe',
            expect.objectContaining({ method: 'HEAD', credentials: 'include', signal: controller.signal }),
        );
    });

    it('should resolve with non-ok responses so callers can read status and headers', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 418, headers: { 'x-data': '1' } }));

        const result = await requestHead('/api/probe');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().status).toBe(418);
        expect(result._unsafeUnwrap().headers.get('x-data')).toBe('1');
    });

    it('should return AppError when no response arrives', async () => {
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

        const result = await requestHead('/api/probe');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
