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
import {$config} from '../config.store';
import {
    $dependantPublishItems,
    $hasExcludedDependantItems,
    $hasMoreDependants,
    $hasSchedulableItems,
    $isPublishReady,
    $isScheduleValid,
    $publishCheckErrors,
    $publishDialog,
    $publishDialogPending,
    $scheduleFromError,
    $totalPublishableItems,
    applyDraftPublishDialogSelection,
    loadMoreDependants,
    openPublishDialog,
    resetPublishDialogContext,
    setPublishDialogDependantItemSelected,
    setPublishDialogItemWithChildrenSelected,
    setPublishSchedule,
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
        // By default treat the requested (main) items as publishable, mirroring the
        // server's publishableContents (status != EQUAL) for typical scenarios.
        mockResolvePublishDependencies.mockReset().mockImplementation(
            (params: {ids?: ContentId[]}) => createResolveResult({publishable: params?.ids ?? []}));
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

        // No dependants, so each reload makes a single resolve call (the duplicate is skipped):
        // open consumes the first result, the external-update reload the second.
        mockResolvePublishDependencies
            .mockResolvedValueOnce(createResolveResult({inProgress: [itemId], publishable: [itemId]}))
            .mockResolvedValueOnce(createResolveResult({publishable: [itemId]}));

        openPublishDialog([original]);
        await flushInitialReload();

        expect($publishCheckErrors.get().inProgress.count).toBe(1);
        expect($isPublishReady.get()).toBe(false);

        emitContentUpdated([updated]);

        expect($publishDialog.get().items[0].getDisplayName()).toBe('Updated name');

        await flushDebouncedReload();

        expect($publishCheckErrors.get().inProgress.count).toBe(0);
        expect($isPublishReady.get()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
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

        // The unrelated content is not below a selected path, so no reload happens.
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        expect($publishDialog.get().items[0].hasChildren()).toBe(false);

        emitContentCreated([child]);
        await flushDebouncedReload();

        expect($publishDialog.get().items[0].hasChildren()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
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
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
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
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
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
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        },
    );

    describe('$hasSchedulableItems', () => {
        it('should be true when at least one main item is offline', async () => {
            const offline = createMockContent('item-1', {isOnline: false});
            const online = createMockContent('item-2', {isOnline: true});

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({schedulable: true}));

            openPublishDialog([offline, online]);
            await flushInitialReload();

            expect($hasSchedulableItems.get()).toBe(true);
        });

        it('should be false when all main items are online', async () => {
            const first = createMockContent('item-1', {isOnline: true});
            const second = createMockContent('item-2', {isOnline: true});

            openPublishDialog([first, second]);
            await flushInitialReload();

            expect($hasSchedulableItems.get()).toBe(false);
        });

        it('should be true when at least one item is expired', async () => {
            const past = new Date(Date.now() - 60_000);
            const expired = createMockContent('item-1', {
                isOnline: true,
                publishFromTime: new Date(Date.now() - 120_000),
                publishToTime: past,
            });
            const online = createMockContent('item-2', {isOnline: true});

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({schedulable: true}));

            openPublishDialog([expired, online]);
            await flushInitialReload();

            expect($hasSchedulableItems.get()).toBe(true);
        });

        it('should be true when an offline dependant is present even if all main items are online', async () => {
            const main = createMockContent('item-1', {isOnline: true});
            const dependantId = new ContentId('dep-1');
            const dependant = createMockContent('dep-1', {isOnline: false});

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({dependants: [dependantId], schedulable: true}));
            mockFetchContentSummaries.mockResolvedValue([dependant]);

            openPublishDialog([main]);
            await flushInitialReload();

            expect($hasSchedulableItems.get()).toBe(true);
        });
    });

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
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
    });

    describe('requiredPublishFrom', () => {
        afterEach(() => {
            $config.setKey('requiredPublishFrom', false);
            setPublishSchedule(undefined);
        });

        it('keeps an empty "online from" valid when the config is off', () => {
            $config.setKey('requiredPublishFrom', false);
            setPublishSchedule({});

            expect($isScheduleValid.get()).toBe(true);
            expect($scheduleFromError.get()).toBeUndefined();
        });

        it('invalidates an empty "online from" when the config is on', () => {
            $config.setKey('requiredPublishFrom', true);
            setPublishSchedule({});

            expect($isScheduleValid.get()).toBe(false);
            expect($scheduleFromError.get()).toBeTruthy();
        });

        it('accepts a provided "online from" when the config is on', () => {
            $config.setKey('requiredPublishFrom', true);
            setPublishSchedule({from: new Date('2030-01-01T12:00:00Z')});

            expect($isScheduleValid.get()).toBe(true);
            expect($scheduleFromError.get()).toBeUndefined();
        });
    });

    describe('dependency exclusion display', () => {
        const imageId = new ContentId('image-1');

        afterEach(() => {
            $config.setKey('excludeDependencies', true);
        });

        // Max resolve (no exclusions) returns all dependants; min resolve returns direct excluded deps as next
        function mockResolveWithExclusion(directIds: ContentId[], deepIds: ContentId[] = []): void {
            const allIds = [...directIds, ...deepIds];
            mockResolvePublishDependencies.mockImplementation(({excludedIds = []}: {excludedIds?: ContentId[]}) => {
                const isMinResolve = excludedIds.some(excludedId => allIds.some(id => id.equals(excludedId)));
                return Promise.resolve(isMinResolve
                    ? createResolveResult({next: directIds})
                    : createResolveResult({dependants: allIds}));
            });
        }

        it('should keep auto-excluded dependants visible and unchecked on clean load', async () => {
            mockResolveWithExclusion([imageId]);
            mockFetchContentSummaries.mockResolvedValue([createMockContent('image-1')]);

            openPublishDialog([createMockContent('item-1')]);
            await flushInitialReload();

            const [dependant] = $dependantPublishItems.get();
            expect(dependant.id).toBe('image-1');
            expect(dependant.included).toBe(false);
            expect(dependant.hidden).toBe(false);
            expect(dependant.excludedByDefault).toBe(true);
            expect($hasExcludedDependantItems.get()).toBe(true);
        });

        it('should hide transitive dependants of auto-excluded items', async () => {
            const subId = new ContentId('sub-1');
            mockResolveWithExclusion([imageId], [subId]);
            mockFetchContentSummaries.mockResolvedValue([createMockContent('image-1'), createMockContent('sub-1')]);

            openPublishDialog([createMockContent('item-1')]);
            await flushInitialReload();

            const dependants = $dependantPublishItems.get();
            const image = dependants.find(item => item.id === 'image-1');
            const sub = dependants.find(item => item.id === 'sub-1');
            expect(image?.hidden).toBe(false);
            expect(sub?.hidden).toBe(true);
            expect(image?.included).toBe(false);
            expect(sub?.included).toBe(false);
        });

        it('should report excluded dependants only after applying the selection', async () => {
            $config.setKey('excludeDependencies', false);
            const depId = new ContentId('dep-1');
            mockResolveWithExclusion([depId]);
            mockFetchContentSummaries.mockResolvedValue([createMockContent('dep-1')]);

            openPublishDialog([createMockContent('item-1')]);
            await flushInitialReload();

            expect($dependantPublishItems.get()[0].included).toBe(true);
            expect($hasExcludedDependantItems.get()).toBe(false);

            setPublishDialogDependantItemSelected(depId, false);
            expect($hasExcludedDependantItems.get()).toBe(false);

            applyDraftPublishDialogSelection();
            await flushDebouncedReload();

            expect($hasExcludedDependantItems.get()).toBe(true);
            const [dependant] = $dependantPublishItems.get();
            expect(dependant.included).toBe(false);
            expect(dependant.hidden).toBe(false);
        });

        it('should re-include auto-excluded children when "include children" is applied', async () => {
            const itemId = new ContentId('item-1');
            mockFindIdsByParents.mockResolvedValue([imageId]);
            mockFetchContentSummaries.mockResolvedValue([createMockContent('image-1')]);
            mockResolvePublishDependencies.mockImplementation(({excludedIds = []}: {excludedIds?: ContentId[]}) =>
                Promise.resolve(excludedIds.some(id => id.equals(imageId))
                    ? createResolveResult({next: [imageId]})
                    : createResolveResult({dependants: [imageId]})));

            openPublishDialog([createMockContent('item-1', {hasChildren: true})]);
            await flushInitialReload();

            expect($dependantPublishItems.get()[0].included).toBe(false);

            setPublishDialogItemWithChildrenSelected(itemId, true);
            applyDraftPublishDialogSelection();
            await flushDebouncedReload();

            const [dependant] = $dependantPublishItems.get();
            expect(dependant.included).toBe(true);
            expect(dependant.hidden).toBe(false);
            expect($publishDialog.get().excludedDependantItemsIds).toHaveLength(0);
            expect($hasExcludedDependantItems.get()).toBe(false);
        });
    });

    describe('windowed dependant loading', () => {
        afterEach(() => {
            $config.setKey('excludeDependencies', true);
        });

        it('loads dependant summaries in windows while counting all by id', async () => {
            // Auto-exclude off so every dependant stays included; this isolates windowing.
            $config.setKey('excludeDependencies', false);

            const mainId = new ContentId('main-1');
            const dependantIds = Array.from({length: 40}, (_, index) => new ContentId(`dep-${index}`));

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({
                dependants: dependantIds,
                publishable: [mainId, ...dependantIds],
            }));
            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
                Promise.resolve(ids.map(id => createMockContent(id.toString()))));

            openPublishDialog([createMockContent('main-1')]);
            await flushInitialReload();

            // Only the first window of summaries is loaded...
            expect($dependantPublishItems.get()).toHaveLength(36);
            expect($hasMoreDependants.get()).toBe(true);

            // ...but the count is id-based, so it includes all dependants plus the main item.
            expect($totalPublishableItems.get()).toBe(41);

            await loadMoreDependants();
            await flushPromises();

            expect($dependantPublishItems.get()).toHaveLength(40);
            expect($hasMoreDependants.get()).toBe(false);
            expect($totalPublishableItems.get()).toBe(41);
        });
    });
});
