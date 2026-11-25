import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { applyPublishOrRequestContentChanges } from './events';

const { mockLoadDebounced } = vi.hoisted(() => ({ mockLoadDebounced: vi.fn() }));

vi.mock('./load', () => ({ loadPublishOrRequestDialogDataDebounced: mockLoadDebounced }));

const createItem = (id: string, name = id): ContentSummary =>
    ({ getContentId: () => new ContentId(id), getDisplayName: () => name }) as unknown as ContentSummary;

const itemNames = (): string[] => $publishOrRequestDialog.get().items.map((item) => item.getDisplayName());

describe('publish or request dialog events commands', () => {
    beforeEach(() => {
        mockLoadDebounced.mockReset();
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
});
