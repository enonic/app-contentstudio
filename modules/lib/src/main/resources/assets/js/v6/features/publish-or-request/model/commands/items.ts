// Commands that change the items the publish or request dialog was opened with.
// Each change resolves the dependencies again, for the items that are left.

import type { ContentId } from '../../../../../app/content/ContentId';
import { $publishOrRequestDialog } from '../publishOrRequestDialog.store';
import { loadPublishOrRequestDialogData } from './load';

/**
 * Removes one item from the dialog and resolves the dependencies again.
 * The last item stays: the dialog always has something to publish.
 */
export function removePublishOrRequestItem(id: ContentId): void {
    const { items } = $publishOrRequestDialog.get();
    const rest = items.filter((item) => !item.getContentId().equals(id));

    if (rest.length === 0 || rest.length === items.length) return;

    $publishOrRequestDialog.setKey('items', rest);
    void loadPublishOrRequestDialogData();
}
