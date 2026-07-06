import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../entities/content';
import { isIdsEqual } from '../../../shared/lib/cms/content/ids';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { getDescendantsOfContents } from '../api/duplicate.api';
import { $duplicateDialog, resetDuplicateDialogContext } from './duplicateDialog.store';

//
// * Duplicate Dialog Service
//
// Reloads the duplicate dialog descendants when it opens or its children
// selection changes, and keeps its items and dependants in sync with socket events.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Data Loading
//

async function reloadDuplicateDialogData(): Promise<void> {
    const currentInstance = $duplicateDialog.get().instance + 1;
    $duplicateDialog.setKey('instance', currentInstance);

    const { items, includeChildrenIds, open } = $duplicateDialog.get();
    if (!open || items.length === 0) {
        return;
    }

    const includeSet = new Set(includeChildrenIds.map((id) => id.toString()));
    const rootsWithChildren = items.filter(
        (item) => includeSet.has(item.getContentId().toString()) && item.hasChildren(),
    );

    if (rootsWithChildren.length === 0) {
        $duplicateDialog.setKey('dependants', []);
        return;
    }

    $duplicateDialog.setKey('loading', true);
    $duplicateDialog.setKey('failed', false);

    try {
        const paths = rootsWithChildren.map((item) => item.getPath());
        const descendants = await getDescendantsOfContents(paths);
        if (currentInstance !== $duplicateDialog.get().instance) return;

        if (descendants.isErr()) {
            $duplicateDialog.setKey('failed', true);
            showError(descendants.error.message);
            return;
        }

        const ids = descendants.value;

        const dependants = ids.length > 0 ? await fetchContentSummaries(ids) : [];

        if (currentInstance !== $duplicateDialog.get().instance) return;

        $duplicateDialog.set({
            ...$duplicateDialog.get(),
            dependants,
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== $duplicateDialog.get().instance) return;
        $duplicateDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        if (currentInstance === $duplicateDialog.get().instance) {
            $duplicateDialog.setKey('loading', false);
        }
    }
}

/** Debounced reload to batch rapid server events (100ms delay) */
const reloadDuplicateDialogDataDebounced = createDebounce(reloadDuplicateDialogData, 100);

//
// * Event Handling
//

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const { open, items } = $duplicateDialog.get();
    return open && items.length > 0;
};

/** Remove items by IDs from both main items and dependant items */
const removeItemsByIds = (ids: Set<string>): { removedMain: boolean; removedDependant: boolean } => {
    const { items, dependants } = $duplicateDialog.get();

    const newItems = items.filter((item) => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter((item) => !ids.has(item.getContentId().toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain) {
        $duplicateDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $duplicateDialog.setKey('dependants', newDependants);
    }

    return { removedMain, removedDependant };
};

/** Patch items with updated data, keeping items not in the update */
const patchItemsWithUpdates = (updates: ContentSummary[]): { patchedMain: boolean; patchedDependants: boolean } => {
    const { items, dependants } = $duplicateDialog.get();
    const updateMap = new Map(updates.map((update) => [update.getId(), update]));

    const patchedMain = items.some((item) => updateMap.has(item.getId()));
    const patchedDependants = dependants.some((item) => updateMap.has(item.getId()));

    if (patchedMain) {
        $duplicateDialog.setKey(
            'items',
            items.map((item) => updateMap.get(item.getId()) ?? item),
        );
    }
    if (patchedDependants) {
        $duplicateDialog.setKey(
            'dependants',
            dependants.map((item) => updateMap.get(item.getId()) ?? item),
        );
    }

    return { patchedMain, patchedDependants };
};

//
// * Service Lifecycle
//

/**
 * Start the duplicate dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // Reload data when dialog opens OR includeChildrenIds change
        $duplicateDialog.subscribe((state, oldState) => {
            const { open, includeChildrenIds } = state;
            const wasOpen = !!oldState?.open;
            if (!open) {
                return;
            }

            if (!wasOpen) {
                void reloadDuplicateDialogData();
                return;
            }

            if (state.loading) {
                return;
            }

            const includeChanged = !isIdsEqual(includeChildrenIds, oldState?.includeChildrenIds ?? []);
            if (includeChanged) {
                reloadDuplicateDialogDataDebounced();
            }
        }),
        // Handle content created: reload dependencies as new content might be a child
        $contentCreated.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }
            reloadDuplicateDialogDataDebounced();
        }),
        // Handle content updates: patch main items, reload if dependants affected
        $contentUpdated.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }

            const { dependants } = $duplicateDialog.get();
            const updatedIds = new Set(event.data.map((item) => item.getId()));

            const { patchedMain, patchedDependants } = patchItemsWithUpdates(event.data);

            const dependantsUpdated = dependants.some((item) => updatedIds.has(item.getId()));

            if (patchedMain || patchedDependants || dependantsUpdated) {
                reloadDuplicateDialogDataDebounced();
            }
        }),
        // Handle content deletion: remove from lists, close if no items left, reload if needed
        $contentDeleted.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }

            const deletedIds = new Set(event.data.map((item) => item.getContentId().toString()));
            const { removedMain, removedDependant } = removeItemsByIds(deletedIds);

            if ($duplicateDialog.get().items.length === 0) {
                resetDuplicateDialogContext();
                return;
            }

            if (removedMain || removedDependant) {
                reloadDuplicateDialogDataDebounced();
            }
        }),
        // Handle content archived: same as delete
        $contentArchived.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }

            const archivedIds = new Set(event.data.map((item) => item.getContentId().toString()));
            const { removedMain, removedDependant } = removeItemsByIds(archivedIds);

            if ($duplicateDialog.get().items.length === 0) {
                resetDuplicateDialogContext();
                return;
            }

            if (removedMain || removedDependant) {
                reloadDuplicateDialogDataDebounced();
            }
        }),
    ];
};

/**
 * Stop the duplicate dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
