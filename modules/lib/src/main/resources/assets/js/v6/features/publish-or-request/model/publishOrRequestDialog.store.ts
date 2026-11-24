// State of the publish or request dialog: whether it is open, which step it shows,
// the items it was opened with and their dependencies resolved by the server.
// The commands that change this state live in `./commands`.

import { computed, map } from 'nanostores';
import type { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

export const PUBLISH_OR_REQUEST_DIALOG_STEPS = ['items', 'publishing'] as const;

export type PublishOrRequestDialogStep = (typeof PUBLISH_OR_REQUEST_DIALOG_STEPS)[number];

export type PublishOrRequestDialogStore = {
    // Dialog
    open: boolean;
    step: PublishOrRequestDialogStep;

    // Items the dialog was opened with
    items: ContentSummary[];

    // Loading of the dependencies
    loading: boolean;
    failed: boolean;

    // Dependencies of the items, loaded a window at a time
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;
};

export const INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE: PublishOrRequestDialogStore = {
    // Dialog
    open: false,
    step: 'items',

    // Items the dialog was opened with
    items: [],

    // Loading of the dependencies
    loading: false,
    failed: false,

    // Dependencies of the items, loaded a window at a time
    dependants: [],
    dependantIds: [],
    dependantWindow: 0,
};

export const $publishOrRequestDialog = map<PublishOrRequestDialogStore>({
    ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
});

/** True while some dependencies are known by id but not loaded yet. */
export const $hasMorePublishOrRequestDependants = computed(
    $publishOrRequestDialog,
    ({ dependantIds, dependantWindow }): boolean => dependantWindow < dependantIds.length,
);
