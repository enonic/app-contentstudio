import { afterEach, beforeEach, describe, expect, it, type Mock } from 'vitest';
import type { ContentId } from '../../../../app/content/ContentId';
import { AppError } from '../../../shared/api/errors';
import { errorResponse, jsonResponse, restoreFetch, stubFetch } from '../../../shared/lib/test/fetch.test.utils';
import { findIdsByParents, markAsReady, publishContent, resolvePublishDependencies } from './publish.api';

const contentId = (id: string): ContentId => ({ toString: () => id }) as ContentId;

let mockFetch: Mock;

beforeEach(() => {
    mockFetch = stubFetch();
});

afterEach(() => {
    restoreFetch();
});

describe('findIdsByParents', () => {
    it('should POST parent ids to the findIdsByParents endpoint and parse the child ids', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ ids: [{ id: 'child-1' }, { id: 'child-2' }] }));

        const result = await findIdsByParents([contentId('parent-1')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/findIdsByParents');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['parent-1'] }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().map((id) => id.toString())).toEqual(['child-1', 'child-2']);
    });

    it('should short-circuit to an empty list without fetching for empty input', async () => {
        const result = await findIdsByParents([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toEqual([]);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await findIdsByParents([contentId('parent-1')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('markAsReady', () => {
    it('should POST content ids to the markAsReady endpoint and resolve to void', async () => {
        mockFetch.mockResolvedValue(jsonResponse({}));

        const result = await markAsReady([contentId('a'), contentId('b')]);

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/markAsReady');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ contentIds: ['a', 'b'] }),
        });
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should short-circuit without fetching for empty input', async () => {
        const result = await markAsReady([]);

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap()).toBeUndefined();
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await markAsReady([contentId('a')]);

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('publishContent', () => {
    it('should POST the default payload to the publish endpoint and parse the task id', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-pub' }));

        const result = await publishContent({ ids: [contentId('a')] });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/publish');
        expect(init.method).toBe('POST');
        expect(init.body).toBe(JSON.stringify({ ids: ['a'], excludedIds: [], excludeChildrenIds: [], schedule: null }));
        expect(result.isOk()).toBe(true);
        expect(result._unsafeUnwrap().toString()).toBe('t-pub');
    });

    it('should serialize exclusions, schedule, and message into the payload', async () => {
        mockFetch.mockResolvedValue(jsonResponse({ taskId: 't-pub' }));

        await publishContent({
            ids: [contentId('a')],
            excludedIds: [contentId('b')],
            excludeChildrenIds: [contentId('c')],
            message: 'hi',
            schedule: {
                from: new Date('2030-01-01T00:00:00.000Z'),
                to: new Date('2030-02-01T00:00:00.000Z'),
            },
        });

        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(
            JSON.stringify({
                ids: ['a'],
                excludedIds: ['b'],
                excludeChildrenIds: ['c'],
                schedule: { from: '2030-01-01T00:00:00.000Z', to: '2030-02-01T00:00:00.000Z' },
                message: 'hi',
            }),
        );
    });

    it('should error without fetching when there is no content to publish', async () => {
        const result = await publishContent({ ids: [] });

        expect(mockFetch).not.toHaveBeenCalled();
        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
        expect(result._unsafeUnwrapErr().message).toBe('No content to publish');
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await publishContent({ ids: [contentId('a')] });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});

describe('resolvePublishDependencies', () => {
    const fullResultJson = (dependantIds: string[] = []) => ({
        dependentContents: dependantIds.map((id) => ({ id })),
        requestedContents: [],
        requiredContents: [],
        publishableContents: [],
        containsInvalid: false,
        notPublishableContents: [],
        somePublishable: false,
        schedulable: false,
        invalidContents: [],
        notReadyContents: [],
        nextDependentContents: [],
        notFoundOutboundContents: [],
    });

    it('should POST ids and exclusions to resolvePublishContent and parse the result', async () => {
        mockFetch.mockResolvedValue(jsonResponse(fullResultJson(['dep-1'])));

        const result = await resolvePublishDependencies({ ids: [contentId('a')] });

        const [url, init] = mockFetch.mock.calls[0];
        expect(url).toContain('/content/content/resolvePublishContent');
        expect(init).toMatchObject({
            method: 'POST',
            body: JSON.stringify({ ids: ['a'], excludedIds: [], excludeChildrenIds: [] }),
        });
        expect(result.isOk()).toBe(true);
        expect(
            result
                ._unsafeUnwrap()
                .getDependants()
                .map((id) => id.toString()),
        ).toEqual(['dep-1']);
    });

    it('should still POST for empty ids (no empty-input short-circuit)', async () => {
        mockFetch.mockResolvedValue(jsonResponse(fullResultJson()));

        const result = await resolvePublishDependencies({ ids: [] });

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [, init] = mockFetch.mock.calls[0];
        expect(init.body).toBe(JSON.stringify({ ids: [], excludedIds: [], excludeChildrenIds: [] }));
        expect(result.isOk()).toBe(true);
    });

    it('should return an AppError for non-ok responses', async () => {
        mockFetch.mockResolvedValue(errorResponse(500, 'Server Error'));

        const result = await resolvePublishDependencies({ ids: [contentId('a')] });

        expect(result.isErr()).toBe(true);
        expect(result._unsafeUnwrapErr()).toBeInstanceOf(AppError);
    });
});
