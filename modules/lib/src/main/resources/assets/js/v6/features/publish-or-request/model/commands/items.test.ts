import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { removePublishOrRequestItem, setPublishOrRequestItemChildrenIncluded } from './items';

const { mockLoad } = vi.hoisted(() => ({ mockLoad: vi.fn() }));

vi.mock('./load', () => ({ loadPublishOrRequestDialogData: mockLoad }));

const createItem = (id: string): ContentSummary =>
    ({ getId: () => id, getContentId: () => new ContentId(id) }) as unknown as ContentSummary;

const openWith = (...ids: string[]): void => {
    $publishOrRequestDialog.set({
        ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
        open: true,
        items: ids.map(createItem),
    });
};

const itemIds = (): string[] => $publishOrRequestDialog.get().items.map((item) => item.getId());

const excludeChildrenIds = (): string[] => $publishOrRequestDialog.get().excludeChildrenIds.map(String);

describe('publish or request dialog items commands', () => {
    beforeEach(() => {
        mockLoad.mockReset();
        openWith('a', 'b', 'c');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('removePublishOrRequestItem', () => {
        it('should remove the item and load the dependencies again', () => {
            removePublishOrRequestItem(new ContentId('b'));

            expect(itemIds()).toEqual(['a', 'c']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should forget whether the children of the removed item were left out', () => {
            $publishOrRequestDialog.setKey('excludeChildrenIds', [new ContentId('a'), new ContentId('b')]);

            removePublishOrRequestItem(new ContentId('b'));

            expect(excludeChildrenIds()).toEqual(['a']);
        });

        it('should keep the last item', () => {
            openWith('a');

            removePublishOrRequestItem(new ContentId('a'));

            expect(itemIds()).toEqual(['a']);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should ignore an item that is not listed', () => {
            removePublishOrRequestItem(new ContentId('x'));

            expect(itemIds()).toEqual(['a', 'b', 'c']);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should keep the staged and the applied selection', () => {
            const [applied, staged] = [new ContentId('d0'), new ContentId('d1')];
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', [applied]);
            $publishOrRequestDialog.setKey('excludedDependantIds', [applied, staged]);

            removePublishOrRequestItem(new ContentId('b'));

            const { excludedDependantIds, appliedExcludedDependantIds } = $publishOrRequestDialog.get();
            expect(excludedDependantIds).toEqual([applied, staged]);
            expect(appliedExcludedDependantIds).toEqual([applied]);
        });
    });

    describe('setPublishOrRequestItemChildrenIncluded', () => {
        beforeEach(() => {
            $publishOrRequestDialog.setKey('excludeChildrenIds', [new ContentId('a'), new ContentId('b')]);
        });

        it('should include the children of the item and load the dependencies again', () => {
            setPublishOrRequestItemChildrenIncluded(new ContentId('a'), true);

            expect(excludeChildrenIds()).toEqual(['b']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should leave out the children of the item and load the dependencies again', () => {
            setPublishOrRequestItemChildrenIncluded(new ContentId('c'), false);

            expect(excludeChildrenIds()).toEqual(['a', 'b', 'c']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should do nothing when the children are already in the asked state', () => {
            setPublishOrRequestItemChildrenIncluded(new ContentId('a'), false);
            setPublishOrRequestItemChildrenIncluded(new ContentId('c'), true);

            expect(excludeChildrenIds()).toEqual(['a', 'b']);
            expect(mockLoad).not.toHaveBeenCalled();
        });
    });
});
