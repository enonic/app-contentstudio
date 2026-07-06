import { ok } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { emitContentDeleted, emitContentUpdated } from '../../../shared/socket/socket.store';
import { start as startUnpublishDialogService } from './unpublishDialog.service';
import {
    $hasMoreUnpublishDependants,
    $unpublishDialog,
    $unpublishInboundIds,
    $unpublishItemsCount,
    loadMoreUnpublishDependants,
    openUnpublishDialog,
    resetUnpublishDialogContext,
} from './unpublishDialog.store';
import {
    createMockChangeItem,
    createMockContent,
    flushDebouncedReload as flushDelayedReload,
    flushPromises,
} from '../../../shared/lib/test/dialog.store.test.utils';

const { mockFetchContentSummaries, mockResolveUnpublish, mockUnpublishContent, mockCleanupTask, mockTrackTask } =
    vi.hoisted(() => ({
        mockFetchContentSummaries: vi.fn(),
        mockResolveUnpublish: vi.fn(),
        mockUnpublishContent: vi.fn(),
        mockCleanupTask: vi.fn(),
        mockTrackTask: vi.fn(),
    }));

vi.mock('../../../entities/content/lib/contentSummaries', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../api/unpublish.api', () => ({
    resolveUnpublish: mockResolveUnpublish,
    unpublishContent: mockUnpublishContent,
}));

vi.mock('../../../entities/task/task.service', () => ({
    cleanupTask: mockCleanupTask,
    trackTask: mockTrackTask,
}));

type InboundSpec = { target: string; sources: string[] };

function createUnpublishResolveResult(contentIds: string[], inbound: InboundSpec[] = []) {
    return {
        contentIds: contentIds.map((id) => new ContentId(id)),
        inboundDependencies: inbound.map(({ target, sources }) => ({
            id: new ContentId(target),
            inboundDependencies: sources.map((id) => new ContentId(id)),
        })),
    };
}

async function flushInitialReload(): Promise<void> {
    await flushPromises(10);
}

async function flushDebouncedReload(): Promise<void> {
    await flushDelayedReload(100);
}

describe('unpublishDialog.store', () => {
    beforeEach(() => {
        startUnpublishDialogService();
        vi.useFakeTimers();
        resetUnpublishDialogContext();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockUnpublishContent.mockReset();
        mockCleanupTask.mockReset();
        mockTrackTask.mockReset();
        mockResolveUnpublish.mockReset().mockResolvedValue(ok(createUnpublishResolveResult([])));
    });

    afterEach(() => {
        resetUnpublishDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('loads dependant summaries in windows while counting all by id', async () => {
        const item = createMockContent('item-1');
        const dependantIds = Array.from({ length: 40 }, (_, index) => `dep-${index}`);

        mockResolveUnpublish.mockResolvedValue(ok(createUnpublishResolveResult(['item-1', ...dependantIds])));
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            Promise.resolve(ids.map((id) => createMockContent(id.toString()))),
        );

        openUnpublishDialog([item]);
        await flushInitialReload();

        expect($unpublishDialog.get().dependants).toHaveLength(36);
        expect($hasMoreUnpublishDependants.get()).toBe(true);

        expect($unpublishItemsCount.get()).toBe(41);

        await loadMoreUnpublishDependants();
        await flushPromises();

        expect($unpublishDialog.get().dependants).toHaveLength(40);
        expect($hasMoreUnpublishDependants.get()).toBe(false);
        expect($unpublishItemsCount.get()).toBe(41);
    });

    it('keeps the count live when a dependant beyond the loaded window is removed externally', async () => {
        const item = createMockContent('item-1');
        const dependantIds = Array.from({ length: 40 }, (_, index) => `dep-${index}`);

        mockResolveUnpublish.mockResolvedValue(ok(createUnpublishResolveResult(['item-1', ...dependantIds])));
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            Promise.resolve(ids.map((id) => createMockContent(id.toString()))),
        );

        openUnpublishDialog([item]);
        await flushInitialReload();

        expect($unpublishItemsCount.get()).toBe(41);

        emitContentDeleted([createMockChangeItem('dep-39')]);
        await flushDebouncedReload();

        expect($unpublishItemsCount.get()).toBe(40);
    });

    it('orders inbound dependants first so they land in the first window', async () => {
        const item = createMockContent('item-1');
        const dependantIds = Array.from({ length: 40 }, (_, index) => `dep-${index}`);

        mockResolveUnpublish.mockResolvedValue(
            ok(createUnpublishResolveResult(['item-1', ...dependantIds], [{ target: 'dep-39', sources: ['ref-1'] }])),
        );
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            Promise.resolve(ids.map((id) => createMockContent(id.toString()))),
        );

        openUnpublishDialog([item]);
        await flushInitialReload();

        expect($unpublishInboundIds.get()).toEqual(['dep-39']);
        expect($unpublishDialog.get().dependants[0]?.getContentId().toString()).toBe('dep-39');
    });

    it('does not reload when an unrelated content is updated externally', async () => {
        const item = createMockContent('item-1');

        mockResolveUnpublish.mockResolvedValue(ok(createUnpublishResolveResult(['item-1'])));

        openUnpublishDialog([item]);
        await flushInitialReload();

        expect(mockResolveUnpublish).toHaveBeenCalledTimes(1);

        emitContentUpdated([createMockContent('unrelated-1')]);
        await flushDebouncedReload();

        expect(mockResolveUnpublish).toHaveBeenCalledTimes(1);
    });
});
