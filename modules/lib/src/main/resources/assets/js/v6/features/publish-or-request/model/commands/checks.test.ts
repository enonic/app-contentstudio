import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { excludePublishOrRequestInProgress } from './checks';

const { mockLoad } = vi.hoisted(() => ({ mockLoad: vi.fn() }));

vi.mock('./load', () => ({ loadPublishOrRequestDialogData: mockLoad }));

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

const excludedIds = (): string[] => $publishOrRequestDialog.get().excludedDependantIds.map(String);

const appliedExcludedIds = (): string[] => $publishOrRequestDialog.get().appliedExcludedDependantIds.map(String);

describe('publish or request dialog checks commands', () => {
    beforeEach(() => {
        mockLoad.mockReset();
        $publishOrRequestDialog.set({
            ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
            open: true,
            dependantIds: toIds('d0', 'd1', 'd2'),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('excludePublishOrRequestInProgress', () => {
        it('should untick the in progress dependencies, apply it and load again', () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0', 'd2'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual(['d0', 'd2']);
            expect(appliedExcludedIds()).toEqual(['d0', 'd2']);
            expect(mockLoad).toHaveBeenCalledOnce();
        });

        it('should keep the dependencies that are excluded already', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('d1'));
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('d1'));
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual(['d1', 'd0']);
            expect(appliedExcludedIds()).toEqual(['d1', 'd0']);
        });

        it('should do nothing when an in progress item is not a dependency', () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0', 'main'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual([]);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should do nothing when an in progress dependency is required', () => {
            $publishOrRequestDialog.setKey('requiredDependantIds', toIds('d0'));
            $publishOrRequestDialog.setKey('inProgressIds', toIds('d0', 'd1'));

            excludePublishOrRequestInProgress();

            expect(excludedIds()).toEqual([]);
            expect(mockLoad).not.toHaveBeenCalled();
        });

        it('should do nothing when nothing is in progress', () => {
            excludePublishOrRequestInProgress();

            expect(mockLoad).not.toHaveBeenCalled();
        });
    });
});
