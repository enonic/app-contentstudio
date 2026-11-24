// Commands that move the publish or request dialog between its steps.

import {
    $publishOrRequestDialog,
    PUBLISH_OR_REQUEST_DIALOG_STEPS,
    type PublishOrRequestDialogStep,
} from '../publishOrRequestDialog.store';

/** Shows the given step. The dialog reports steps as plain strings, so unknown ones are ignored. */
export function setPublishOrRequestDialogStep(step: string): void {
    if (!isPublishOrRequestDialogStep(step)) return;

    $publishOrRequestDialog.setKey('step', step);
}

// *
// * Internal
// *

function isPublishOrRequestDialogStep(step: string): step is PublishOrRequestDialogStep {
    return PUBLISH_OR_REQUEST_DIALOG_STEPS.some((known) => known === step);
}
