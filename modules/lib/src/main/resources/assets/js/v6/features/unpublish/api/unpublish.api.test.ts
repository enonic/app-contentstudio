import { describe, it, expect, beforeEach, afterEach, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { resolveUnpublish, unpublishContent } from './unpublish.api';

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('resolveUnpublish', () => {
    it('should POST content ids and parse the result', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({ contentIds: [{ id: 'c-1' }, { id: 'c-2' }], inboundDependencies: [] }),
        );

        const result = await resolveUnpublish([contentId('c-1'), contentId('c-2')]);

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().contentIds.map((id) => id.toString())).toEqual(['c-1', 'c-2']);
        expect(result._unsafeUnwrap().inboundDependencies).toEqual([]);
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/resolveForUnpublish');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['c-1', 'c-2'] }),
        });
    });

    it('should map inbound dependencies with their sources', async () => {
        mockFetch.mockResolvedValue(
            jsonResponse({
                contentIds: [],
                inboundDependencies: [{ id: { id: 't-1' }, inboundDependencies: [{ id: 's-1' }] }],
            }),
        );

        const result = await resolveUnpublish([contentId('t-1')]);

        expect(result.isOk()).toBe(true);
        const inbound = result._unsafeUnwrap().inboundDependencies;
        expect(inbound).toHaveLength(1);
        expect(inbound[0]?.id.toString()).toBe('t-1');
        expect(inbound[0]?.inboundDependencies.map((id) => id.toString())).toEqual(['s-1']);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await resolveUnpublish([contentId('c-1')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('unpublishContent', () => {
    it('should POST ids and default includeChildren to true', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-unpub' }));

        const result = await unpublishContent({ contentIds: [contentId('a'), contentId('b')] });

        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-unpub');
        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/unpublish');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ ids: ['a', 'b'], includeChildren: true }),
        });
    });

    it('should honor an explicit includeChildren flag', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-unpub' }));

        await unpublishContent({ contentIds: [contentId('a')], includeChildren: false });

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ ids: ['a'], includeChildren: false }));
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(404, 'Not Found'));

        const result = await unpublishContent({ contentIds: [contentId('a')] });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
