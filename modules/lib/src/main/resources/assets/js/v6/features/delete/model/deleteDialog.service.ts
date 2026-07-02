import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import { fetchContentSummaries } from '../../../entities/content';
import { hasContentIdInIds } from '../../../shared/lib/cms/content/ids';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { resolveForDelete } from '../api/delete.api';
import {
    $deleteDialog,
    DEPENDANT_LOAD_SIZE,
    orderSummariesByIds,
    resetDeleteDialogContext,
} from './deleteDialog.store';

//
// * Delete Dialog Service
//
// Reloads the delete dialog data when it opens and keeps its items, dependants,
// and inbound references in sync with socket events.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Data Loading
//

// Inbound (blocking) dependants are shown first so they land in the first window.
const orderDependantIdsByInbound = (ids: ContentId[], inboundTargets: ContentId[]): ContentId[] => {
    if (inboundTargets.length === 0) {
        return ids;
    }
    const inboundSet = new Set(inboundTargets.map((id) => id.toString()));
    const inbound = ids.filter((id) => inboundSet.has(id.toString()));
    const rest = ids.filter((id) => !inboundSet.has(id.toString()));
    return [...inbound, ...rest];
};

const reloadDeleteDialogData = async (): Promise<void> => {
    const currentInstance = $deleteDialog.get().instance;
    const { items, open, loading } = $deleteDialog.get();
    if (!open || items.length === 0 || loading) {
        return;
    }

    $deleteDialog.setKey('loading', true);
    $deleteDialog.setKey('failed', false);

    try {
        const ids = items.map((item) => item.getContentId());
        const result = await resolveForDelete(ids);

        if (currentInstance !== $deleteDialog.get().instance) return;

        const resolvedDependantIds = result.getContentIds().filter((id) => !hasContentIdInIds(id, ids));

        const inboundDependencies = result.getInboundDependencies();
        const inboundTargets = inboundDependencies.map((dep) => dep.getId());
        const inboundSourceIds = inboundDependencies.flatMap((dep) =>
            dep.getInboundDependencies().map((id) => id.toString()),
        );

        // Keep all ids; load only the first window of summaries (rest load on scroll).
        const dependantIds = orderDependantIdsByInbound(resolvedDependantIds, inboundTargets);
        const dependants =
            dependantIds.length > 0 ? await fetchContentSummaries(dependantIds.slice(0, DEPENDANT_LOAD_SIZE)) : [];

        if (currentInstance !== $deleteDialog.get().instance) return;

        $deleteDialog.set({
            ...$deleteDialog.get(),
            dependantIds,
            dependants: orderSummariesByIds(dependants, dependantIds),
            dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, dependantIds.length),
            inboundTargets,
            inboundIgnored: inboundTargets.length === 0,
            inboundSourceIds,
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== $deleteDialog.get().instance) return;

        $deleteDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        $deleteDialog.setKey('instance', $deleteDialog.get().instance + 1);
        $deleteDialog.setKey('loading', false);
    }
};

const reloadDeleteDialogDataDebounced = createDebounce(() => {
    void reloadDeleteDialogData();
}, 100);

//
// * Event Handling
//

/** Patch items with updated data, keeping items not in the update */
const patchItemsWithUpdates = (updates: ContentSummary[]): boolean => {
    const { items } = $deleteDialog.get();
    const updateMap = new Map(updates.map((u) => [u.getId(), u]));

    const hasUpdates = items.some((item) => updateMap.has(item.getId()));
    if (!hasUpdates) return false;

    const patchedItems = items.map((item) => updateMap.get(item.getId()) ?? item);
    $deleteDialog.setKey('items', patchedItems);
    return true;
};

/** Remove items by IDs from both main items and dependants */
const removeItemsByIds = (ids: Set<string>): { removedMain: boolean; removedDependant: boolean } => {
    const { items, dependants, dependantIds } = $deleteDialog.get();

    const newItems = items.filter((item) => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter((item) => !ids.has(item.getContentId().toString()));
    const newDependantIds = dependantIds.filter((id) => !ids.has(id.toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain) {
        $deleteDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $deleteDialog.setKey('dependants', newDependants);
    }
    if (newDependantIds.length !== dependantIds.length) {
        $deleteDialog.setKey('dependantIds', newDependantIds);
        $deleteDialog.setKey('dependantWindow', Math.min($deleteDialog.get().dependantWindow, newDependantIds.length));
    }

    return { removedMain, removedDependant };
};

/** Whether any of the changed IDs is a content referencing the items (inbound source) */
const hasInboundSourceChange = (changedIds: Set<string>): boolean => {
    const { inboundSourceIds } = $deleteDialog.get();
    return inboundSourceIds.some((id) => changedIds.has(id));
};

/** Handles external delete/archive events (not triggered by this dialog's action) */
const handleExternalDeleteEvent = (changeItems: ContentServerChangeItem[]): void => {
    const ids = new Set(changeItems.map((item) => item.getContentId().toString()));
    const state = $deleteDialog.get();

    // If dialog is open but not submitting, update items/dependants
    if (state.open && !state.submitting) {
        const { removedMain, removedDependant } = removeItemsByIds(ids);
        if (removedMain && state.items.length === 0) {
            resetDeleteDialogContext();
            return;
        }

        // Removing a referencing content drops an inbound dependency: re-resolve to refresh references.
        if (removedMain || removedDependant || hasInboundSourceChange(ids)) {
            reloadDeleteDialogDataDebounced();
        }
    }
};

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const { open, items, submitting } = $deleteDialog.get();
    return open && !submitting && items.length > 0;
};

//
// * Service Lifecycle
//

/**
 * Start the delete dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // Reload data when dialog opens
        $deleteDialog.subscribe(({ open, loading }, oldState) => {
            const wasOpen = !!oldState?.open;
            if (!open || wasOpen || loading) return;
            void reloadDeleteDialogData();
        }),
        // Handle content created: reload dependencies as new content might be a child or dependency
        $contentCreated.subscribe((event) => {
            if (!event || !isDialogActive()) return;

            // New content could be a child of items being deleted
            reloadDeleteDialogDataDebounced();
        }),
        // Handle content updates: patch main items, reload if dependants affected
        $contentUpdated.subscribe((event) => {
            if (!event || !isDialogActive()) return;

            const { dependants } = $deleteDialog.get();
            const updatedIds = new Set(event.data.map((item) => item.getId()));

            // Patch main items with updated data (display name, status, etc.)
            patchItemsWithUpdates(event.data);

            // Reload when dependants change, or when a referencing content is edited to drop a reference.
            const hasDependantUpdates = dependants.some((item) => updatedIds.has(item.getId()));
            if (hasDependantUpdates || hasInboundSourceChange(updatedIds)) {
                reloadDeleteDialogDataDebounced();
            }
        }),
        $contentArchived.subscribe((event) => {
            if (!event) {
                return;
            }
            handleExternalDeleteEvent(event.data);
        }),
        $contentDeleted.subscribe((event) => {
            if (!event) {
                return;
            }
            handleExternalDeleteEvent(event.data);
        }),
    ];
};

/**
 * Stop the delete dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
