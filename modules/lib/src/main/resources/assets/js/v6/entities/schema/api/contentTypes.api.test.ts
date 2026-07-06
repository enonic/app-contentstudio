import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { type ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { setActiveProjectResolver } from '../../../shared/lib/url/cms';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchAllContentTypes, fetchContentTypesByContent } from './contentTypes.api';

vi.mock('@enonic/lib-admin-ui/schema/content/ContentTypeSummary', () => ({
    ContentTypeSummary: { fromJson: (json: unknown) => ({ typeFrom: json }) },
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
    setActiveProjectResolver(() => 'test-project');
});

afterEach(() => {
    restoreFetch();
    setActiveProjectResolver(() => undefined);
});

describe('fetchAllContentTypes', () => {
    it('should GET the non-project schema endpoint and parse the content types', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentTypes: [{ name: 'my:type' }] }));

        const result = await fetchAllContentTypes();

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/schema/content/all');
        expect(url).not.toContain('/cms/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ typeFrom: { name: 'my:type' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchAllContentTypes();

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('fetchContentTypesByContent', () => {
    it('should GET the project-scoped byContent endpoint with the content id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ contentTypes: [{ name: 'my:type' }] }));

        const result = await fetchContentTypesByContent(contentId('c-1'));

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/rest-v2/cs/cms/test-project/content/schema/content/byContent?contentId=c-1');
        expect(url).not.toContain('/content/content/');
        expect(init.method).toBe('GET');
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([{ typeFrom: { name: 'my:type' } }]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContentTypesByContent(contentId('c-1'));

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
