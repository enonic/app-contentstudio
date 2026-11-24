import { beforeEach, describe, expect, it } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import {
    $hasPublishOrRequestExcludedDependants,
    $publishOrRequestDependantsSelection,
    $publishOrRequestDialog,
    $publishOrRequestShownDependants,
    INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
} from './publishOrRequestDialog.store';

const toIds = (...ids: string[]): ContentId[] => ids.map((id) => new ContentId(id));

const toItems = (...ids: string[]): ContentSummary[] =>
    ids.map((id) => ({ getId: () => id, getContentId: () => new ContentId(id) }) as unknown as ContentSummary);

const shownIds = (): string[] => $publishOrRequestShownDependants.get().map((item) => item.getId());

describe('publish or request dialog store', () => {
    beforeEach(() => {
        $publishOrRequestDialog.set({
            ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
            dependants: toItems('a', 'b', 'c'),
            dependantIds: toIds('a', 'b', 'c'),
            dependantWindow: 3,
        });
    });

    describe('$hasPublishOrRequestExcludedDependants', () => {
        it('should be false while an exclusion is only staged', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('a'));

            expect($hasPublishOrRequestExcludedDependants.get()).toBe(false);
        });

        it('should be true once an exclusion is applied', () => {
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('a'));

            expect($hasPublishOrRequestExcludedDependants.get()).toBe(true);
        });
    });

    describe('$publishOrRequestShownDependants', () => {
        beforeEach(() => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('a', 'b'));
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('a'));
        });

        it('should list every dependency while the excluded are shown', () => {
            expect(shownIds()).toEqual(['a', 'b', 'c']);
        });

        it('should leave out the applied exclusions while hidden, keeping the staged ones', () => {
            $publishOrRequestDialog.setKey('showExcluded', false);

            expect(shownIds()).toEqual(['b', 'c']);
        });
    });

    describe('$publishOrRequestDependantsSelection', () => {
        it('should count only the listed dependencies', () => {
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('a'));
            $publishOrRequestDialog.setKey('appliedExcludedDependantIds', toIds('a'));
            expect($publishOrRequestDependantsSelection.get()).toMatchObject({ count: 3, selectionType: 'partial' });

            $publishOrRequestDialog.setKey('showExcluded', false);

            expect($publishOrRequestDependantsSelection.get()).toMatchObject({ count: 2, selectionType: 'all' });
        });
    });
});
