// State of the publish or request dialog: whether it is open, which step it shows,
// the items it was opened with, their dependencies resolved by the server,
// and the selection over them: the one on screen and the one last applied.
// The commands that change this state live in `./commands`.

import { computed, map } from 'nanostores';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { ProjectHelper } from '../../../../app/settings/data/project/ProjectHelper';
import {
    calcDependantsSelection,
    type DependantsSelection,
    filterShownDependantIds,
    filterShownDependants,
    hasHideableExcludedDependants,
} from '../../../shared/lib/cms/content/dependantsSelection';
import { hasContentIdInIds, isIdsEqual } from '../../../shared/lib/cms/content/ids';

export const PUBLISH_OR_REQUEST_DIALOG_STEPS = ['items', 'publishing'] as const;

export type PublishOrRequestDialogStep = (typeof PUBLISH_OR_REQUEST_DIALOG_STEPS)[number];

/** What the user may do with the items the dialog was opened with. */
export type PublishOrRequestCapability = 'publish' | 'request' | 'publish-request' | 'none';

export type PublishOrRequestDialogStore = {
    // Dialog
    open: boolean;
    step: PublishOrRequestDialogStep;

    // Items the dialog was opened with
    items: ContentSummary[];

    // Items whose children are left out; the children of the others come as dependencies
    excludeChildrenIds: ContentId[];

    // Loading of the dependencies
    loading: boolean;
    failed: boolean;

    // Dependencies of the items, loaded a window at a time. Listed while the server reaches
    // them with the applied selection, or while the user keeps them unticked.
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;

    // Dependencies that cannot be unticked
    requiredDependantIds: ContentId[];

    // Selection on screen: the dependencies the user has unticked
    excludedDependantIds: ContentId[];

    // Selection last applied: the one the server resolved the dependencies with
    appliedExcludedDependantIds: ContentId[];

    // Checks of the applied selection: what stands in the way of publishing.
    // An item that is both invalid and in progress is listed as invalid only.
    invalidIds: ContentId[];
    inProgressIds: ContentId[];
    notPublishableIds: ContentId[];

    // Items that have something to publish, whatever is unticked
    publishableIds: ContentId[];

    // Whether the dependencies applied as excluded are listed ("Show / Hide excluded")
    showExcluded: boolean;
};

export const INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE: PublishOrRequestDialogStore = {
    // Dialog
    open: false,
    step: 'items',

    // Items the dialog was opened with
    items: [],

    // Items whose children are left out; the children of the others come as dependencies
    excludeChildrenIds: [],

    // Loading of the dependencies
    loading: false,
    failed: false,

    // Dependencies of the items, loaded a window at a time. Listed while the server reaches
    // them with the applied selection, or while the user keeps them unticked.
    dependants: [],
    dependantIds: [],
    dependantWindow: 0,

    // Dependencies that cannot be unticked
    requiredDependantIds: [],

    // Selection on screen: the dependencies the user has unticked
    excludedDependantIds: [],

    // Selection last applied: the one the server resolved the dependencies with
    appliedExcludedDependantIds: [],

    // Checks of the applied selection: what stands in the way of publishing.
    // An item that is both invalid and in progress is listed as invalid only.
    invalidIds: [],
    inProgressIds: [],
    notPublishableIds: [],

    // Items that have something to publish, whatever is unticked
    publishableIds: [],

    // Whether the dependencies applied as excluded are listed ("Show / Hide excluded")
    showExcluded: true,
};

export const $publishOrRequestDialog = map<PublishOrRequestDialogStore>({
    ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
});

/** True while some dependencies are known by id but not loaded yet. */
export const $hasMorePublishOrRequestDependants = computed(
    $publishOrRequestDialog,
    ({ dependantIds, dependantWindow }): boolean => dependantWindow < dependantIds.length,
);

/** True when some dependency is applied as excluded, i.e. there is something to hide. */
export const $hasPublishOrRequestExcludedDependants = computed(
    $publishOrRequestDialog,
    ({ dependantIds, appliedExcludedDependantIds }): boolean =>
        hasHideableExcludedDependants(dependantIds, appliedExcludedDependantIds),
);

/** The loaded dependencies to list: without the ones applied as excluded while those are hidden. */
export const $publishOrRequestShownDependants = computed(
    $publishOrRequestDialog,
    ({ dependants, appliedExcludedDependantIds, showExcluded }): ContentSummary[] =>
        filterShownDependants(dependants, appliedExcludedDependantIds, showExcluded),
);

/** State of the "All (N)" checkbox over the dependencies. Counts every listed id, loaded or not. */
export const $publishOrRequestDependantsSelection = computed($publishOrRequestDialog, (state): DependantsSelection =>
    calcDependantsSelection(
        filterShownDependantIds(state.dependantIds, state.appliedExcludedDependantIds, state.showExcluded),
        state.requiredDependantIds,
        state.excludedDependantIds,
    ),
);

/** True when the selection on screen is the applied one, i.e. there is nothing to apply. */
export const $isPublishOrRequestSelectionSynced = computed(
    $publishOrRequestDialog,
    ({ excludedDependantIds, appliedExcludedDependantIds }): boolean =>
        isIdsEqual(excludedDependantIds, appliedExcludedDependantIds),
);

/** How many items would be published with the selection on screen. Zero means nothing to publish. */
export const $publishOrRequestPublishableCount = computed(
    $publishOrRequestDialog,
    ({ publishableIds, excludedDependantIds }): number =>
        publishableIds.filter((id) => !hasContentIdInIds(id, excludedDependantIds)).length,
);

/** True when "Exclude" can clear the in progress check, i.e. when all those items can be unticked. */
export const $isPublishOrRequestInProgressExcludable = computed($publishOrRequestDialog, (state): boolean =>
    isEveryIdExcludable(state.inProgressIds, state),
);

/** True when "Exclude" can clear the invalid check, i.e. when all those items can be unticked. */
export const $isPublishOrRequestInvalidExcludable = computed($publishOrRequestDialog, (state): boolean =>
    isEveryIdExcludable(state.invalidIds, state),
);

/** True when "Exclude" can clear the permissions check, i.e. when all those items can be unticked. */
export const $isPublishOrRequestNotPublishableExcludable = computed($publishOrRequestDialog, (state): boolean =>
    isEveryIdExcludable(state.notPublishableIds, state),
);

/**
 * What the user may do: publishing takes the permission on every item the dialog was opened with,
 * requesting a role in the project. Right only once the dependencies are resolved.
 */
export const $publishOrRequestCapability = computed(
    $publishOrRequestDialog,
    ({ items, notPublishableIds }): PublishOrRequestCapability => {
        const canPublish = !items.some((item) => hasContentIdInIds(item.getContentId(), notPublishableIds));
        const canRequest = ProjectHelper.canRequestPublish();

        if (canPublish) return canRequest ? 'publish-request' : 'publish';

        return canRequest ? 'request' : 'none';
    },
);

// *
// * Internal
// *

// True when every given id is a dependency that is not required. A main item is never one.
function isEveryIdExcludable(
    ids: ContentId[],
    { dependantIds, requiredDependantIds }: PublishOrRequestDialogStore,
): boolean {
    const isExcludable = (id: ContentId): boolean =>
        hasContentIdInIds(id, dependantIds) && !hasContentIdInIds(id, requiredDependantIds);

    return ids.length > 0 && ids.every(isExcludable);
}
