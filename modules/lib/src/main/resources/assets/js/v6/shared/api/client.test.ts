import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppError } from './errors';
import { requestJson, requestOptionalJson } from './client';

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
