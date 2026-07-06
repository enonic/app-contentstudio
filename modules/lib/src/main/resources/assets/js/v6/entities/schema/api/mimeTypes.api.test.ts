import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { clearMimeTypesCache, fetchMimeTypesByContentTypeNames } from './mimeTypes.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    clearMimeTypesCache();
});

afterEach(() => {
    restoreFetch();
});

describe('fetchMimeTypesByContentTypeNames', () => {
    it('should GET the mime types endpoint with sorted comma-joined type names', async () => {
        mockFetch.mockResolvedValue(jsonResponse(['image/png', 'image/jpeg']));

        const result = await fetchMimeTypesByContentTypeNames(['media:video', 'media:image']);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/schema/content/getMimeTypes?typeNames=media%3Aimage%2Cmedia%3Avideo');
        expect(url).not.toContain('/cms/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual(['image/png', 'image/jpeg']);
    });

    it('should serve repeated lookups for the same names from the cache', async () => {
        mockFetch.mockResolvedValue(jsonResponse(['image/png']));

        await fetchMimeTypesByContentTypeNames(['media:image']);
        const result = await fetchMimeTypesByContentTypeNames(['media:image']);

        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(result._unsafeUnwrap()).toEqual(['image/png']);
    });

    it('should refetch after an error instead of caching the failure', async () => {
        mockFetch.mockResolvedValueOnce(errorResponse(500, 'Server Error'));
        mockFetch.mockResolvedValueOnce(jsonResponse(['image/png']));

        const first = await fetchMimeTypesByContentTypeNames(['media:image']);
        const second = await fetchMimeTypesByContentTypeNames(['media:image']);

        expect(first.isErr()).toBe(true);
        expect(first._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(second.isOk()).toBe(true);
        expect(mockFetch).toHaveBeenCalledTimes(2);
    });
});
