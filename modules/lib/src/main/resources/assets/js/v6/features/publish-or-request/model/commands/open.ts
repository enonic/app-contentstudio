// Commands that open and close the publish or request dialog.

import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';
import { cancelPublishOrRequestDialogLoad, loadPublishOrRequestDialogData } from './load';

/**
 * Opens the dialog for the given items on its first step and loads their dependencies.
 * With `includeChildren`, the children of every item come along as dependencies.
 */
export function openPublishOrRequestDialog(items: readonly ContentSummary[], includeChildren = false): void {
    sessionId += 1;

    $publishOrRequestDialog.set({
        ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE,
        open: true,
        items: [...items],
        excludeChildrenIds: includeChildren ? [] : items.map((item) => item.getContentId()),
    });

    void loadPublishOrRequestDialogData();
}

/** Closes the dialog, resets its state and drops a load that is still running. */
export function closePublishOrRequestDialog(): void {
    sessionId += 1;
    cancelPublishOrRequestDialogLoad();

    $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE });
}

/**
 * Number of the current run of the dialog. It changes when the dialog is opened or closed, so
 * a command that awaits can tell whether the dialog it started on is still the one on screen.
 */
export function getPublishOrRequestDialogSessionId(): number {
    return sessionId;
}

// *
// * Internal
// *

let sessionId = 0;
