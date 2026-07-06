import { showError } from '@enonic/lib-admin-ui/notify/MessageBus';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../entities/content';
import { hasContentIdInIds } from '../../../shared/lib/cms/content/ids';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentUnpublished,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
import { resolveUnpublish } from '../api/unpublish.api';
import {
    $unpublishDialog,
    $unpublishDialogPending,
    DEPENDANT_LOAD_SIZE,
    orderSummariesByIds,
    resetUnpublishDialogContext,
} from './unpublishDialog.store';

//
// * Unpublish Dialog Service
//
// Reloads the unpublish dialog data when it opens and keeps its items, dependants,
// and inbound references in sync with socket events.
// Started explicitly from the app root; never a side effect of importing.
//

let unsubscribers: Array<() => void> = [];

//
// * Data loading
//

const orderDependantIdsByInbound = (ids: ContentId[], inboundTargets: ContentId[]): ContentId[] => {
    if (inboundTargets.length === 0) {
        return ids;
    }
    const inboundSet = new Set(inboundTargets.map((id) => id.toString()));
    const inbound = ids.filter((id) => inboundSet.has(id.toString()));
    const rest = ids.filter((id) => !inboundSet.has(id.toString()));
    return [...inbound, ...rest];
};

const reloadUnpublishDialogData = async (): Promise<void> => {
    const currentInstance = $unpublishDialog.get().instance + 1;
    $unpublishDialog.setKey('instance', currentInstance);
    const { items, open } = $unpublishDialog.get();
    if (!open || items.length === 0) {
        return;
    }

    $unpublishDialog.setKey('loading', true);
    $unpublishDialog.setKey('failed', false);

    try {
        const ids = items.map((item) => item.getContentId());
        const resolved = await resolveDependantsAndInbound(currentInstance, ids);

        if (currentInstance !== $unpublishDialog.get().instance || !resolved) return;

        const { dependantIds: resolvedDependantIds, inboundTargets, referenceIds } = resolved;

        const dependantIds = orderDependantIdsByInbound(resolvedDependantIds, inboundTargets);
        const dependants =
            dependantIds.length > 0 ? await fetchContentSummaries(dependantIds.slice(0, DEPENDANT_LOAD_SIZE)) : [];

        if (currentInstance !== $unpublishDialog.get().instance) return;

        $unpublishDialog.set({
            ...$unpublishDialog.get(),
            dependantIds,
            dependants: orderSummariesByIds(dependants, dependantIds),
            dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, dependantIds.length),
            inboundTargets,
            inboundIgnored: inboundTargets.length === 0,
            referenceIds,
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== $unpublishDialog.get().instance) {
            return;
        }
        $unpublishDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        if (currentInstance === $unpublishDialog.get().instance) {
            $unpublishDialog.setKey('loading', false);
        }
    }
};

const reloadUnpublishDialogDataDebounced = createDebounce(() => {
    void reloadUnpublishDialogData();
}, 100);

const resolveDependantsAndInbound = async (
    currentInstance: number,
    roots: ContentId[],
): Promise<{ dependantIds: ContentId[]; inboundTargets: ContentId[]; referenceIds: string[] } | undefined> => {
    const result = await resolveUnpublish(roots);

    if (currentInstance !== $unpublishDialog.get().instance) {
        return undefined;
    }

    if (result.isErr()) {
        $unpublishDialog.setKey('failed', true);
        showError(result.error.message);
        return undefined;
    }

    const resolved = result.value;

    // Filter out root IDs from dependants
    const dependantIds = resolved.contentIds.filter((id) => !hasContentIdInIds(id, roots));

    const inboundTargets = resolved.inboundDependencies.map((dep) => dep.id);

    // Extract IDs of content that references items (for change detection)
    const referenceIds = resolved.inboundDependencies.flatMap((dep) =>
        dep.inboundDependencies.map((id) => id.toString()),
    );

    return { dependantIds, inboundTargets, referenceIds };
};

//
// * State mutation helpers
//

const removeItemsByIds = (ids: Set<string>): { removedMain: boolean; removedDependant: boolean } => {
    const { items, dependants, dependantIds } = $unpublishDialog.get();

    const newItems = items.filter((item) => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter((item) => !ids.has(item.getContentId().toString()));
    const newDependantIds = dependantIds.filter((id) => !ids.has(id.toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain) {
        $unpublishDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $unpublishDialog.setKey('dependants', newDependants);
    }
    if (newDependantIds.length !== dependantIds.length) {
        $unpublishDialog.setKey('dependantIds', newDependantIds);
        $unpublishDialog.setKey(
            'dependantWindow',
            Math.min($unpublishDialog.get().dependantWindow, newDependantIds.length),
        );
    }

    return { removedMain, removedDependant };
};

const patchItemsWithUpdates = (updates: ContentSummary[]): { patchedMain: boolean; patchedDependants: boolean } => {
    const { items, dependants } = $unpublishDialog.get();
    const updateMap = new Map(updates.map((update) => [update.getId(), update]));

    const patchedMain = items.some((item) => updateMap.has(item.getId()));
    const patchedDependants = dependants.some((item) => updateMap.has(item.getId()));

    if (patchedMain) {
        $unpublishDialog.setKey(
            'items',
            items.map((item) => updateMap.get(item.getId()) ?? item),
        );
    }
    if (patchedDependants) {
        $unpublishDialog.setKey(
            'dependants',
            dependants.map((item) => updateMap.get(item.getId()) ?? item),
        );
    }

    return { patchedMain, patchedDependants };
};

const isDialogActive = (): boolean => {
    const { open, items } = $unpublishDialog.get();
    return open && items.length > 0 && !$unpublishDialogPending.get().submitting;
};

//
// * Completion handling
//

/** Handles external unpublish events (not triggered by this dialog's action) */
const handleExternalUnpublishEvent = (changeItems: ContentSummary[]): void => {
    const ids = new Set(changeItems.map((item) => item.getContentId().toString()));
    const state = $unpublishDialog.get();

    // If dialog is open but not submitting, update items/dependants
    if (state.open && !$unpublishDialogPending.get().submitting) {
        const { removedMain, removedDependant } = removeItemsByIds(ids);
        if (removedMain && state.items.length === 0) {
            resetUnpublishDialogContext();
            return;
        }

        if (removedMain || removedDependant) {
            reloadUnpublishDialogDataDebounced();
        }
    }
};

//
// * Service Lifecycle
//

/**
 * Start the unpublish dialog wiring.
 * Safe to call multiple times - will only initialize once.
 */
export const start = (): void => {
    if (unsubscribers.length > 0) {
        return;
    }

    unsubscribers = [
        // Reload data when dialog opens
        $unpublishDialog.subscribe(({ open, loading }, prev) => {
            const wasOpen = !!prev?.open;
            if (!open || wasOpen || loading) {
                return;
            }
            void reloadUnpublishDialogData();
        }),
        $contentCreated.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }
            reloadUnpublishDialogDataDebounced();
        }),
        $contentUpdated.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }

            const { referenceIds } = $unpublishDialog.get();
            const updatedIds = new Set(event.data.map((item) => item.getId()));

            const { patchedMain, patchedDependants } = patchItemsWithUpdates(event.data);

            // Check if referencing content was updated (might have removed reference)
            const referenceUpdated = referenceIds.some((id) => updatedIds.has(id));

            if (patchedMain || patchedDependants || referenceUpdated) {
                reloadUnpublishDialogDataDebounced();
            }
        }),
        $contentArchived.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }

            const archivedIds = new Set(event.data.map((item) => item.getContentId().toString()));
            const { removedMain, removedDependant } = removeItemsByIds(archivedIds);

            if ($unpublishDialog.get().items.length === 0) {
                resetUnpublishDialogContext();
                return;
            }

            if (removedMain || removedDependant) {
                reloadUnpublishDialogDataDebounced();
            }
        }),
        $contentDeleted.subscribe((event) => {
            if (!event || !isDialogActive()) {
                return;
            }

            const { referenceIds } = $unpublishDialog.get();
            const deletedIds = new Set(event.data.map((item) => item.getContentId().toString()));
            const { removedMain, removedDependant } = removeItemsByIds(deletedIds);

            if ($unpublishDialog.get().items.length === 0) {
                resetUnpublishDialogContext();
                return;
            }

            // Check if referencing content was deleted (removes reference)
            const referenceDeleted = referenceIds.some((id) => deletedIds.has(id));

            if (removedMain || removedDependant || referenceDeleted) {
                reloadUnpublishDialogDataDebounced();
            }
        }),
        $contentUnpublished.subscribe((event) => {
            if (!event) {
                return;
            }
            handleExternalUnpublishEvent(event.data);
        }),
    ];
};

/**
 * Stop the unpublish dialog wiring and detach all subscriptions.
 */
export const stop = (): void => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
    unsubscribers = [];
};
