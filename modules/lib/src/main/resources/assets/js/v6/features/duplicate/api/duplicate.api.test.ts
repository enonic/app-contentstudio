import { describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentPath } from '../../../../app/content/ContentPath';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { duplicateContent, getDescendantsOfContents } from './duplicate.api';

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;
const contentPath = (p: string): ContentPath => ({ toString: () => p }) as ContentPath;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('duplicateContent', () => {
    it('should POST to the duplicate endpoint with the mapped content params', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-dup' }));

        const result = await duplicateContent([{ contentId: contentId('a'), includeChildren: false }]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-dup');
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/duplicate');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contents: [{ contentId: 'a', includeChildren: false }] }),
        });
    });

    it('should pass variant, parent, and name through when provided', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-dup' }));

        await duplicateContent([
            { contentId: contentId('a'), includeChildren: true, variant: true, parent: '/site', name: 'copy' },
        ]);

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(
            JSON.stringify({
                contents: [{ contentId: 'a', includeChildren: true, variant: true, parent: '/site', name: 'copy' }],
            }),
        );
    });

    it('should return an AppError without calling fetch when there is no content', async () => {
        const result = await duplicateContent([]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(result._unsafeUnwrapErr().message).toBe('No content to duplicate');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await duplicateContent([{ contentId: contentId('a'), includeChildren: false }]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('getDescendantsOfContents', () => {
    it('should POST content paths and parse the descendant ids', async () => {
        mockFetch.mockResolvedValue(jsonResponse([{ id: 'd-1' }, { id: 'd-2' }]));

        const result = await getDescendantsOfContents([contentPath('/a'), contentPath('/b')]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((id) => id.toString())).toEqual(['d-1', 'd-2']);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/getDescendantsOfContents');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentPaths: ['/a', '/b'] }),
        });
    });

    it('should resolve with an empty array without calling fetch when there are no paths', async () => {
        const result = await getDescendantsOfContents([]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await getDescendantsOfContents([contentPath('/a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
