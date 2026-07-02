import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ContentId } from '../../../app/content/ContentId';
import { AppError } from '../../shared/api/errors';
import { fetchContentById, fetchNearestSite } from './content';

const { mockParseContent } = vi.hoisted(() => ({
    mockParseContent: vi.fn((json: { id: string }) => ({ parsedId: json.id })),
}));

vi.mock('./details', () => ({
    parseContent: mockParseContent,
}));

const mockFetch = vi.fn();

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
    new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
});

afterEach(() => {
    vi.unstubAllGlobals();
    mockFetch.mockReset();
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
        mockFetch.mockResolvedValue(new Response(null, { status: 404, statusText: 'Not Found' }));

        const result = await fetchContentById('missing');

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
        mockFetch.mockResolvedValue(new Response(null, { status: 204 }));

        const result = await fetchNearestSite(contentId('orphan'));

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
        expect(mockParseContent).not.toHaveBeenCalled();
    });
});
