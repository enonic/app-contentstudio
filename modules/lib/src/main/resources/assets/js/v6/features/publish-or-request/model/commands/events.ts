// Commands that bring into the publish or request dialog what changed on the server while it is
// open. Only the main items are patched here; everything else on screen comes with the reload.

import type { ContentId } from '../../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../../entities/content';
import { hasContentById, hasContentIdInIds } from '../../../../shared/lib/cms/content/ids';
import { findContentIdsWithCreatedDescendants } from '../../../../shared/lib/cms/content/paths';
import { patchContentItemsByContentId } from '../../../../shared/lib/cms/content/trackedItems';
import { $publishOrRequestDialog } from '../publishOrRequestDialog.store';
import { loadPublishOrRequestDialogDataDebounced } from './load';
import { closePublishOrRequestDialog, getPublishOrRequestDialogSessionId } from './open';

/**
 * Takes the new version of the contents that changed. Resolves again when any of them is listed,
 * as a main item or as a dependency; the others do not concern the dialog.
 */
export function applyPublishOrRequestContentChanges(changed: readonly ContentSummary[]): void {
    const { dependantIds } = $publishOrRequestDialog.get();
    const isDependencyChanged = changed.some((item) => hasContentIdInIds(item.getContentId(), dependantIds));
    const isMainItemChanged = patchItems(changed);

    if (isMainItemChanged || isDependencyChanged) loadPublishOrRequestDialogDataDebounced();
}

/**
 * Takes the new version of the contents that were unpublished and always resolves again: one
 * that is not listed has something to publish again, so it may be a dependency from now on.
 */
export function applyPublishOrRequestUnpublishedContents(unpublished: readonly ContentSummary[]): void {
    patchItems(unpublished);
    loadPublishOrRequestDialogDataDebounced();
}

/**
 * Resolves again when the permissions of a listed content changed, as that may change whether
 * the user can publish it. There is no new version to take: the items show nothing about it.
 */
export function applyPublishOrRequestPermissionChanges(changedIds: readonly ContentId[]): void {
    const { items, dependantIds } = $publishOrRequestDialog.get();
    const isListed = (id: ContentId): boolean => hasContentById(id, items) || hasContentIdInIds(id, dependantIds);

    if (changedIds.some(isListed)) loadPublishOrRequestDialogDataDebounced();
}

/**
 * Drops the main items that were deleted or archived, and closes the dialog when none is left.
 * Resolves again when any of the contents was listed; a dependency goes away with that answer.
 */
export function removePublishOrRequestContents(removedIds: readonly ContentId[]): void {
    const state = $publishOrRequestDialog.get();
    const isRemoved = (id: ContentId): boolean => hasContentIdInIds(id, removedIds);
    const items = state.items.filter((item) => !isRemoved(item.getContentId()));
    const isMainItemRemoved = items.length < state.items.length;

    if (isMainItemRemoved && items.length === 0) return closePublishOrRequestDialog();

    if (isMainItemRemoved) {
        const excludeChildrenIds = state.excludeChildrenIds.filter((id) => !isRemoved(id));
        $publishOrRequestDialog.set({ ...state, items, excludeChildrenIds });
    }
    if (isMainItemRemoved || state.dependantIds.some(isRemoved)) loadPublishOrRequestDialogDataDebounced();
}

/**
 * Loads again the main items that had a content created or published somewhere under them, as
 * the children they have to include may differ, then resolves again for a new one to come along.
 */
export async function refreshPublishOrRequestItemsWithChangedDescendants(
    changed: readonly ContentSummary[],
): Promise<void> {
    const ids = findContentIdsWithCreatedDescendants($publishOrRequestDialog.get().items, changed);
    if (ids.length === 0) return;

    const sessionId = getPublishOrRequestDialogSessionId();
    const refreshed = await fetchContentSummaries(ids);

    // The dialog was closed or opened again meanwhile: its state is no longer ours to touch.
    if (sessionId !== getPublishOrRequestDialogSessionId()) return;

    patchItems(refreshed);
    loadPublishOrRequestDialogDataDebounced();
}

// *
// * Internal
// *

// Swaps the main items for their new version among the given ones. Tells whether any was swapped.
function patchItems(updates: readonly ContentSummary[]): boolean {
    const { items, changed } = patchContentItemsByContentId($publishOrRequestDialog.get().items, updates);

    if (changed) $publishOrRequestDialog.setKey('items', items);

    return changed;
}
