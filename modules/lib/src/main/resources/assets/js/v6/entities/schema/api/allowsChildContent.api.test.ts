import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { clearAllowsChildContentCache, fetchAllowsChildContent } from './allowsChildContent.api';

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    clearAllowsChildContentCache();
});

afterEach(() => {
    restoreFetch();
});

describe('fetchAllowsChildContent', () => {
    it('should request the content type by name', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ name: 'base:folder', allowChildContent: true }));

        const result = await fetchAllowsChildContent('base:folder');

        expect(mockFetch.mock.calls[0][0]).toContain('/rest-v2/cs/schema/content?name=base%3Afolder');
        expect(result._unsafeUnwrap()).toBe(true);
    });

    it('should answer repeated calls from the cache until it is cleared', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ allowChildContent: false }));

        await fetchAllowsChildContent('media:image');
        const cached = await fetchAllowsChildContent('media:image');

        expect(cached._unsafeUnwrap()).toBe(false);
        expect(mockFetch).toHaveBeenCalledTimes(1);

        clearAllowsChildContentCache();
        await fetchAllowsChildContent('media:image');

        expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should not cache a failed response', async () => {
        mockFetch.mockResolvedValue(errorResponse(404));

        const result = await fetchAllowsChildContent('app:missing');

        expect(result.isErr()).toBe(true);

        mockFetch.mockResolvedValue(jsonResponse({ allowChildContent: true }));
        const retried = await fetchAllowsChildContent('app:missing');

        expect(retried._unsafeUnwrap()).toBe(true);
    });
});
