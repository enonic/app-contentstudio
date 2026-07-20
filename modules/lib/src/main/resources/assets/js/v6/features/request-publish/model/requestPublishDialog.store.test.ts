import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { okAsync } from 'neverthrow';
import { ContentId } from '../../../../app/content/ContentId';
import {
    emitContentArchived,
    emitContentCreated,
    emitContentDeleted,
    emitContentPublished,
    emitContentRenamed,
    emitContentUpdated,
} from '../../../shared/socket/socket.store';
import { start as startRequestPublishDialogService } from './requestPublishDialog.service';
import {
    $isRequestPublishReady,
    $isRequestPublishSelectionSynced,
    $requestPublishDependantsSelection,
    $requestPublishDialog,
    $requestPublishDialogCreateCount,
    $requestPublishDialogErrors,
    $requestPublishHasMoreDependants,
    $requestPublishPublishableCount,
    applyDraftRequestPublishDialogSelection,
    cancelDraftRequestPublishDialogSelection,
    loadMoreRequestPublishDependants,
    openRequestPublishDialog,
    resetRequestPublishDialogContext,
    setRequestPublishDependantIncluded,
    setRequestPublishItemIncludeChildren,
    submitRequestPublishDialog,
    toggleRequestPublishDependantsSelection,
} from './requestPublishDialog.store';
import {
    createDeferredPromise,
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushDebouncedReload,
} from '../../../shared/lib/test/dialog.store.test.utils';

const {
    mockCreateIssue,
    mockFetchContentSummaries,
    mockMarkAsReady,
    mockResolvePublishDependencies,
    mockShowError,
    mockShowFeedback,
    mockShowSuccess,
    mockShowWarning,
} = vi.hoisted(() => ({
    mockCreateIssue: vi.fn(),
    mockFetchContentSummaries: vi.fn(),
    mockMarkAsReady: vi.fn(),
    mockResolvePublishDependencies: vi.fn(),
    mockShowError: vi.fn(),
    mockShowFeedback: vi.fn(),
    mockShowSuccess: vi.fn(),
    mockShowWarning: vi.fn(),
}));

vi.mock('../../../entities/content/lib/contentSummaries', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../../entities/content/api/publish.api', () => ({
    markAsReady: mockMarkAsReady,
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('../../../entities/issue/api/issues.api', () => ({
    createIssue: mockCreateIssue,
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showError: mockShowError,
    showFeedback: mockShowFeedback,
    showSuccess: mockShowSuccess,
    showWarning: mockShowWarning,
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

const requestPublishMainItemEventCases = [
    {
        name: 'deleted',
        emit: (ids: string[]) => emitContentDeleted(ids.map(createMockChangeItem)),
    },
    {
        name: 'archived',
        emit: (ids: string[]) => emitContentArchived(ids.map(createMockChangeItem)),
    },
    {
        name: 'published',
        emit: (ids: string[]) => emitContentPublished(ids.map((id) => createMockContent(id))),
    },
] as const;

async function flushRequestPublishReload(): Promise<void> {
    await flushDebouncedReload(200);
}

async function setupWithDependants(): Promise<void> {
    const dependantIds = [new ContentId('dep-1'), new ContentId('dep-2')];

    mockResolvePublishDependencies.mockResolvedValue(
        createResolveResult({ dependants: dependantIds, publishable: dependantIds }),
    );

    mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
        ids.map((id) => createMockContent(id.toString())),
    );

    openRequestPublishDialog([createMockContent('item-1', { hasChildren: true })]);

    await flushRequestPublishReload();
};

describe('requestPublishDialog.store', () => {
    beforeEach(() => {
        startRequestPublishDialogService();
        vi.useFakeTimers();
        resetRequestPublishDialogContext();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockCreateIssue.mockReset().mockReturnValue(okAsync({ getApprovers: () => [] }));
        mockMarkAsReady.mockReset();
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
        mockShowError.mockReset();
        mockShowFeedback.mockReset();
        mockShowSuccess.mockReset();
        mockShowWarning.mockReset();
    });

    afterEach(() => {
        resetRequestPublishDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('patches updated main items and refreshes ready-state checks after external updates', async () => {
        const itemId = new ContentId('item-1');
        const original = createMockContent('item-1', { displayName: 'Original name' });
        const updated = createMockContent('item-1', { displayName: 'Updated name' });

        mockResolvePublishDependencies
            .mockResolvedValueOnce(createResolveResult({ inProgress: [itemId], publishable: [itemId] }))
            .mockResolvedValueOnce(createResolveResult({ publishable: [itemId] }));

        openRequestPublishDialog([original]);
        await flushRequestPublishReload();

        expect($requestPublishDialogErrors.get().inProgress.count).toBe(1);
        expect($isRequestPublishReady.get()).toBe(false);

        emitContentUpdated([updated]);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Updated name');

        await flushRequestPublishReload();

        expect($requestPublishDialogErrors.get().inProgress.count).toBe(0);
        expect($isRequestPublishReady.get()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it('should not block create-readiness when the user lacks publish permission', async () => {
        const itemId = new ContentId('item-1');
        const item = createMockContent('item-1');

        // notPublishable must not block creating a publish request. The server still reports the
        // item as publishable (it has changes); permission is resolved separately at publish time.
        mockResolvePublishDependencies.mockResolvedValue(
            createResolveResult({ notPublishable: [itemId], publishable: [itemId] }),
        );

        openRequestPublishDialog([item]);
        await flushRequestPublishReload();

        expect($isRequestPublishReady.get()).toBe(true);
    });

    it('should block create-readiness when no selected item needs publishing', async () => {
        // A purely online item has nothing to publish.
        const item = createMockContent('online-1', { isOnline: true });

        openRequestPublishDialog([item]);
        await flushRequestPublishReload();

        expect($requestPublishPublishableCount.get()).toBe(0);
        expect($isRequestPublishReady.get()).toBe(false);
    });

    it('should allow create-readiness when at least one item needs publishing', async () => {
        const onlineItem = createMockContent('online-1', { isOnline: true });
        const offlineItem = createMockContent('offline-1');

        // Only the offline item has changes to publish (status != EQUAL).
        mockResolvePublishDependencies.mockResolvedValue(
            createResolveResult({ publishable: [new ContentId('offline-1')] }),
        );

        openRequestPublishDialog([onlineItem, offlineItem]);
        await flushRequestPublishReload();

        expect($requestPublishPublishableCount.get()).toBe(1);
        expect($isRequestPublishReady.get()).toBe(true);
    });

    it('loads dependant summaries lazily, a window at a time, while counts use the full id set', async () => {
        const dependantIds = Array.from({ length: 40 }, (_, index) => new ContentId(`dep-${index}`));

        mockResolvePublishDependencies.mockResolvedValue(
            createResolveResult({ dependants: dependantIds, publishable: dependantIds }),
        );
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            ids.map((id) => createMockContent(id.toString())),
        );

        openRequestPublishDialog([createMockContent('item-1')]);
        await flushRequestPublishReload();

        // Full id set drives counts; only the first window of summaries is loaded.
        expect($requestPublishDialog.get().dependantIds).toHaveLength(40);
        expect($requestPublishDialog.get().dependants).toHaveLength(36);
        expect($requestPublishHasMoreDependants.get()).toBe(true);
        expect($requestPublishDialogCreateCount.get()).toBe(41);
        expect($requestPublishPublishableCount.get()).toBe(40);

        await loadMoreRequestPublishDependants();

        expect($requestPublishDialog.get().dependants).toHaveLength(40);
        expect($requestPublishHasMoreDependants.get()).toBe(false);
    });

    it('reloads checks when a dependant beyond the loaded window is removed', async () => {
        const dependantIds = Array.from({ length: 40 }, (_, index) => new ContentId(`dep-${index}`));
        const hiddenInvalidId = dependantIds[39];

        mockResolvePublishDependencies
            .mockResolvedValueOnce(
                createResolveResult({
                    dependants: dependantIds,
                    publishable: dependantIds,
                    invalid: [hiddenInvalidId],
                }),
            )
            .mockResolvedValueOnce(
                createResolveResult({
                    dependants: dependantIds.slice(0, 39),
                    publishable: dependantIds.slice(0, 39),
                }),
            );
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            ids.map((id) => createMockContent(id.toString())),
        );

        openRequestPublishDialog([createMockContent('item-1')]);
        await flushRequestPublishReload();

        // The invalid dependant sits beyond the loaded window: its summary is never fetched.
        expect($requestPublishDialog.get().dependants).toHaveLength(36);
        expect($requestPublishDialogErrors.get().invalid.count).toBe(1);

        emitContentDeleted([createMockChangeItem(hiddenInvalidId.toString())]);
        await flushRequestPublishReload();

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        expect($requestPublishDialog.get().dependantIds).toHaveLength(39);
        expect($requestPublishDialogErrors.get().invalid.count).toBe(0);
    });

    it('patches renamed items without forcing a dependency reload', async () => {
        const original = createMockContent('item-1', { displayName: 'Original name' });
        const renamed = createMockContent('item-1', { displayName: 'Renamed item' });

        openRequestPublishDialog([original]);
        await flushRequestPublishReload();

        emitContentRenamed([renamed], []);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Renamed item');
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
    });

    it('refreshes main items when created content is below a selected item path', async () => {
        const parent = createMockContent('item-1', { displayName: 'Parent', path: '/parent' });
        const updatedParent = createMockContent('item-1', {
            displayName: 'Parent',
            path: '/parent',
            hasChildren: true,
        });
        const unrelated = createMockContent('item-2', { displayName: 'Elsewhere', path: '/other/child' });
        const child = createMockContent('item-3', { displayName: 'Child', path: '/parent/child' });

        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some((id) => id.toString() === 'item-1') ? [updatedParent] : [];
        });

        openRequestPublishDialog([parent]);
        await flushRequestPublishReload();

        emitContentCreated([unrelated]);
        await flushRequestPublishReload();

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        expect($requestPublishDialog.get().items[0].hasChildren()).toBe(false);

        emitContentCreated([child]);
        await flushRequestPublishReload();

        expect($requestPublishDialog.get().items[0].hasChildren()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it.each(requestPublishMainItemEventCases)(
        'removes a non-last main item and reloads on $name events',
        async ({ emit }) => {
            const first = createMockContent('item-1', { displayName: 'First' });
            const second = createMockContent('item-2', { displayName: 'Second' });

            openRequestPublishDialog([first, second]);
            await flushRequestPublishReload();

            emit(['item-1']);
            await flushRequestPublishReload();

            expect($requestPublishDialog.get().open).toBe(true);
            expect($requestPublishDialog.get().items.map((item) => item.getId())).toEqual(['item-2']);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        },
    );

    it.each(requestPublishMainItemEventCases)(
        'closes the dialog when the last main item is removed by $name events',
        async ({ emit }) => {
            const item = createMockContent('item-1', { displayName: 'Item' });

            openRequestPublishDialog([item]);
            await flushRequestPublishReload();

            emit(['item-1']);
            await flushRequestPublishReload();

            expect($requestPublishDialog.get().open).toBe(false);
            expect($requestPublishDialog.get().items).toEqual([]);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        },
    );

    it('defers socket events during submit and reconciles them after a failed request', async () => {
        const item = createMockContent('item-1', { displayName: 'Item' });
        const submitRequestDeferred = createDeferredPromise<never>();

        mockResolvePublishDependencies.mockResolvedValue(
            createResolveResult({ publishable: [new ContentId('item-1')] }),
        );

        openRequestPublishDialog([item]);
        await flushRequestPublishReload();

        mockCreateIssue.mockReturnValueOnce(submitRequestDeferred.promise);

        $requestPublishDialog.set({
            ...$requestPublishDialog.get(),
            title: 'Publish request',
            description: 'Keep this draft state intact',
            assigneeIds: ['user:system:editor'],
        });

        const submitPromise = submitRequestPublishDialog();
        await Promise.resolve();

        emitContentPublished([item]);

        expect($requestPublishDialog.get().open).toBe(true);
        expect($requestPublishDialog.get().items.map((currentItem) => currentItem.getId())).toEqual(['item-1']);
        expect($requestPublishDialog.get().title).toBe('Publish request');
        expect($requestPublishDialog.get().description).toBe('Keep this draft state intact');
        expect($requestPublishDialog.get().assigneeIds).toEqual(['user:system:editor']);
        expect($requestPublishDialog.get().submitting).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

        submitRequestDeferred.reject(new Error('Request failed'));
        await submitPromise;

        expect($requestPublishDialog.get().open).toBe(false);
        expect($requestPublishDialog.get().items).toEqual([]);
        expect($requestPublishDialog.get().title).toBe('');
        expect($requestPublishDialog.get().description).toBe('');
        expect($requestPublishDialog.get().assigneeIds).toEqual([]);
        expect($requestPublishDialog.get().submitting).toBe(false);
        expect(mockShowError).toHaveBeenCalledWith('Request failed');
    });

    it('reconciles queued non-removal events after a failed request', async () => {
        const item = createMockContent('item-1', { displayName: 'Original item' });
        const updatedItem = createMockContent('item-1', { displayName: 'Updated item' });
        const submitRequestDeferred = createDeferredPromise<never>();

        mockResolvePublishDependencies.mockResolvedValue(
            createResolveResult({ publishable: [new ContentId('item-1')] }),
        );
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) => {
            return ids.some((id) => id.toString() === 'item-1') ? [updatedItem] : [];
        });

        openRequestPublishDialog([item]);
        await flushRequestPublishReload();

        mockCreateIssue.mockReturnValueOnce(submitRequestDeferred.promise);

        $requestPublishDialog.set({
            ...$requestPublishDialog.get(),
            title: 'Publish request',
            description: 'Keep this draft state intact',
            assigneeIds: ['user:system:editor'],
        });

        const submitPromise = submitRequestPublishDialog();
        await Promise.resolve();

        emitContentUpdated([updatedItem]);

        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Original item');
        expect($requestPublishDialog.get().submitting).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

        submitRequestDeferred.reject(new Error('Request failed'));
        await submitPromise;

        expect($requestPublishDialog.get().open).toBe(true);
        expect($requestPublishDialog.get().items[0].getDisplayName()).toBe('Updated item');
        expect($requestPublishDialog.get().title).toBe('Publish request');
        expect($requestPublishDialog.get().description).toBe('Keep this draft state intact');
        expect($requestPublishDialog.get().assigneeIds).toEqual(['user:system:editor']);
        expect($requestPublishDialog.get().submitting).toBe(false);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        expect(mockShowError).toHaveBeenCalledWith('Request failed');
    });

    describe('batch dependant selection', () => {
        it('derives the tri-state from required and excluded dependants', () => {
            $requestPublishDialog.setKey('dependantIds', [
                new ContentId('req'),
                new ContentId('a'),
                new ContentId('b'),
            ]);
            $requestPublishDialog.setKey('requiredDependantIds', [new ContentId('req')]);
            $requestPublishDialog.setKey('excludedDependantIds', [new ContentId('a')]);

            const selection = $requestPublishDependantsSelection.get();
            expect(selection.count).toBe(3);
            expect(selection.selectionType).toBe('partial');
            expect(selection.disabled).toBe(false);
        });

        it('deselects every dependant when toggled from a full selection', () => {
            $requestPublishDialog.setKey('dependantIds', [new ContentId('a'), new ContentId('b')]);
            $requestPublishDialog.setKey('excludedDependantIds', []);

            expect($requestPublishDependantsSelection.get().selectionType).toBe('all');

            toggleRequestPublishDependantsSelection();

            const excluded = $requestPublishDialog
                .get()
                .excludedDependantIds.map((id) => id.toString())
                .sort();
            expect(excluded).toEqual(['a', 'b']);
            expect($requestPublishDependantsSelection.get().selectionType).toBe('none');
        });

        it('keeps required dependants selected when deselecting all, staying partial', () => {
            $requestPublishDialog.setKey('dependantIds', [new ContentId('req'), new ContentId('a')]);
            $requestPublishDialog.setKey('requiredDependantIds', [new ContentId('req')]);
            $requestPublishDialog.setKey('excludedDependantIds', []);

            toggleRequestPublishDependantsSelection();

            const excluded = $requestPublishDialog.get().excludedDependantIds.map((id) => id.toString());
            expect(excluded).toEqual(['a']);
            expect($requestPublishDependantsSelection.get().selectionType).toBe('partial');
        });

        it('selects every dependant when toggled from an empty selection', () => {
            $requestPublishDialog.setKey('dependantIds', [new ContentId('a'), new ContentId('b')]);
            $requestPublishDialog.setKey('excludedDependantIds', [new ContentId('a'), new ContentId('b')]);

            expect($requestPublishDependantsSelection.get().selectionType).toBe('none');

            toggleRequestPublishDependantsSelection();

            expect($requestPublishDialog.get().excludedDependantIds).toHaveLength(0);
            expect($requestPublishDependantsSelection.get().selectionType).toBe('all');
        });
    });

    describe('editing state (draft selection)', () => {
        it('stays synced after opening and resolving', async () => {
            await setupWithDependants();

            expect($isRequestPublishSelectionSynced.get()).toBe(true);
        });

        it('stages an include-children toggle without re-resolving until Apply', async () => {
            await setupWithDependants();
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

            // Item children are excluded by default; including them stages the change.
            setRequestPublishItemIncludeChildren(new ContentId('item-1'), true);

            expect($isRequestPublishSelectionSynced.get()).toBe(false);
            expect($isRequestPublishReady.get()).toBe(false);
            expect($requestPublishDialog.get().excludeChildrenIds).toHaveLength(0);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

            applyDraftRequestPublishDialogSelection();
            await flushRequestPublishReload();

            expect($isRequestPublishSelectionSynced.get()).toBe(true);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        });

        it('keeps counts live while a dependant edit is staged, and Apply commits without re-resolving', async () => {
            await setupWithDependants();
            expect($requestPublishDialogCreateCount.get()).toBe(3);

            setRequestPublishDependantIncluded(new ContentId('dep-1'), false);

            expect($isRequestPublishSelectionSynced.get()).toBe(false);
            expect($requestPublishDialogCreateCount.get()).toBe(2);

            applyDraftRequestPublishDialogSelection();
            await flushRequestPublishReload();

            expect($isRequestPublishSelectionSynced.get()).toBe(true);
            expect($requestPublishDialogCreateCount.get()).toBe(2);
            // Dependant exclusions are client-side only: no extra resolve on Apply.
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        });

        it('restores the applied selection on Cancel', async () => {
            await setupWithDependants();

            setRequestPublishDependantIncluded(new ContentId('dep-1'), false);
            setRequestPublishItemIncludeChildren(new ContentId('item-1'), true);
            expect($isRequestPublishSelectionSynced.get()).toBe(false);

            cancelDraftRequestPublishDialogSelection();

            expect($isRequestPublishSelectionSynced.get()).toBe(true);
            expect($requestPublishDialog.get().excludedDependantIds).toHaveLength(0);
            expect($requestPublishDialog.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
            expect($requestPublishDialogCreateCount.get()).toBe(3);
        });
    });
});
