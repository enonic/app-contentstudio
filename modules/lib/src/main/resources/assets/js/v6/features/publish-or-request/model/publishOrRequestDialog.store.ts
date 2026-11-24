// State of the publish or request dialog: whether it is open, which step it shows
// and the items it was opened with.
// The commands that change this state live in `./commands`.

import { map } from 'nanostores';
import type { ContentSummary } from '../../../../app/content/ContentSummary';

export const PUBLISH_OR_REQUEST_DIALOG_STEPS = ['items', 'publishing'] as const;

export type PublishOrRequestDialogStep = (typeof PUBLISH_OR_REQUEST_DIALOG_STEPS)[number];

export type PublishOrRequestDialogStore = {
    open: boolean;
    step: PublishOrRequestDialogStep;
    items: ContentSummary[];
};

export const INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE: PublishOrRequestDialogStore = {
    open: false,
    step: 'items',
    items: [],
};

export const $publishOrRequestDialog = map<PublishOrRequestDialogStore>({
    ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
});
