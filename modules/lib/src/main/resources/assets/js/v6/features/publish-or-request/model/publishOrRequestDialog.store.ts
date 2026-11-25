// State of the publish or request dialog: whether it is open, which step it shows,
// the items it was opened with, their dependencies resolved by the server,
// and the selection over them: the one on screen and the one last applied.
// The commands that change this state live in `./commands`.

import { computed, map } from 'nanostores';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import {
    calcDependantsSelection,
    type DependantsSelection,
    filterShownDependantIds,
    filterShownDependants,
    hasHideableExcludedDependants,
} from '../../../shared/lib/cms/content/dependantsSelection';
import { isIdsEqual } from '../../../shared/lib/cms/content/ids';

export const PUBLISH_OR_REQUEST_DIALOG_STEPS = ['items', 'publishing'] as const;

export type PublishOrRequestDialogStep = (typeof PUBLISH_OR_REQUEST_DIALOG_STEPS)[number];

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

    // Dependencies of the items, loaded a window at a time
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;

    // Dependencies that cannot be unticked
    requiredDependantIds: ContentId[];

    // Selection on screen: the dependencies the user has unticked
    excludedDependantIds: ContentId[];

    // Selection last applied: the one the server resolved the dependencies with
    appliedExcludedDependantIds: ContentId[];

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

    // Dependencies of the items, loaded a window at a time
    dependants: [],
    dependantIds: [],
    dependantWindow: 0,

    // Dependencies that cannot be unticked
    requiredDependantIds: [],

    // Selection on screen: the dependencies the user has unticked
    excludedDependantIds: [],

    // Selection last applied: the one the server resolved the dependencies with
    appliedExcludedDependantIds: [],

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
