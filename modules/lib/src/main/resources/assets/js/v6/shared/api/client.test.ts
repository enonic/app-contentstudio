import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppError } from './errors';
import { requestHead, requestJson, requestOptionalJson } from './client';

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

describe('requestJson', () => {
    it('should resolve with parsed JSON on success', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: '123' }));

        const result = await requestJson<{ id: string }>('/api/test');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ id: '123' });
        expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ method: 'GET' }));
    });

    it('should send a JSON body with headers when body is provided', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ ok: true }));

        await requestJson('/api/test', { method: 'POST', body: { key: 'value' } });

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/test',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'value' }),
            }),
        );
    });

    it('should return AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

        const result = await requestJson('/api/test');

        expect(result.isErr()).toBe(true);
        const error = result._unsafeUnwrapErr();
        expect(error).toBeInstanceOf(AppError);
        expect(error.message).toBe('Not Found');
    });

    it('should return AppError with status fallback when statusText is empty', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 500 }));

        const result = await requestJson('/api/test');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe('Request failed with status 500');
    });

    it('should surface a server-provided error message from the response body', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ message: 'Content is locked' }, { status: 409, statusText: 'Conflict' }),
        );

        const result = await requestJson('/api/test');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe('Content is locked');
    });

    it('should fall back to status text when the error body has no message', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ error: 'nope' }, { status: 400, statusText: 'Bad Request' }));

        const result = await requestJson('/api/test');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe('Bad Request');
    });

    it('should return AppError on network failure', async () => {
        mockFetch.mockRejectedValue(new TypeError('Failed to fetch'));

        const result = await requestJson('/api/test');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('requestOptionalJson', () => {
    it('should resolve with parsed JSON on success', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: '123' }));

        const result = await requestOptionalJson<{ id: string }>('/api/test');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ id: '123' });
    });

    it('should resolve with undefined on HTTP 204', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

        const result = await requestOptionalJson('/api/test');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should resolve with undefined on null JSON body', async () => {
        mockFetch.mockResolvedValue(jsonResponse(null));

        const result = await requestOptionalJson('/api/test');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(new Response(null, { status: 403, statusText: 'Forbidden' }));

        const result = await requestOptionalJson('/api/test');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr().message).toBe('Forbidden');
    });
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
