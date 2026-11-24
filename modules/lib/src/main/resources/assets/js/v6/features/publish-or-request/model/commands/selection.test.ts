import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import {
    $isPublishOrRequestSelectionSynced,
    $publishOrRequestDialog,
    INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
} from '../publishOrRequestDialog.store';
import {
    applyPublishOrRequestSelection,
    cancelPublishOrRequestSelection,
    setPublishOrRequestDependantIncluded,
    togglePublishOrRequestDependantsSelection,
    togglePublishOrRequestShowExcluded,
} from './selection';

const { mockLoad } = vi.hoisted(() => ({ mockLoad: vi.fn() }));

vi.mock('./load', () => ({ loadPublishOrRequestDialogData: mockLoad }));

const excludedIds = (): string[] => $publishOrRequestDialog.get().excludedDependantIds.map(String);

const appliedExcludedIds = (): string[] => $publishOrRequestDialog.get().appliedExcludedDependantIds.map(String);

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

describe('publish or request dialog selection commands', () => {
    beforeEach(() => {
        mockLoad.mockReset();
        $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE, open: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('setPublishOrRequestDependantIncluded', () => {
        it('should exclude a dependency', () => {
            setPublishOrRequestDependantIncluded(new ContentId('a'), false);

            expect(excludedIds()).toEqual(['a']);
        });

        it('should include an excluded dependency again', () => {
            setPublishOrRequestDependantIncluded(new ContentId('a'), false);
            setPublishOrRequestDependantIncluded(new ContentId('b'), false);

            setPublishOrRequestDependantIncluded(new ContentId('a'), true);

            expect(excludedIds()).toEqual(['b']);
        });

        it('should not write when the dependency is already in the asked state', () => {
            setPublishOrRequestDependantIncluded(new ContentId('a'), false);
            const listener = vi.fn();
            const unsubscribe = $publishOrRequestDialog.listen(listener);

            setPublishOrRequestDependantIncluded(new ContentId('a'), false);
            setPublishOrRequestDependantIncluded(new ContentId('b'), true);
            unsubscribe();

            expect(listener).not.toHaveBeenCalled();
        });

        it('should keep a required dependency included', () => {
            $publishOrRequestDialog.setKey('requiredDependantIds', [new ContentId('a')]);

            setPublishOrRequestDependantIncluded(new ContentId('a'), false);

            expect(excludedIds()).toEqual([]);
        });

        it('should only stage the change, without applying or loading', () => {
            setPublishOrRequestDependantIncluded(new ContentId('a'), false);

            expect(appliedExcludedIds()).toEqual([]);
            expect($isPublishOrRequestSelectionSynced.get()).toBe(false);
            expect(mockLoad).not.toHaveBeenCalled();
        });
    });

    describe('togglePublishOrRequestDependantsSelection', () => {
        beforeEach(() => {
            $publishOrRequestDialog.setKey('dependantIds', toIds('a', 'b', 'c'));
            $publishOrRequestDialog.setKey('requiredDependantIds', toIds('a'));
        });

        it('should exclude every dependency that is not required when all are included', () => {
            togglePublishOrRequestDependantsSelection();

            expect(excludedIds()).toEqual(['b', 'c']);
        });

        it('should include all dependencies when none of the free ones is included', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('b', 'c'));

            togglePublishOrRequestDependantsSelection();

            expect(excludedIds()).toEqual([]);
        });

        it('should include all dependencies when only some are included', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('b'));

            togglePublishOrRequestDependantsSelection();

            expect(excludedIds()).toEqual([]);
        });

        it('should not write when every dependency is required', () => {
            $publishOrRequestDialog.setKey('requiredDependantIds', toIds('a', 'b', 'c'));
            const listener = vi.fn();
            const unsubscribe = $publishOrRequestDialog.listen(listener);

            togglePublishOrRequestDependantsSelection();
            unsubscribe();

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('applyPublishOrRequestSelection', () => {
        it('should make the staged selection the applied one and load the dependencies again', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('a', 'b'));

            applyPublishOrRequestSelection();

            expect(appliedExcludedIds()).toEqual(['a', 'b']);
            expect($isPublishOrRequestSelectionSynced.get()).toBe(true);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should do nothing when there is nothing to apply', () => {
            const listener = vi.fn();
            const unsubscribe = $publishOrRequestDialog.listen(listener);

            applyPublishOrRequestSelection();
            unsubscribe();

            expect(listener).not.toHaveBeenCalled();
            expect(mockLoad).not.toHaveBeenCalled();
        });
    });

    describe('cancelPublishOrRequestSelection', () => {
        it('should bring back the applied selection without loading', () => {
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('a'));
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('b', 'c'));

            cancelPublishOrRequestSelection();

            expect(excludedIds()).toEqual(['a']);
            expect($isPublishOrRequestSelectionSynced.get()).toBe(true);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should do nothing when there is nothing to cancel', () => {
            const listener = vi.fn();
            const unsubscribe = $publishOrRequestDialog.listen(listener);

            cancelPublishOrRequestSelection();
            unsubscribe();

            expect(listener).not.toHaveBeenCalled();
        });
    });

    describe('togglePublishOrRequestShowExcluded', () => {
        it('should hide the excluded dependencies, then show them again', () => {
            togglePublishOrRequestShowExcluded();
            expect($publishOrRequestDialog.get().showExcluded).toBe(false);

            togglePublishOrRequestShowExcluded();
            expect($publishOrRequestDialog.get().showExcluded).toBe(true);
        });

        it('should leave the hidden dependencies alone when all the listed ones are toggled', () => {
            $publishOrRequestDialog.setKey('dependantIds', toIds('a', 'b', 'c'));
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('a'));
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('a'));
            togglePublishOrRequestShowExcluded();

            togglePublishOrRequestDependantsSelection();
            expect(excludedIds()).toEqual(['a', 'b', 'c']);

            togglePublishOrRequestDependantsSelection();
            expect(excludedIds()).toEqual(['a']);
        });
    });
});
