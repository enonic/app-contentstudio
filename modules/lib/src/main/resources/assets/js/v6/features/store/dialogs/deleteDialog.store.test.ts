import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import { emitContentArchived, emitContentDeleted, emitContentUpdated } from '../../../shared/socket/socket.store';
import {
    $deleteDialog,
    $deleteInboundIds,
    $deleteItemsCount,
    $hasMoreDeleteDependants,
    loadMoreDeleteDependants,
    openDeleteDialog,
    resetDeleteDialogContext,
} from './deleteDialog.store';
import {
    createMockChangeItem,
    createMockContent,
    flushDebouncedReload as flushDelayedReload,
    flushPromises,
} from './dialog.store.test.utils';

const { mockFetchContentSummaries, mockResolveForDelete, mockArchiveContent, mockCleanupTask, mockTrackTask } =
    vi.hoisted(() => ({
        mockFetchContentSummaries: vi.fn(),
        mockResolveForDelete: vi.fn(),
        mockArchiveContent: vi.fn(),
        mockCleanupTask: vi.fn(),
        mockTrackTask: vi.fn(),
    }));

vi.mock('../../api/content', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../api/delete', () => ({
    resolveForDelete: mockResolveForDelete,
    archiveContent: mockArchiveContent,
}));

vi.mock('../../services/task.service', () => ({
    cleanupTask: mockCleanupTask,
    trackTask: mockTrackTask,
}));

type InboundSpec = { target: string; sources: string[] };

// Mimics ContentWithRefsResult: getContentIds() + getInboundDependencies(),
// where each inbound dependency carries the target id and its referencing source ids.
function createDeleteResolveResult(contentIds: string[], inbound: InboundSpec[] = []) {
    return {
        getContentIds: () => contentIds.map((id) => new ContentId(id)),
        getInboundDependencies: () =>
            inbound.map(({ target, sources }) => ({
                getId: () => new ContentId(target),
                getInboundDependencies: () => sources.map((id) => new ContentId(id)),
            })),
        hasInboundDependencies: () => inbound.length > 0,
        hasInboundDependency: (id: string) => inbound.some((dep) => dep.target === id),
    };
}

async function flushInitialReload(): Promise<void> {
    await flushPromises(10);
}

async function flushDebouncedReload(): Promise<void> {
    await flushDelayedReload(100);
}

const referenceRemovalEventCases = [
    {
        name: 'updated',
        emit: (ids: string[]) => emitContentUpdated(ids.map((id) => createMockContent(id))),
    },
    {
        name: 'deleted',
        emit: (ids: string[]) => emitContentDeleted(ids.map(createMockChangeItem)),
    },
    {
        name: 'archived',
        emit: (ids: string[]) => emitContentArchived(ids.map(createMockChangeItem)),
    },
] as const;

describe('deleteDialog.store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetDeleteDialogContext();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockArchiveContent.mockReset();
        mockCleanupTask.mockReset();
        mockTrackTask.mockReset();
        mockResolveForDelete.mockReset().mockResolvedValue(createDeleteResolveResult([]));
    });

    afterEach(() => {
        resetDeleteDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it.each(referenceRemovalEventCases)(
        'clears the inbound reference when the referencing content is $name externally',
        async ({ emit }) => {
            const item = createMockContent('item-1');

            mockResolveForDelete
                .mockResolvedValueOnce(
                    createDeleteResolveResult(['item-1'], [{ target: 'item-1', sources: ['ref-1'] }]),
                )
                .mockResolvedValueOnce(createDeleteResolveResult(['item-1'], []));

            openDeleteDialog([item]);
            await flushInitialReload();

            expect($deleteInboundIds.get()).toEqual(['item-1']);

            // The referencing content (not a dialog item or dependant) drops the reference.
            emit(['ref-1']);
            await flushDebouncedReload();

            expect($deleteInboundIds.get()).toEqual([]);
            expect(mockResolveForDelete).toHaveBeenCalledTimes(2);
        },
    );

    it('does not reload when an unrelated content is updated externally', async () => {
        const item = createMockContent('item-1');

        mockResolveForDelete.mockResolvedValue(
            createDeleteResolveResult(['item-1'], [{ target: 'item-1', sources: ['ref-1'] }]),
        );

        openDeleteDialog([item]);
        await flushInitialReload();

        expect(mockResolveForDelete).toHaveBeenCalledTimes(1);

        emitContentUpdated([createMockContent('unrelated-1')]);
        await flushDebouncedReload();

        expect($deleteInboundIds.get()).toEqual(['item-1']);
        expect(mockResolveForDelete).toHaveBeenCalledTimes(1);
    });

    it('loads dependant summaries in windows while counting all by id', async () => {
        const item = createMockContent('item-1');
        const dependantIds = Array.from({ length: 40 }, (_, index) => `dep-${index}`);

        mockResolveForDelete.mockResolvedValue(createDeleteResolveResult(['item-1', ...dependantIds]));
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            Promise.resolve(ids.map((id) => createMockContent(id.toString()))),
        );

        openDeleteDialog([item]);
        await flushInitialReload();

        // Only the first window of summaries is loaded...
        expect($deleteDialog.get().dependants).toHaveLength(36);
        expect($hasMoreDeleteDependants.get()).toBe(true);

        // ...but the count is id-based: 1 main + 40 dependants.
        expect($deleteItemsCount.get()).toBe(41);

        await loadMoreDeleteDependants();
        await flushPromises();

        expect($deleteDialog.get().dependants).toHaveLength(40);
        expect($hasMoreDeleteDependants.get()).toBe(false);
        expect($deleteItemsCount.get()).toBe(41);
    });
});
