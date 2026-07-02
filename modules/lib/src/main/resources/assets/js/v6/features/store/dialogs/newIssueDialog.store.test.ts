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
import {
    $newIssueDependantsSelection,
    $newIssueDialog,
    $newIssueDialogCreateCount,
    $newIssueDialogHasMoreDependants,
    loadMoreNewIssueDependants,
    openNewIssueDialog,
    resetNewIssueDialogContext,
    toggleNewIssueDependantsSelection,
} from './newIssueDialog.store';
import {
    createMockChangeItem,
    createMockContent,
    createResolveResult,
    flushDebouncedReload,
} from './dialog.store.test.utils';

const { mockFetchContentSummaries, mockResolvePublishDependencies, mockShowError, mockShowSuccess, mockShowWarning } =
    vi.hoisted(() => ({
        mockFetchContentSummaries: vi.fn(),
        mockResolvePublishDependencies: vi.fn(),
        mockShowError: vi.fn(),
        mockShowSuccess: vi.fn(),
        mockShowWarning: vi.fn(),
    }));

vi.mock('../../api/content', () => ({
    fetchContentSummaries: mockFetchContentSummaries,
}));

vi.mock('../../api/publish', () => ({
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
});
