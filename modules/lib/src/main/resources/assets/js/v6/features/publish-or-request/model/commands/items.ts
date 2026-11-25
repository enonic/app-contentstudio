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
    const state = $publishOrRequestDialog.get();
    const rest = state.items.filter((item) => !item.getContentId().equals(id));

    if (rest.length === 0 || rest.length === state.items.length) return;

    $publishOrRequestDialog.set({
        ...state,
        items: rest,
        excludeChildrenIds: state.excludeChildrenIds.filter((excludedId) => !excludedId.equals(id)),
    });
    void loadPublishOrRequestDialogData();
}
