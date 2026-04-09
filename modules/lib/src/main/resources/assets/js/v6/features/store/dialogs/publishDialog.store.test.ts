import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ContentId} from '../../../../app/content/ContentId';
import {
    emitContentArchived,
    emitContentCreated,
    emitContentDeleted,
    emitContentPublished,
    emitContentRenamed,
    emitContentUpdated,
} from '../socket.store';
import {
    $dependantPublishItems,
    $isPublishReady,
    $publishCheckErrors,
    $publishDialog,
    $publishDialogPending,
    openPublishDialog,
    resetPublishDialogContext,
} from './publishDialog.store';
import {
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushDebouncedReload as flushDelayedReload,
    flushPromises,
} from './dialog.store.test.utils';

const {
    mockFetchContentSummaries,
    mockHasUnpublishedChildren,
    mockFindIdsByParents,
    mockMarkAsReady,
    mockPublishContent,
    mockResolvePublishDependencies,
    mockCleanupTask,
    mockTrackTask,
    mockCompareContent,
} = vi.hoisted(() => ({
    mockFetchContentSummaries: vi.fn(),
    mockHasUnpublishedChildren: vi.fn(),
    mockFindIdsByParents: vi.fn(),
    mockMarkAsReady: vi.fn(),
    mockPublishContent: vi.fn(),
    mockResolvePublishDependencies: vi.fn(),
    mockCleanupTask: vi.fn(),
    mockTrackTask: vi.fn(),
    mockCompareContent: vi.fn(),
}));

vi.mock('../../api/content', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../api/compare', () => ({
    compareContent: mockCompareContent,
}));

vi.mock('../../api/hasUnpublishedChildren', () => ({
    hasUnpublishedChildren: mockHasUnpublishedChildren,
}));

vi.mock('../../api/publish', () => ({
    findIdsByParents: mockFindIdsByParents,
    markAsReady: mockMarkAsReady,
    publishContent: mockPublishContent,
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../services/task.service', () => ({
    cleanupTask: mockCleanupTask,
    trackTask: mockTrackTask,
}));

async function flushInitialReload(): Promise<void> {
    await flushPromises(10);
}

async function flushDebouncedReload(): Promise<void> {
    await flushDelayedReload(150);
}

const publishRemovalEventCases = [
    {
        name: 'deleted',
        emit: (ids: string[]) => emitContentDeleted(ids.map(createMockChangeItem)),
    },
    {
        name: 'archived',
        emit: (ids: string[]) => emitContentArchived(ids.map(createMockChangeItem)),
    },
] as const;

describe('publishDialog.store', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        resetPublishDialogContext();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockHasUnpublishedChildren.mockReset().mockResolvedValue(new Map());
        mockCompareContent.mockReset().mockResolvedValue(new Map());
        mockFindIdsByParents.mockReset().mockResolvedValue([]);
        mockMarkAsReady.mockReset();
        mockPublishContent.mockReset();
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
    });

    afterEach(() => {
        resetPublishDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('reloads publish checks when a tracked main item is updated externally', async () => {
        const itemId = new ContentId('item-1');
        const original = createMockContent('item-1', {displayName: 'Original name'});
        const updated = createMockContent('item-1', {displayName: 'Updated name'});

        mockResolvePublishDependencies
            .mockResolvedValueOnce(createResolveResult({inProgress: [itemId]}))
            .mockResolvedValueOnce(createResolveResult({inProgress: [itemId]}))
            .mockResolvedValueOnce(createResolveResult({}))
            .mockResolvedValueOnce(createResolveResult({}));

        openPublishDialog([original]);
        await flushInitialReload();

        expect($publishCheckErrors.get().inProgress.count).toBe(1);
        expect($isPublishReady.get()).toBe(false);

        emitContentUpdated([updated]);

        expect($publishDialog.get().items[0].getDisplayName()).toBe('Updated name');

        await flushDebouncedReload();

        expect($publishCheckErrors.get().inProgress.count).toBe(0);
        expect($isPublishReady.get()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(4);
    });

    it('patches renamed tracked items without forcing a dependency reload', async () => {
        const dependantId = new ContentId('dep-1');
        const mainOriginal = createMockContent('item-1', {displayName: 'Original main'});
        const mainRenamed = createMockContent('item-1', {displayName: 'Renamed main'});
        const dependantOriginal = createMockContent('dep-1', {displayName: 'Original dependant'});
        const dependantRenamed = createMockContent('dep-1', {displayName: 'Renamed dependant'});

        mockResolvePublishDependencies.mockImplementation(() => {
            return createResolveResult({dependants: [dependantId]});
        });
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.equals(dependantId)) ? [dependantOriginal] : [];
        });

        openPublishDialog([mainOriginal]);
        await flushInitialReload();

        expect($dependantPublishItems.get()[0].content.getDisplayName()).toBe('Original dependant');

        emitContentRenamed([mainRenamed, dependantRenamed], []);

        expect($publishDialog.get().items[0].getDisplayName()).toBe('Renamed main');
        expect($dependantPublishItems.get()[0].content.getDisplayName()).toBe('Renamed dependant');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it('refreshes main items when created content is below a selected main item path', async () => {
        const parent = createMockContent('item-1', {displayName: 'Parent', path: '/parent'});
        const updatedParent = createMockContent('item-1', {displayName: 'Parent', path: '/parent', hasChildren: true});
        const unrelated = createMockContent('item-2', {displayName: 'Elsewhere', path: '/other/child'});
        const child = createMockContent('item-3', {displayName: 'Child', path: '/parent/child'});

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some(id => id.toString() === 'item-1') ? [updatedParent] : [];
        });

        openPublishDialog([parent]);
        await flushInitialReload();

        emitContentCreated([unrelated]);
        await flushDebouncedReload();

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        expect($publishDialog.get().items[0].hasChildren()).toBe(false);

        emitContentCreated([child]);
        await flushDebouncedReload();

        expect($publishDialog.get().items[0].hasChildren()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(4);
    });

    it.each(publishRemovalEventCases)(
        'removes a non-last main item and reloads on $name events',
        async ({emit}) => {
            const first = createMockContent('item-1', {displayName: 'First'});
            const second = createMockContent('item-2', {displayName: 'Second'});

            openPublishDialog([first, second]);
            await flushInitialReload();

            emit(['item-1']);
            await flushDebouncedReload();

            expect($publishDialog.get().open).toBe(true);
            expect($publishDialog.get().items.map(item => item.getId())).toEqual(['item-2']);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(4);
        },
    );

    it('reloads when only some main items are published', async () => {
        const first = createMockContent('item-1', {displayName: 'First'});
        const second = createMockContent('item-2', {displayName: 'Second'});

        openPublishDialog([first, second]);
        await flushInitialReload();

        emitContentPublished([first]);
        await flushDebouncedReload();

        expect($publishDialog.get().open).toBe(true);
        expect($publishDialog.get().items.map(item => item.getId())).toEqual(['item-1', 'item-2']);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(4);
    });

    it.each([
        ...publishRemovalEventCases,
        {
            name: 'published',
            emit: (ids: string[]) => emitContentPublished(ids.map(id => createMockContent(id))),
        },
    ])(
        'closes the dialog when the last main item is affected by $name events',
        async ({emit}) => {
            const item = createMockContent('item-1', {displayName: 'Item'});

            openPublishDialog([item]);
            await flushInitialReload();

            emit(['item-1']);
            await flushDebouncedReload();

            expect($publishDialog.get().open).toBe(false);
            expect($publishDialog.get().items).toEqual([]);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        },
    );

    it('ignores published events while submitting', async () => {
        const item = createMockContent('item-1', {displayName: 'Item'});

        openPublishDialog([item]);
        await flushInitialReload();

        $publishDialogPending.set({
            ...$publishDialogPending.get(),
            submitting: true,
        });

        emitContentPublished([item]);
        await flushDebouncedReload();

        expect($publishDialog.get().open).toBe(true);
        expect($publishDialog.get().items.map(currentItem => currentItem.getId())).toEqual(['item-1']);
        expect($publishDialogPending.get().submitting).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });
});
