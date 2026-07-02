import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../entities/content';
import { isIdsEqual } from '../../../shared/lib/cms/content/ids';
import { findContentIdsWithCreatedDescendants } from '../../../shared/lib/cms/content/paths';
import {
    createContentIdSet,
    patchContentItemsByContentId,
    removeContentItemsById,
} from '../../../shared/lib/cms/content/trackedItems';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentPublished,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import {
    flagPublishExclusionsReset,
    reloadPublishDialogData,
    reloadPublishDialogDataDebounced,
    resetPublishDialogContext,
} from './publishDialog.commands';
import {
    $dependantIds,
    $dependantWindow,
    $hasExcludedDependantItems,
    $publishableContentIds,
    $publishChecks,
    $publishDialog,
    $publishDialogDependants,
    $publishDialogPending,
    $showExcludedDependants,
} from './publishDialog.store';

//
// * Publish Dialog Service
//
// Reloads the publish dialog data when it opens or its exclusions change and
// keeps its items and dependants in sync with socket events.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Event Handling
//

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const { open, items } = $publishDialog.get();
    return open && items.length > 0 && !$publishDialogPending.get().submitting;
};

const onPublishSocketEvent = createGuardedSocketHandler(isDialogActive);
const onIdlePublishSocketEvent = createGuardedSocketHandler(() => {
    const { submitting } = $publishDialogPending.get();
    return !submitting && isDialogActive();
});

/** Remove items by IDs from both main items and dependant items */
const removeItemsByIds = (idsToRemove: Set<string>): { removedMain: boolean; removedDependant: boolean } => {
    const { items } = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();

    const nextItems = removeContentItemsById(items, idsToRemove);
    const nextDependantItems = removeContentItemsById(dependantItems, idsToRemove);
    const removedMain = nextItems.changed;
    const removedDependant = nextDependantItems.changed;

    if (removedMain) {
        $publishDialog.setKey('items', nextItems.items);
    }
    if (removedDependant) {
        $publishDialogDependants.set(nextDependantItems.items);
    }

    // Keep the full ID list and publishable set in sync until the follow-up reload.
    const nextDependantIds = $dependantIds.get().filter((id) => !idsToRemove.has(id.toString()));
    if (nextDependantIds.length !== $dependantIds.get().length) {
        $dependantIds.set(nextDependantIds);
        $dependantWindow.set(Math.min($dependantWindow.get(), nextDependantIds.length));
    }
    const nextPublishableIds = $publishableContentIds.get().filter((id) => !idsToRemove.has(id.toString()));
    if (nextPublishableIds.length !== $publishableContentIds.get().length) {
        $publishableContentIds.set(nextPublishableIds);
    }

    return { removedMain, removedDependant };
};

const handleRemovedPublishItems = (idsToRemove: Set<string>): void => {
    const { removedMain, removedDependant } = removeItemsByIds(idsToRemove);

    if ($publishDialog.get().items.length === 0) {
        resetPublishDialogContext();
        return;
    }

    if (removedMain) {
        flagPublishExclusionsReset();
    }

    if (removedMain || removedDependant) {
        reloadPublishDialogDataDebounced();
    }
};

const patchTrackedPublishItems = (updates: ContentSummary[]): { updatedMain: boolean; updatedDependants: boolean } => {
    if (updates.length === 0) {
        return { updatedMain: false, updatedDependants: false };
    }

    const { items } = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const patchedItems = patchContentItemsByContentId(items, updates);
    const patchedDependants = patchContentItemsByContentId(dependantItems, updates);
    const updatedMain = patchedItems.changed;
    const updatedDependants = patchedDependants.changed;

    if (updatedMain) {
        $publishDialog.setKey('items', patchedItems.items);
    }

    if (updatedDependants) {
        $publishDialogDependants.set(patchedDependants.items);
    }

    return { updatedMain, updatedDependants };
};

const refreshPublishDialogMainItems = async (ids: ContentId[]): Promise<void> => {
    if (ids.length === 0) {
        return;
    }

    try {
        const updatedItems = await fetchContentSummaries(ids);
        if (updatedItems.length > 0) {
            const { items } = $publishDialog.get();
            const patchedItems = patchContentItemsByContentId(items, updatedItems);

            if (patchedItems.changed && isDialogActive()) {
                $publishDialog.setKey('items', patchedItems.items);
            }
        }
    } catch (error) {
        console.error(error);
    }
};

//
// * Service Lifecycle
//

/**
 * Start the publish dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // Reload data when dialog opens OR exclusions change
        $publishDialog.subscribe((state, oldState) => {
            const { open, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds } = state;
            const wasOpen = !!oldState?.open;
            const { loading } = $publishChecks.get();

            if (!open) {
                return;
            }

            // Initial open - always reload
            if (!wasOpen) {
                reloadPublishDialogData();
                return;
            }

            // Already loading - skip
            if (loading) return;

            // Check if exclusions changed since last resolve
            const childrenExclusionsChanged = !isIdsEqual(
                excludedItemsWithChildrenIds,
                oldState?.excludedItemsWithChildrenIds,
            );
            const exclusionsChanged =
                childrenExclusionsChanged ||
                !isIdsEqual(excludedItemsIds, oldState?.excludedItemsIds) ||
                !isIdsEqual(excludedDependantItemsIds, oldState?.excludedDependantItemsIds);

            if (childrenExclusionsChanged) {
                flagPublishExclusionsReset();
            }

            if (exclusionsChanged) {
                reloadPublishDialogDataDebounced();
            }
        }),
        // Snap back to "show excluded" once there are no toggleable excluded dependants left,
        // so the toggle never lingers in the hidden state with nothing to reveal.
        $hasExcludedDependantItems.subscribe((hasExcluded) => {
            if (!hasExcluded) {
                $showExcludedDependants.set(true);
            }
        }),
        // Handle content created: reload dependencies as new content might be a child or dependency
        $contentCreated.subscribe(
            onPublishSocketEvent((event) => {
                const mainItemIds = findContentIdsWithCreatedDescendants($publishDialog.get().items, event.data);
                if (mainItemIds.length === 0) return;

                void refreshPublishDialogMainItems(mainItemIds).finally(() => {
                    reloadPublishDialogDataDebounced();
                });
            }),
        ),
        // Handle content updates: patch visible items and reload checks if tracked content changed
        $contentUpdated.subscribe(
            onPublishSocketEvent((event) => {
                const { updatedMain, updatedDependants } = patchTrackedPublishItems(event.data);

                // Reload when tracked items change so SelectionStatusBar stays in sync.
                if (updatedMain || updatedDependants) {
                    reloadPublishDialogDataDebounced();
                }
            }),
        ),
        // Handle content renames: patch tracked rows without forcing dependency resolution
        $contentRenamed.subscribe(
            onPublishSocketEvent((event) => {
                patchTrackedPublishItems(event.data.items);
            }),
        ),
        // Handle content deletion: remove from lists, close if no items left, reload if needed
        $contentDeleted.subscribe(
            onPublishSocketEvent((event) => {
                handleRemovedPublishItems(createContentIdSet(event.data));
            }),
        ),
        // Handle content archived: same as delete
        $contentArchived.subscribe(
            onPublishSocketEvent((event) => {
                handleRemovedPublishItems(createContentIdSet(event.data));
            }),
        ),
        // Handle content published: close dialog if all main items were published
        $contentPublished.subscribe(
            onIdlePublishSocketEvent((event) => {
                const { items } = $publishDialog.get();
                const publishedIds = new Set(event.data.map((item) => item.getId()));

                // Check if all main items were published
                const allMainItemsPublished = items.every((item) => publishedIds.has(item.getId()));
                if (allMainItemsPublished) {
                    resetPublishDialogContext();
                    return;
                }

                // Otherwise reload to update status
                reloadPublishDialogDataDebounced();
            }),
        ),
    ];
};

/**
 * Stop the publish dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
