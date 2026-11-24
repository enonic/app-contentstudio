// Commands that open and close the publish or request dialog.

import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { $publishOrRequestDialog, INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE } from '../publishOrRequestDialog.store';

/** Opens the dialog for the given items on its first step, dropping the state of an earlier run. */
export function openPublishOrRequestDialog(items: readonly ContentSummary[]): void {
    $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE, open: true, items: [...items] });
}

/** Closes the dialog and resets its state. */
export function closePublishOrRequestDialog(): void {
    $publishOrRequestDialog.set({ ...INITIAL_PUBLISH_OR_REQUEST_DIALOG_STATE });
}
