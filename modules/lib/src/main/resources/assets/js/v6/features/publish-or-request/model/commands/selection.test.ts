import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { setPublishOrRequestDependantIncluded, togglePublishOrRequestDependantsSelection } from './selection';

const excludedIds = (): string[] => $publishOrRequestDialog.get().excludedDependantIds.map(String);

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

describe('publish or request dialog selection commands', () => {
    beforeEach(() => {
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
});
