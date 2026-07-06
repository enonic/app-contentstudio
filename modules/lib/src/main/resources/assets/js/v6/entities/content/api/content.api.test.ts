import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { fetchContentById, fetchContentByPath, fetchNearestSite } from './content.api';

const { mockParseContent } = vi.hoisted(() => ({
    mockParseContent: vi.fn((json: { id: string }) => ({ parsedId: json.id })),
}));

vi.mock('../lib/parseContent', () => ({
    parseContent: mockParseContent,
}));

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
    mockParseContent.mockClear();
});

describe('fetchContentById', () => {
    it('should fetch by id and parse the content', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'abc' }));

        const result = await fetchContentById('abc');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ parsedId: 'abc' });
        const [url] = mockFetch.mock.calls[0];
        expect(url).toContain('?id=abc');
    });

    it('should return AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await fetchContentById('missing');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(mockParseContent).not.toHaveBeenCalled();
    });
});

describe('fetchContentByPath', () => {
    it('should GET the bypath endpoint with the encoded path', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'by-path' }));

        const result = await fetchContentByPath('/site/page');

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ parsedId: 'by-path' });
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/bypath?path=%2Fsite%2Fpage');
        expect(init.method).toBe('GET');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await fetchContentByPath('/missing');

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(mockParseContent).not.toHaveBeenCalled();
    });
});

describe('fetchNearestSite', () => {
    it('should post the content id and parse the site', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ id: 'site-1' }));

        const result = await fetchNearestSite(contentId('child-1'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual({ parsedId: 'site-1' });
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('nearestSite');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentId: 'child-1' }),
        });
    });

    it('should resolve with undefined when there is no nearest site (HTTP 204)', async () => {
        mockFetch.mockResolvedValue(errorResponse(204));

        const result = await fetchNearestSite(contentId('orphan'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
        expect(mockParseContent).not.toHaveBeenCalled();
    });
});
