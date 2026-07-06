import { describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentPath } from '../../../../app/content/ContentPath';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { archiveContent, deleteContent, resolveForDelete } from './delete.api';

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;
const contentPath = (p: string): ContentPath => ({ toString: () => p }) as ContentPath;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('archiveContent', () => {
    it('should POST to the archive endpoint with content ids and a null message by default', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-archive' }));

        const result = await archiveContent([contentId('a'), contentId('b')]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-archive');
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/archive/archive');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['a', 'b'], message: null }),
        });
    });

    it('should trim the message and send it in the payload', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-archive' }));

        await archiveContent([contentId('a')], '  cleanup  ');

        const [, init] = mockFetch.mock.calls[0];
        expect(init).toMatchObject({ body: JSON.stringify({ contentIds: ['a'], message: 'cleanup' }) });
    });

    it('should return an AppError without calling fetch when there is no content', async () => {
        const result = await archiveContent([]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(result._unsafeUnwrapErr().message).toBe('No content to archive');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await archiveContent([contentId('a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('deleteContent', () => {
    it('should POST to the delete endpoint with content paths', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-delete' }));

        const result = await deleteContent([contentPath('/a'), contentPath('/b')]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-delete');
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/delete');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentPaths: ['/a', '/b'] }),
        });
    });

    it('should return an AppError without calling fetch when there is no content', async () => {
        const result = await deleteContent([]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(result._unsafeUnwrapErr().message).toBe('No content to delete');
        expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await deleteContent([contentPath('/a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('resolveForDelete', () => {
    it('should POST to the resolveForDelete endpoint and parse the result', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ contentIds: [{ id: 'c-1' }, { id: 'c-2' }], inboundDependencies: [] }),
        );

        const result = await resolveForDelete([contentId('c-1'), contentId('c-2')]);

        expect(result.isOk()).toBe(true);
        expect(
            result
                ._unsafeUnwrap()
                .getContentIds()
                .map((id) => id.toString()),
        ).toEqual(['c-1', 'c-2']);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/resolveForDelete');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['c-1', 'c-2'] }),
        });
    });

    it('should return an AppError without calling fetch when there are no content ids', async () => {
        const result = await resolveForDelete([]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(result._unsafeUnwrapErr().message).toBe('No content IDs provided');
        expect(mockFetch).not.toHaveBeenCalled();
    });
});
