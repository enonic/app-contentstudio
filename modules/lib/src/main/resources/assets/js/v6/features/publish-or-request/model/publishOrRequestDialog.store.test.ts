import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import {
    $hasPublishOrRequestExcludedDependants,
    $isPublishOrRequestInProgressExcludable,
    $isPublishOrRequestNextAllowed,
    $isPublishOrRequestPublishNowAllowed,
    $publishOrRequestDependantsSelection,
    $publishOrRequestCapability,
    $publishOrRequestDialog,
    $publishOrRequestPublishableCount,
    $publishOrRequestShownDependants,
    INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
    type PublishOrRequestDialogStore,
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

    describe('going on from the items', () => {
        // A main item and a dependency, both with something to publish, and nothing in the way.
        const setReady = (canRequest: boolean, patch: Partial<PublishOrRequestDialogStore> = {}): void => {
            mockCanRequestPublish.mockReturnValue(canRequest);
            $publishOrRequestDialog.set({
                ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
                items: toItems('main'),
                dependantIds: toIds('a'),
                publishableIds: toIds('main', 'a'),
                ...patch,
            });
        };

        const allowed = (): { next: boolean; publishNow: boolean } => ({
            next: $isPublishOrRequestNextAllowed.get(),
            publishNow: $isPublishOrRequestPublishNowAllowed.get(),
        });

        it('should allow both when nothing stands in the way', () => {
            setReady(true);

            expect(allowed()).toEqual({ next: true, publishNow: true });
        });

        it.each([
            { blocker: 'loading', patch: { loading: true } },
            { blocker: 'a failed load', patch: { failed: true } },
            { blocker: 'a selection not applied', patch: { excludedDependantIds: toIds('a') } },
            { blocker: 'an item in progress', patch: { inProgressIds: toIds('a') } },
            { blocker: 'an invalid item', patch: { invalidIds: toIds('a') } },
            { blocker: 'nothing to publish', patch: { publishableIds: [] } },
        ])('should allow neither with $blocker, whatever the user may do', ({ patch }) => {
            setReady(true, patch);

            expect(allowed()).toEqual({ next: false, publishNow: false });
        });

        it('should allow only the next step to a user who can request, with a blocked dependency', () => {
            setReady(true, { notPublishableIds: toIds('a') });

            expect(allowed()).toEqual({ next: true, publishNow: false });
        });

        it('should allow neither to a user who cannot request, with a blocked dependency', () => {
            setReady(false, { notPublishableIds: toIds('a') });

            expect(allowed()).toEqual({ next: false, publishNow: false });
        });

        it('should allow only the next step to a user who can only request', () => {
            setReady(true, { notPublishableIds: toIds('main') });

            expect(allowed()).toEqual({ next: true, publishNow: false });
        });

        it('should allow neither to a user who can do nothing', () => {
            setReady(false, { notPublishableIds: toIds('main') });

            expect(allowed()).toEqual({ next: false, publishNow: false });
        });

        it('should allow both to a user who can only publish, with nothing blocked', () => {
            setReady(false);

            expect(allowed()).toEqual({ next: true, publishNow: true });
        });
    });
});
