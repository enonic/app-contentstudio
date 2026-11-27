// Commands that change the items the publish or request dialog was opened with,
// and whether their children come along. Each change resolves the dependencies again.

import type { ContentId } from '../../../../../app/content/ContentId';
import { withIdExcluded } from '../../../../shared/lib/cms/content/draftSelection';
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

/**
 * Includes or leaves out the children of one item and resolves the dependencies again.
 * Unlike the dependency selection, this is applied at once.
 */
export function setPublishOrRequestItemChildrenIncluded(id: ContentId, included: boolean): void {
    const { excludeChildrenIds } = $publishOrRequestDialog.get();
    const next = withIdExcluded(excludeChildrenIds, id, !included);

    if (next === excludeChildrenIds) return;

    $publishOrRequestDialog.setKey('excludeChildrenIds', next);
    void loadPublishOrRequestDialogData();
}
