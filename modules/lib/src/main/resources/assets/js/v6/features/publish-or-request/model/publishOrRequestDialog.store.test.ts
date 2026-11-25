import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import {
    $hasPublishOrRequestExcludedDependants,
    $isPublishOrRequestInProgressExcludable,
    $publishOrRequestDependantsSelection,
    $publishOrRequestCapability,
    $publishOrRequestDialog,
    $publishOrRequestPublishableCount,
    $publishOrRequestShownDependants,
    INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
} from './publishOrRequestDialog.store';

const { mockCanRequestPublish } = vi.hoisted(() => ({ mockCanRequestPublish: vi.fn() }));

vi.mock('../../../../app/settings/data/project/ProjectHelper', () => ({
    ProjectHelper: { canRequestPublish: mockCanRequestPublish },
}));

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

    describe('$isPublishOrRequestInProgressExcludable', () => {
        it('should be true when every in progress item is a dependency that can be unticked', () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('a', 'c'));

            expect($isPublishOrRequestInProgressExcludable.get()).toBe(true);
        });

        it('should be false when one of them is a main item or a required dependency', () => {
            $publishOrRequestDialog.setKey('inProgressIds', toIds('a', 'main'));
            expect($isPublishOrRequestInProgressExcludable.get()).toBe(false);

            $publishOrRequestDialog.setKey('inProgressIds', toIds('a'));
            $publishOrRequestDialog.setKey('requiredDependantIds', toIds('a'));
            expect($isPublishOrRequestInProgressExcludable.get()).toBe(false);
        });

        it('should be false when nothing is in progress', () => {
            expect($isPublishOrRequestInProgressExcludable.get()).toBe(false);
        });
    });

    describe('$publishOrRequestPublishableCount', () => {
        it('should count the items that have something to publish', () => {
            $publishOrRequestDialog.setKey('publishableIds', toIds('main', 'a', 'b'));

            expect($publishOrRequestPublishableCount.get()).toBe(3);
        });

        it('should leave out the unticked ones, staged or applied', () => {
            $publishOrRequestDialog.setKey('publishableIds', toIds('main', 'a', 'b'));
            $publishOrRequestDialog.setKey('excludedDependantIds', toIds('a', 'b'));

            expect($publishOrRequestPublishableCount.get()).toBe(1);
        });
    });

    describe('$publishOrRequestCapability', () => {
        // The role is read when the state changes, so it is set before the state.
        const setCapabilityFacts = (canRequest: boolean, notPublishableIds: ContentId[]): void => {
            mockCanRequestPublish.mockReturnValue(canRequest);
            $publishOrRequestDialog.set({
                ...$publishOrRequestDialog.get(),
                items: toItems('main', 'other'),
                notPublishableIds,
            });
        };

        it.each([
            { canRequest: true, blocked: [], expected: 'publish-request' },
            { canRequest: false, blocked: [], expected: 'publish' },
            { canRequest: true, blocked: ['main'], expected: 'request' },
            { canRequest: false, blocked: ['main'], expected: 'none' },
        ])('should be $expected with canRequest $canRequest and main items blocked $blocked', (row) => {
            setCapabilityFacts(row.canRequest, toIds(...row.blocked));

            expect($publishOrRequestCapability.get()).toBe(row.expected);
        });

        it('should take the permission on every main item', () => {
            setCapabilityFacts(true, toIds('other'));

            expect($publishOrRequestCapability.get()).toBe('request');
        });

        it('should not count a dependency the user cannot publish', () => {
            setCapabilityFacts(true, toIds('a'));

            expect($publishOrRequestCapability.get()).toBe('publish-request');
        });

        it('should follow the main items when one is removed', () => {
            setCapabilityFacts(true, toIds('other'));

            $publishOrRequestDialog.setKey('items', toItems('main'));

            expect($publishOrRequestCapability.get()).toBe('publish-request');
        });
    });
});
