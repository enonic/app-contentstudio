import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import {
    emitContentArchived,
    emitContentCreated,
    emitContentDeleted,
    emitContentPublished,
    emitContentRenamed,
    emitContentUpdated,
} from '../../../shared/socket/socket.store';
import { start as startNewIssueDialogService } from './newIssueDialog.service';
import {
    $isNewIssueSelectionSynced,
    $newIssueDependantsSelection,
    $newIssueDialog,
    $newIssueDialogCreateCount,
    $newIssueDialogHasMoreDependants,
    $newIssueHasExcludedDependants,
    $showNewIssueExcludedDependants,
    applyDraftNewIssueDialogSelection,
    cancelDraftNewIssueDialogSelection,
    loadMoreNewIssueDependants,
    openNewIssueDialog,
    removeNewIssueItemsByIds,
    resetNewIssueDialogContext,
    setNewIssueDependantIncluded,
    setNewIssueItemIncludeChildren,
    toggleNewIssueDependantsSelection,
    toggleNewIssueShowExcludedDependants,
} from './newIssueDialog.store';
import {
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushDebouncedReload,
} from '../../../shared/lib/test/dialog.store.test.utils';

const { mockFetchContentSummaries, mockResolvePublishDependencies, mockShowError, mockShowSuccess, mockShowWarning } =
    vi.hoisted(() => ({
        mockFetchContentSummaries: vi.fn(),
        mockResolvePublishDependencies: vi.fn(),
        mockShowError: vi.fn(),
        mockShowSuccess: vi.fn(),
        mockShowWarning: vi.fn(),
    }));

vi.mock('../../../entities/content/lib/contentSummaries', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../../entities/content/api/publish.api', () => ({
    resolvePublishDependencies: mockResolvePublishDependencies,
}));

vi.mock('@enonic/lib-admin-ui/notify/MessageBus', () => ({
    showError: mockShowError,
    showSuccess: mockShowSuccess,
    showWarning: mockShowWarning,
}));

vi.mock('@enonic/lib-admin-ui/util/Messages', () => ({
    i18n: (key: string) => key,
}));

const removalEventCases = [
    {
        name: 'deleted',
        emit: (ids: string[]) => emitContentDeleted(ids.map(createMockChangeItem)),
    },
    {
        name: 'archived',
        emit: (ids: string[]) => emitContentArchived(ids.map(createMockChangeItem)),
    },
] as const;

async function flushNewIssueReload(): Promise<void> {
    await flushDebouncedReload(200);
}

describe('newIssueDialog.store', () => {
    beforeEach(() => {
        startNewIssueDialogService();
        vi.useFakeTimers();
        resetNewIssueDialogContext();
        mockFetchContentSummaries.mockReset().mockResolvedValue([]);
        mockResolvePublishDependencies.mockReset().mockResolvedValue(createResolveResult({}));
        mockShowError.mockReset();
        mockShowSuccess.mockReset();
        mockShowWarning.mockReset();
    });

    afterEach(() => {
        resetNewIssueDialogContext();
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });

    it('patches updated items in the open dialog', async () => {
        const original = createMockContent('item-1', { displayName: 'Original name' });
        const updated = createMockContent('item-1', { displayName: 'Updated name' });

        openNewIssueDialog([original]);
        await flushNewIssueReload();

        emitContentUpdated([updated]);

        expect($newIssueDialog.get().items[0].getDisplayName()).toBe('Updated name');
    });

    it('patches renamed items in the open dialog', async () => {
        const original = createMockContent('item-1', { displayName: 'Original name' });
        const renamed = createMockContent('item-1', { displayName: 'Renamed item' });

        openNewIssueDialog([original]);
        await flushNewIssueReload();

        emitContentRenamed([renamed], []);

        expect($newIssueDialog.get().items[0].getDisplayName()).toBe('Renamed item');
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

        openNewIssueDialog([parent]);
        await flushNewIssueReload();

        emitContentCreated([unrelated]);
        await flushNewIssueReload();

        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);
        expect($newIssueDialog.get().items[0].hasChildren()).toBe(false);

        emitContentCreated([child]);
        await flushNewIssueReload();

        expect($newIssueDialog.get().items[0].hasChildren()).toBe(true);
        expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
    });

    it.each(removalEventCases)('removes a non-last item on $name events', async ({ emit }) => {
        const first = createMockContent('item-1', { displayName: 'First' });
        const second = createMockContent('item-2', { displayName: 'Second' });

        openNewIssueDialog([first, second]);
        await flushNewIssueReload();

        emit(['item-1']);
        await flushNewIssueReload();

        expect($newIssueDialog.get().open).toBe(true);
        expect($newIssueDialog.get().items.map((item) => item.getId())).toEqual(['item-2']);
    });

    it.each(removalEventCases)('clears items when the last one is removed by $name events', async ({ emit }) => {
        const item = createMockContent('item-1', { displayName: 'Item' });

        openNewIssueDialog([item]);
        await flushNewIssueReload();

        emit(['item-1']);
        await flushNewIssueReload();

        expect($newIssueDialog.get().items).toEqual([]);
        expect($newIssueDialog.get().dependants).toEqual([]);
        expect($newIssueDialog.get().excludeChildrenIds).toEqual([]);
    });

    it('patches published items in the open dialog without removing them', async () => {
        const original = createMockContent('item-1', { displayName: 'Original' });
        const published = createMockContent('item-1', { displayName: 'Published', isOnline: true });

        openNewIssueDialog([original]);
        await flushNewIssueReload();

        emitContentPublished([published]);
        await flushNewIssueReload();

        expect($newIssueDialog.get().items.map((item) => item.getId())).toEqual(['item-1']);
        expect($newIssueDialog.get().items[0].getDisplayName()).toBe('Published');
    });

    it('loads dependant summaries lazily, a window at a time, while counts use the full id set', async () => {
        const dependantIds = Array.from({ length: 40 }, (_, index) => new ContentId(`dep-${index}`));

        mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: dependantIds }));
        mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
            ids.map((id) => createMockContent(id.toString())),
        );

        openNewIssueDialog([createMockContent('item-1')]);
        await flushNewIssueReload();

        expect($newIssueDialog.get().dependantIds).toHaveLength(40);
        expect($newIssueDialog.get().dependants).toHaveLength(36);
        expect($newIssueDialogHasMoreDependants.get()).toBe(true);
        expect($newIssueDialogCreateCount.get()).toBe(41);

        await loadMoreNewIssueDependants();

        expect($newIssueDialog.get().dependants).toHaveLength(40);
        expect($newIssueDialogHasMoreDependants.get()).toBe(false);
    });

    it('ignores events when the dialog is closed', async () => {
        const item = createMockContent('item-1', { displayName: 'Item' });
        const updated = createMockContent('item-1', { displayName: 'Updated' });

        emitContentUpdated([updated]);

        openNewIssueDialog([item]);
        await flushNewIssueReload();

        expect($newIssueDialog.get().items[0].getDisplayName()).toBe('Item');
    });

    describe('batch dependant selection', () => {
        it('derives the tri-state from required and excluded dependants', () => {
            $newIssueDialog.setKey('dependantIds', [new ContentId('req'), new ContentId('a'), new ContentId('b')]);
            $newIssueDialog.setKey('requiredDependantIds', [new ContentId('req')]);
            $newIssueDialog.setKey('excludedDependantIds', [new ContentId('a')]);

            const selection = $newIssueDependantsSelection.get();
            expect(selection.count).toBe(3);
            expect(selection.selectionType).toBe('partial');
            expect(selection.disabled).toBe(false);
        });

        it('deselects every dependant when toggled from a full selection', () => {
            $newIssueDialog.setKey('dependantIds', [new ContentId('a'), new ContentId('b')]);
            $newIssueDialog.setKey('excludedDependantIds', []);

            expect($newIssueDependantsSelection.get().selectionType).toBe('all');

            toggleNewIssueDependantsSelection();

            const excluded = $newIssueDialog
                .get()
                .excludedDependantIds.map((id) => id.toString())
                .sort();
            expect(excluded).toEqual(['a', 'b']);
            expect($newIssueDependantsSelection.get().selectionType).toBe('none');
        });

        it('keeps required dependants selected when deselecting all, staying partial', () => {
            $newIssueDialog.setKey('dependantIds', [new ContentId('req'), new ContentId('a')]);
            $newIssueDialog.setKey('requiredDependantIds', [new ContentId('req')]);
            $newIssueDialog.setKey('excludedDependantIds', []);

            toggleNewIssueDependantsSelection();

            const excluded = $newIssueDialog.get().excludedDependantIds.map((id) => id.toString());
            expect(excluded).toEqual(['a']);
            expect($newIssueDependantsSelection.get().selectionType).toBe('partial');
        });

        it('selects every dependant when toggled from an empty selection', () => {
            $newIssueDialog.setKey('dependantIds', [new ContentId('a'), new ContentId('b')]);
            $newIssueDialog.setKey('excludedDependantIds', [new ContentId('a'), new ContentId('b')]);

            expect($newIssueDependantsSelection.get().selectionType).toBe('none');

            toggleNewIssueDependantsSelection();

            expect($newIssueDialog.get().excludedDependantIds).toHaveLength(0);
            expect($newIssueDependantsSelection.get().selectionType).toBe('all');
        });
    });

    describe('editing state (draft selection)', () => {
        async function setupWithDependants(): Promise<void> {
            const dependantIds = [new ContentId('dep-1'), new ContentId('dep-2')];

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: dependantIds }));

            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
                ids.map((id) => createMockContent(id.toString())),
            );

            openNewIssueDialog([createMockContent('item-1', { hasChildren: true })]);

            await flushNewIssueReload();
        }

        it('should stay synced after opening and resolving', async () => {
            await setupWithDependants();

            expect($isNewIssueSelectionSynced.get()).toBe(true);
        });

        it('should stage an include-children toggle without re-resolving until Apply', async () => {
            await setupWithDependants();
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

            setNewIssueItemIncludeChildren(new ContentId('item-1'), true);

            expect($isNewIssueSelectionSynced.get()).toBe(false);
            expect($newIssueDialog.get().excludeChildrenIds).toHaveLength(0);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

            applyDraftNewIssueDialogSelection();
            await flushNewIssueReload();

            expect($isNewIssueSelectionSynced.get()).toBe(true);
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
        });

        it('should keep counts live while a dependant edit is staged and re-resolve on Apply', async () => {
            await setupWithDependants();
            expect($newIssueDialogCreateCount.get()).toBe(3);

            setNewIssueDependantIncluded(new ContentId('dep-1'), false);

            expect($isNewIssueSelectionSynced.get()).toBe(false);
            expect($newIssueDialogCreateCount.get()).toBe(2);

            applyDraftNewIssueDialogSelection();
            await flushNewIssueReload();

            expect($isNewIssueSelectionSynced.get()).toBe(true);
            expect($newIssueDialogCreateCount.get()).toBe(2);

            // Applying a dependant exclusion re-resolves so the server can re-evaluate required items.
            const excludedCall = mockResolvePublishDependencies.mock.calls.find(
                ([params]) => (params.excludedIds?.length ?? 0) > 0,
            );
            expect(excludedCall).toBeTruthy();
            expect(excludedCall?.[0].excludedIds.map((id: ContentId) => id.toString())).toContain('dep-1');
        });

        it('should re-evaluate required dependants after excluding and applying', async () => {
            const dep1 = new ContentId('dep-1');
            const dep2 = new ContentId('dep-2');

            // dep-1 is required until dep-2 is excluded (dep-2 was the only reason dep-1 is pulled in).
            mockResolvePublishDependencies.mockImplementation(({ excludedIds = [] }: { excludedIds?: ContentId[] }) => {
                const hasExclusion = excludedIds.length > 0;
                return createResolveResult({
                    dependants: [dep1, dep2],
                    required: hasExclusion ? [] : [dep1],
                });
            });
            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
                ids.map((id) => createMockContent(id.toString())),
            );

            openNewIssueDialog([createMockContent('item-1', { hasChildren: true })]);
            await flushNewIssueReload();

            expect($newIssueDialog.get().requiredDependantIds.map((id) => id.toString())).toEqual(['dep-1']);

            setNewIssueDependantIncluded(dep2, false);
            applyDraftNewIssueDialogSelection();
            await flushNewIssueReload();

            // The excluded child freed its required parent: dep-1 is no longer required.
            expect($newIssueDialog.get().requiredDependantIds).toHaveLength(0);
            // The full list stays visible so the excluded item remains re-includable.
            expect($newIssueDialog.get().dependantIds.map((id) => id.toString())).toEqual(['dep-1', 'dep-2']);
        });

        it('should restore the applied selection on Cancel', async () => {
            await setupWithDependants();

            setNewIssueDependantIncluded(new ContentId('dep-1'), false);
            setNewIssueItemIncludeChildren(new ContentId('item-1'), true);
            expect($isNewIssueSelectionSynced.get()).toBe(false);

            cancelDraftNewIssueDialogSelection();

            expect($isNewIssueSelectionSynced.get()).toBe(true);
            expect($newIssueDialog.get().excludedDependantIds).toHaveLength(0);
            expect($newIssueDialog.get().excludeChildrenIds.map((id) => id.toString())).toEqual(['item-1']);
        });

        it('should keep a staged edit when a background reload runs, resolving the applied selection', async () => {
            await setupWithDependants();
            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(1);

            setNewIssueItemIncludeChildren(new ContentId('item-1'), true);
            expect($isNewIssueSelectionSynced.get()).toBe(false);

            emitContentUpdated([createMockContent('item-1', { hasChildren: true, displayName: 'Renamed' })]);
            await flushNewIssueReload();

            expect(mockResolvePublishDependencies).toHaveBeenCalledTimes(2);
            const reloadArgs = mockResolvePublishDependencies.mock.calls[1][0];
            expect(reloadArgs.excludeChildrenIds.map((id: ContentId) => id.toString())).toEqual(['item-1']);
            expect($newIssueDialog.get().excludeChildrenIds).toHaveLength(0);
            expect($isNewIssueSelectionSynced.get()).toBe(false);
        });

        it('should keep staged edits on remaining items when another item is removed', async () => {
            mockResolvePublishDependencies.mockResolvedValue(
                createResolveResult({ dependants: [new ContentId('dep-1')] }),
            );
            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
                ids.map((id) => createMockContent(id.toString())),
            );

            openNewIssueDialog([
                createMockContent('item-1', { hasChildren: true }),
                createMockContent('item-2', { hasChildren: true }),
            ]);
            await flushNewIssueReload();

            setNewIssueItemIncludeChildren(new ContentId('item-2'), true);
            expect($isNewIssueSelectionSynced.get()).toBe(false);

            removeNewIssueItemsByIds([new ContentId('item-1')]);
            await flushNewIssueReload();

            expect($newIssueDialog.get().excludeChildrenIds).toHaveLength(0);
            expect($newIssueDialog.get().appliedExcludeChildrenIds.map((id) => id.toString())).toEqual(['item-2']);
            expect($isNewIssueSelectionSynced.get()).toBe(false);
        });
    });

    describe('excluded dependants visibility', () => {
        async function setupWithDependants(): Promise<void> {
            const dependantIds = [new ContentId('dep-1'), new ContentId('dep-2')];

            mockResolvePublishDependencies.mockResolvedValue(createResolveResult({ dependants: dependantIds }));
            mockFetchContentSummaries.mockImplementation((ids: ContentId[]) =>
                ids.map((id) => createMockContent(id.toString())),
            );

            openNewIssueDialog([createMockContent('item-1', { hasChildren: true })]);
            await flushNewIssueReload();
        }

        async function excludeDep1AndApply(): Promise<void> {
            await setupWithDependants();

            setNewIssueDependantIncluded(new ContentId('dep-1'), false);
            applyDraftNewIssueDialogSelection();
            await flushNewIssueReload();
        }

        it('should offer nothing to hide until an exclusion is applied', async () => {
            await setupWithDependants();

            expect($newIssueHasExcludedDependants.get()).toBe(false);

            setNewIssueDependantIncluded(new ContentId('dep-1'), false);

            expect($newIssueHasExcludedDependants.get()).toBe(false);

            applyDraftNewIssueDialogSelection();
            await flushNewIssueReload();

            expect($newIssueHasExcludedDependants.get()).toBe(true);
        });

        it('should not count a staged exclusion as hideable', async () => {
            await excludeDep1AndApply();

            setNewIssueDependantIncluded(new ContentId('dep-2'), false);

            // Still only dep-1 is applied-excluded; the staged dep-2 does not count.
            expect($newIssueDialog.get().appliedExcludedDependantIds.map((id) => id.toString())).toEqual(['dep-1']);
        });

        it('should flip the toggle and restore it on reset', async () => {
            await excludeDep1AndApply();
            expect($showNewIssueExcludedDependants.get()).toBe(true);

            toggleNewIssueShowExcludedDependants();
            expect($showNewIssueExcludedDependants.get()).toBe(false);

            resetNewIssueDialogContext();
            expect($showNewIssueExcludedDependants.get()).toBe(true);
        });

        it('should count only the shown dependants while excluded ones are hidden', async () => {
            await excludeDep1AndApply();
            expect($newIssueDependantsSelection.get().count).toBe(2);

            toggleNewIssueShowExcludedDependants();

            const selection = $newIssueDependantsSelection.get();
            expect(selection.count).toBe(1);
            expect(selection.selectionType).toBe('all');
            expect(selection.selectableIds.map((id) => id.toString())).toEqual(['dep-2']);
        });

        it('should keep a staged exclusion visible, hiding only the applied ones', async () => {
            await excludeDep1AndApply();
            toggleNewIssueShowExcludedDependants();

            setNewIssueDependantIncluded(new ContentId('dep-2'), false);

            const selection = $newIssueDependantsSelection.get();
            expect(selection.count).toBe(1);
            expect(selection.selectionType).toBe('none');
        });

        it('should snap back to shown once the last exclusion is re-included', async () => {
            await excludeDep1AndApply();
            toggleNewIssueShowExcludedDependants();
            expect($showNewIssueExcludedDependants.get()).toBe(false);

            setNewIssueDependantIncluded(new ContentId('dep-1'), true);
            applyDraftNewIssueDialogSelection();
            await flushNewIssueReload();

            expect($newIssueHasExcludedDependants.get()).toBe(false);
            expect($showNewIssueExcludedDependants.get()).toBe(true);
        });
    });
});
