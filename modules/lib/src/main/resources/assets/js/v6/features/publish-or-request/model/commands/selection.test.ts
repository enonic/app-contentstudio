import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { setPublishOrRequestDependantIncluded } from './selection';

const excludedIds = (): string[] => $publishOrRequestDialog.get().excludedDependantIds.map(String);

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
});
