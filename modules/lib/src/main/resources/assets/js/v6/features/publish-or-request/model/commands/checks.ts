// Commands behind the buttons of the check warnings of the publish or request dialog.

import type { ContentId } from '../../../../../app/content/ContentId';
import { markAsReady } from '../../../../entities/content/api/publish.api';
import { i18n } from '../../../../shared/i18n';
import { uniqueIds } from '../../../../shared/lib/cms/content/ids';
import { notifyError, notifyInfo } from '../../../../shared/notifications';
import {
    $isPublishOrRequestInProgressExcludable,
    $isPublishOrRequestInvalidExcludable,
    $isPublishOrRequestNotPublishableExcludable,
    $publishOrRequestDialog,
} from '../publishOrRequestDialog.store';
import { loadPublishOrRequestDialogData } from './load';

/** Unticks the dependencies that are in progress. Does nothing when some of them cannot be unticked. */
export function excludePublishOrRequestInProgress(): void {
    if (!$isPublishOrRequestInProgressExcludable.get()) return;

    excludeDependants($publishOrRequestDialog.get().inProgressIds);
}

/** Unticks the dependencies that are invalid. Does nothing when some of them cannot be unticked. */
export function excludePublishOrRequestInvalid(): void {
    if (!$isPublishOrRequestInvalidExcludable.get()) return;

    excludeDependants($publishOrRequestDialog.get().invalidIds);
}

/**
 * Unticks the dependencies the user has no permission to publish.
 * Does nothing when some of them cannot be unticked.
 */
export function excludePublishOrRequestNotPublishable(): void {
    if (!$isPublishOrRequestNotPublishableExcludable.get()) return;

    excludeDependants($publishOrRequestDialog.get().notPublishableIds);
}

/**
 * Marks the in progress items as ready, tells the outcome in a toast and resolves again.
 * The dialog shows as loading from the start, so nothing else can be changed meanwhile.
 */
export async function markPublishOrRequestInProgressAsReady(): Promise<void> {
    const { items, inProgressIds, loading } = $publishOrRequestDialog.get();
    if (loading || inProgressIds.length === 0) return;

    $publishOrRequestDialog.setKey('loading', true);

    const result = await markAsReady(inProgressIds);

    // The dialog was closed or opened again meanwhile: its state is no longer ours to touch.
    if ($publishOrRequestDialog.get().items !== items) return;

    if (result.isErr()) {
        notifyError(i18n('notify.item.markedAsReady.error', inProgressIds.length));
        $publishOrRequestDialog.setKey('loading', false);
        return;
    }

    notifyInfo(getMarkedAsReadyMessage(inProgressIds));
    await loadPublishOrRequestDialogData();
}

// *
// * Internal
// *

// Unticks the given dependencies and applies it at once, with no apply step, then resolves again.
function excludeDependants(ids: ContentId[]): void {
    const state = $publishOrRequestDialog.get();

    $publishOrRequestDialog.set({
        ...state,
        excludedDependantIds: uniqueIds([...state.excludedDependantIds, ...ids]),
        appliedExcludedDependantIds: uniqueIds([...state.appliedExcludedDependantIds, ...ids]),
    });
    void loadPublishOrRequestDialogData();
}

// Names the item when it is a single one, else tells how many were marked.
function getMarkedAsReadyMessage(ids: ContentId[]): string {
    if (ids.length > 1) return i18n('notify.item.markedAsReady.multiple', ids.length);

    const { items, dependants } = $publishOrRequestDialog.get();
    const item = [...items, ...dependants].find((summary) => summary.getContentId().equals(ids[0]));
    const label = item?.getDisplayName() || item?.getPath()?.toString() || ids[0].toString();

    return i18n('notify.item.markedAsReady', label);
}
