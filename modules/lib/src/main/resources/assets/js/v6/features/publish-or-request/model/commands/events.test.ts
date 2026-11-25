import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import {
    applyPublishOrRequestContentChanges,
    applyPublishOrRequestUnpublishedContents,
    refreshPublishOrRequestItemsWithNewDescendants,
    removePublishOrRequestContents,
} from './events';

const { mockLoadDebounced, mockClose, mockSessionId, mockFetchContentSummaries } = vi.hoisted(() => ({
    mockLoadDebounced: vi.fn(),
    mockClose: vi.fn(),
    mockSessionId: vi.fn(),
    mockFetchContentSummaries: vi.fn(),
}));

vi.mock('./load', () => ({ loadPublishOrRequestDialogDataDebounced: mockLoadDebounced }));

vi.mock('./open', () => ({
    closePublishOrRequestDialog: mockClose,
    getPublishOrRequestDialogSessionId: mockSessionId,
}));

vi.mock('../../../../entities/content', () => ({ fetchContentSummaries: mockFetchContentSummaries }));

// The path defaults to a top level one named after the id.
const createItem = (id: string, name = id, path = `/${id}`): ContentSummary =>
    ({
        getContentId: () => new ContentId(id),
        getDisplayName: () => name,
        getPath: () => ({ toString: () => path }),
    }) as unknown as ContentSummary;

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

const itemNames = (): string[] => $publishOrRequestDialog.get().items.map((item) => item.getDisplayName());

const excludeChildrenIds = (): string[] => $publishOrRequestDialog.get().excludeChildrenIds.map(String);

describe('publish or request dialog events commands', () => {
    beforeEach(() => {
        mockLoadDebounced.mockReset();
        mockClose.mockReset();
        mockSessionId.mockReset();
        mockSessionId.mockReturnValue(1);
        mockFetchContentSummaries.mockReset();
        mockFetchContentSummaries.mockResolvedValue([]);
        $publishOrRequestDialog.set({
            ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
            open: true,
            items: [createItem('a'), createItem('b')],
            dependantIds: [new ContentId('d0'), new ContentId('d1')],
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('applyPublishOrRequestContentChanges', () => {
        it('should take the new version of a main item and load again', () => {
            applyPublishOrRequestContentChanges([createItem('b', 'b2')]);

            expect(itemNames()).toEqual(['a', 'b2']);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should load again when a dependency changed, loaded or not', () => {
            const { items } = $publishOrRequestDialog.get();

            applyPublishOrRequestContentChanges([createItem('d1')]);

            expect($publishOrRequestDialog.get().items).toBe(items);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should load once for several changes that came together', () => {
            applyPublishOrRequestContentChanges([createItem('a', 'a2'), createItem('d0'), createItem('x')]);

            expect(itemNames()).toEqual(['a2', 'b']);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should ignore the contents that are not listed', () => {
            const { items } = $publishOrRequestDialog.get();

            applyPublishOrRequestContentChanges([createItem('x')]);

            expect($publishOrRequestDialog.get().items).toBe(items);
            expect(mockLoadDebounced).not.toHaveBeenCalled();
        });

        it('should keep the staged and the applied selection', () => {
            const [applied, staged] = [new ContentId('d0'), new ContentId('d1')];
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', [applied]);
            $publishOrRequestDialog.setKey('excludedDependantIds', [applied, staged]);

            applyPublishOrRequestContentChanges([createItem('a', 'a2')]);

            const { excludedDependantIds, appliedExcludedDependantIds } = $publishOrRequestDialog.get();
            expect(excludedDependantIds).toEqual([applied, staged]);
            expect(appliedExcludedDependantIds).toEqual([applied]);
        });
    });

    describe('applyPublishOrRequestUnpublishedContents', () => {
        it('should take the new version of a main item and load again', () => {
            applyPublishOrRequestUnpublishedContents([createItem('b', 'b2')]);

            expect(itemNames()).toEqual(['a', 'b2']);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should load again for a content that is not listed, as it may be a dependency now', () => {
            const { items } = $publishOrRequestDialog.get();

            applyPublishOrRequestUnpublishedContents([createItem('x')]);

            expect($publishOrRequestDialog.get().items).toBe(items);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });
    });

    describe('removePublishOrRequestContents', () => {
        it('should drop the main item that is gone and load again', () => {
            removePublishOrRequestContents(toIds('a'));

            expect(itemNames()).toEqual(['b']);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
            expect(mockClose).not.toHaveBeenCalled();
        });

        it('should forget whether the children of that item were left out', () => {
            $publishOrRequestDialog.setKey('excludeChildrenIds', toIds('a', 'b'));

            removePublishOrRequestContents(toIds('a'));

            expect(excludeChildrenIds()).toEqual(['b']);
        });

        it('should close the dialog when no main item is left', () => {
            removePublishOrRequestContents(toIds('a', 'b', 'd0'));

            expect(mockClose).toHaveBeenCalledOnce();
            expect(mockLoadDebounced).not.toHaveBeenCalled();
        });

        it('should load again when a dependency is gone, loaded or not', () => {
            const { items } = $publishOrRequestDialog.get();

            removePublishOrRequestContents(toIds('d1'));

            expect($publishOrRequestDialog.get().items).toBe(items);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should ignore the contents that are not listed', () => {
            removePublishOrRequestContents(toIds('x'));

            expect(itemNames()).toEqual(['a', 'b']);
            expect(mockLoadDebounced).not.toHaveBeenCalled();
            expect(mockClose).not.toHaveBeenCalled();
        });

        it('should do nothing while the dialog is closed', () => {
            $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE });

            removePublishOrRequestContents(toIds('a'));

            expect(mockClose).not.toHaveBeenCalled();
            expect(mockLoadDebounced).not.toHaveBeenCalled();
        });
    });

    describe('refreshPublishOrRequestItemsWithNewDescendants', () => {
        it('should load again the main item that got a new content under it, then resolve again', async () => {
            mockFetchContentSummaries.mockResolvedValue([createItem('b', 'b2')]);

            await refreshPublishOrRequestItemsWithNewDescendants([createItem('x', 'x', '/b/x')]);

            expect(mockFetchContentSummaries.mock.calls[0][0].map(String)).toEqual(['b']);
            expect(itemNames()).toEqual(['a', 'b2']);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should count a content created deeper under a main item', async () => {
            await refreshPublishOrRequestItemsWithNewDescendants([createItem('x', 'x', '/a/child/x')]);

            expect(mockFetchContentSummaries.mock.calls[0][0].map(String)).toEqual(['a']);
        });

        it('should ignore a content created elsewhere, even next to a main item with a similar path', async () => {
            await refreshPublishOrRequestItemsWithNewDescendants([
                createItem('x', 'x', '/x'),
                createItem('y', 'y', '/ab'),
            ]);

            expect(mockFetchContentSummaries).not.toHaveBeenCalled();
            expect(mockLoadDebounced).not.toHaveBeenCalled();
        });

        it('should still resolve again when the main item could not be loaded', async () => {
            const { items } = $publishOrRequestDialog.get();

            await refreshPublishOrRequestItemsWithNewDescendants([createItem('x', 'x', '/a/x')]);

            expect($publishOrRequestDialog.get().items).toBe(items);
            expect(mockLoadDebounced).toHaveBeenCalledOnce();
        });

        it('should leave the dialog alone when it was closed or opened again meanwhile', async () => {
            const { items } = $publishOrRequestDialog.get();
            mockFetchContentSummaries.mockResolvedValue([createItem('a', 'a2')]);

            const refreshing = refreshPublishOrRequestItemsWithNewDescendants([createItem('x', 'x', '/a/x')]);
            mockSessionId.mockReturnValue(2);
            await refreshing;

            expect($publishOrRequestDialog.get().items).toBe(items);
            expect(mockLoadDebounced).not.toHaveBeenCalled();
        });
    });
});
