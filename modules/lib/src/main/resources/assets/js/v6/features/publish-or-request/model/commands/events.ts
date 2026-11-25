// Commands that bring into the publish or request dialog what changed on the server while it is
// open. Only the main items are patched here; everything else on screen comes with the reload.

import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { patchContentItemsByContentId } from '../../../../shared/lib/cms/content/trackedItems';
import { $publishOrRequestDialog } from '../publishOrRequestDialog.store';
import { loadPublishOrRequestDialogDataDebounced } from './load';

/**
 * Takes the new version of the contents that changed. Resolves again when any of them is listed,
 * as a main item or as a dependency; the others do not concern the dialog.
 */
export function applyPublishOrRequestContentChanges(changed: readonly ContentSummary[]): void {
    const { items, dependantIds } = $publishOrRequestDialog.get();
    const patched = patchContentItemsByContentId(items, changed);
    const isDependencyChanged = changed.some((item) => hasContentIdInIds(item.getContentId(), dependantIds));

    if (patched.changed) $publishOrRequestDialog.setKey('items', patched.items);
    if (patched.changed || isDependencyChanged) loadPublishOrRequestDialogDataDebounced();
}
