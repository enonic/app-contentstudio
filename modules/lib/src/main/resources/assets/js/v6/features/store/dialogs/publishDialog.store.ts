import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {atom, computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {FindIdsByParentsRequest} from '../../../../app/resource/FindIdsByParentsRequest';
import {MarkAsReadyRequest} from '../../../../app/resource/MarkAsReadyRequest';
import {PublishContentRequest} from '../../../../app/resource/PublishContentRequest';
import {ResolvePublishDependenciesRequest} from '../../../../app/resource/ResolvePublishDependenciesRequest';
import {hasContentById, hasContentIdInIds, isIdsEqual, uniqueIds} from '../../utils/cms/content/ids';
import {createDebounce} from '../../utils/timing/createDebounce';
import {$contentArchived, $contentCreated, $contentDeleted, $contentPublished, $contentUpdated} from '../socket.store';

//
// * Types
//

type MainItem = {
    id: string;
    content: ContentSummaryAndCompareStatus;
    included: boolean;
    childrenIncluded: boolean;
    required: boolean;
};

type DependantItem = {
    id: string;
    content: ContentSummaryAndCompareStatus;
    included: boolean;
    required: boolean;
    excludedByDefault: boolean;
};

type PublishDialogSelectionStore = {
    excludedItemsIds: ContentId[];
    excludedItemsWithChildrenIds: ContentId[];
    excludedDependantItemsIds: ContentId[];
}

type PublishDialogStore = {
    // State
    open: boolean;
    failed: boolean;
    // Content
    items: ContentSummaryAndCompareStatus[];
    // dependantItems moved to $publishDialogDependants
    message?: string;
} & PublishDialogSelectionStore;

type PublishChecksStore = {
    loading: boolean;
    requiredIds: ContentId[];
    invalidIds: ContentId[];
    invalidExcludable: boolean;
    inProgressIds: ContentId[];
    inProgressExcludable: boolean;
    notPublishableIds: ContentId[];
    notPublishableExcludable: boolean;
}

type PublishCheckError = {
    count: number;
    disabled: boolean;
};

type PublishCheckErrorsStore = {
    invalid: PublishCheckError;
    inProgress: PublishCheckError;
    noPermissions: PublishCheckError;
}

//
// * Store State
//

const initialPublishDialogState: PublishDialogStore = {
    open: false,
    failed: false,
    items: [],
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
};

const initialSelectionState: PublishDialogSelectionStore = {
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
};

const initialChecksState: PublishChecksStore = {
    loading: false,
    requiredIds: [],
    invalidIds: [],
    invalidExcludable: false,
    inProgressIds: [],
    inProgressExcludable: false,
    notPublishableIds: [],
    notPublishableExcludable: false,
};

export const $publishDialog = map<PublishDialogStore>(structuredClone(initialPublishDialogState));

export const $draftPublishDialogSelection = map<PublishDialogSelectionStore>(structuredClone(initialSelectionState));

const $publishChecks = map<PublishChecksStore>(structuredClone(initialChecksState));

// Store for resolved dependencies (output of reloadPublishDialogData)
const $publishDialogDependants = atom<ContentSummaryAndCompareStatus[]>([]);

//
// * Derived State
//

const $publishDialogItemsWithChildren = computed($publishDialog, (state) => {
    return filterItemsWithChildren(state.items);
});

export const $isPublishSelectionSynced = computed([$draftPublishDialogSelection, $publishDialog], (draft, current): boolean => {
    const {excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = current;
    return isIdsEqual(excludedItemsIds, draft.excludedItemsIds) &&
        isIdsEqual(excludedItemsWithChildrenIds, draft.excludedItemsWithChildrenIds) &&
        isIdsEqual(excludedDependantItemsIds, draft.excludedDependantItemsIds);
});

export const $mainPublishItems = computed([$publishDialog, $draftPublishDialogSelection, $publishChecks], ({items}, {excludedItemsIds, excludedItemsWithChildrenIds}, {requiredIds}): MainItem[] => {
    return items.map(item => ({
        id: item.getId(),
        content: item,
        included: !hasContentIdInIds(item.getContentId(), excludedItemsIds),
        childrenIncluded: !hasContentIdInIds(item.getContentId(), excludedItemsWithChildrenIds),
        required: hasContentIdInIds(item.getContentId(), requiredIds),
    }));
});

export const $dependantPublishItems = computed(
    [$publishDialogDependants, $publishDialog, $draftPublishDialogSelection, $publishChecks],
    (dependantItems, {excludedDependantItemsIds}, {excludedDependantItemsIds: draftExcludedIds}, {requiredIds}): DependantItem[] => {
        return dependantItems.map(item => ({
            id: item.getId(),
            content: item,
            included: !hasContentIdInIds(item.getContentId(), draftExcludedIds),
            required: hasContentIdInIds(item.getContentId(), requiredIds),
            excludedByDefault: hasContentIdInIds(item.getContentId(), excludedDependantItemsIds),
        }));
    }
);

export const $publishableIds = computed([$mainPublishItems, $dependantPublishItems], (mainItems, dependantItems): ContentId[] => {
    return [...mainItems, ...dependantItems].filter(item => item.included).map(item => item.content.getContentId());
});

export const $totalPublishableItems = computed($publishableIds, (publishableIds): number => {
    return publishableIds.length;
});

export const $publishCheckErrors = computed([$publishChecks], (state): PublishCheckErrorsStore => {
    return {
        invalid: {
            count: state.invalidIds.length,
            disabled: !state.invalidExcludable,
        },
        inProgress: {
            count: state.inProgressIds.length,
            disabled: !state.inProgressExcludable,
        },
        noPermissions: {
            count: state.notPublishableIds.length,
            disabled: !state.notPublishableExcludable,
        },
    };
});

export const $isPublishChecking = computed([$publishChecks], ({loading}): boolean => {
    return loading;
});

export const $isPublishReady = computed([$publishChecks, $isPublishSelectionSynced, $totalPublishableItems], ({loading, invalidIds, inProgressIds, notPublishableIds}, synced, totalPublishableItems): boolean => {
    return synced && !loading && invalidIds.length === 0 && inProgressIds.length === 0 && notPublishableIds.length === 0 && totalPublishableItems > 0;
});

//
// * Instance Guard
//

// ! ID of the current fetch operation
// Used to cancel old ongoing fetch operations if the instanceId changes
let instanceId = 0;

//
// * Public API
//

export const setPublishDialogState = (state: Partial<Omit<PublishDialogStore, 'open' | 'failed' | 'items'>>) => {
    const {message, ...exclusions} = state;

    $publishDialog.set({
        ...$publishDialog.get(),
        message,
        ...exclusions,
    });
    $draftPublishDialogSelection.set({
        ...$draftPublishDialogSelection.get(),
        ...exclusions,
    });
}

// OPEN & RESET

export const openPublishDialog = (items: ContentSummaryAndCompareStatus[], includeChildItems = false, excludedIds: ContentId[] = []) => {
    const current = $publishDialog.value;

    if (current.open || items.length === 0) return;

    const excludedItemsWithChildrenIds = !includeChildItems ? filterItemsWithChildren(items).map(item => item.getContentId()) : [];

    $publishDialog.set({
        open: true,
        failed: false,
        items,
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });

    // Reset dependants store
    $publishDialogDependants.set([]);

    // TODO: Sync after updates to $publishDialog
    $draftPublishDialogSelection.set({
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });
};

export const openPublishDialogWithState = (items: ContentSummaryAndCompareStatus[], excludedIds: ContentId[], message?: string) => {
    openPublishDialog(items, false, excludedIds);
    if (message) {
        $publishDialog.setKey('message', message);
    }
}

export const resetPublishDialogContext = () => {
    instanceId += 1;
    $publishDialog.set(structuredClone(initialPublishDialogState));
    $draftPublishDialogSelection.set(structuredClone(initialSelectionState));
    $publishChecks.set(structuredClone(initialChecksState));
    $publishDialogDependants.set([]);
};

// SELECTION

export const applyDraftPublishDialogSelection = () => {
    const synced = $isPublishSelectionSynced.get();
    if (synced) return;

    const selection = $draftPublishDialogSelection.get();

    $publishDialog.set({
        ...$publishDialog.get(),
        ...selection,
    });
}

export const cancelDraftPublishDialogSelection = () => {
    const synced = $isPublishSelectionSynced.get();
    if (synced) return;

    const {excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = $publishDialog.get();

    $draftPublishDialogSelection.set({
        excludedItemsIds,
        excludedItemsWithChildrenIds,
        excludedDependantItemsIds,
    });
}

export const setPublishDialogItemSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialog.get().items);
    if (!hasItem) return;

    const {excludedItemsIds, ...rest} = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedItemsIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedItemsIds = selected ? excludedItemsIds.filter(i => !i.equals(id)) : [...excludedItemsIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedItemsIds: newExcludedItemsIds,
    });
}

export const setPublishDialogItemWithChildrenSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialogItemsWithChildren.get());
    if (!hasItem) return;

    const {excludedItemsWithChildrenIds, ...rest} = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedItemsWithChildrenIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedItemsWithChildrenIds = selected ? excludedItemsWithChildrenIds.filter(i => !i.equals(id)) : [...excludedItemsWithChildrenIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedItemsWithChildrenIds: newExcludedItemsWithChildrenIds,
    });
}

export const setPublishDialogDependantItemSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialogDependants.get());
    if (!hasItem) return;

    const {excludedDependantItemsIds, ...rest} = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedDependantItemsIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedDependantItemsIds = selected ? excludedDependantItemsIds.filter(i => !i.equals(id)) : [...excludedDependantItemsIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedDependantItemsIds: newExcludedDependantItemsIds,
    });
}

// DATA

async function reloadPublishDialogData(): Promise<void> {
    try {
        $publishChecks.setKey('loading', true);

        const result = await resolvePublishDependencies();
        if (!result) return;

        const {dependantItems, excludedItemsIds, excludedDependantItemsIds, ...checks} = result;

        // Write dependantItems to separate store
        $publishDialogDependants.set(dependantItems);

        // Only update exclusion IDs in $publishDialog
        $publishDialog.set({
            ...$publishDialog.get(),
            excludedItemsIds,
            excludedDependantItemsIds,
        });

        $draftPublishDialogSelection.set({
            ...$draftPublishDialogSelection.get(),
            excludedItemsIds,
            excludedDependantItemsIds,
        });

        $publishChecks.set({
            ...$publishChecks.get(),
            ...checks,
        });
    } catch (error) {
        $publishDialog.setKey('failed', true);
        // TODO: Notify error
    } finally {
        $publishChecks.setKey('loading', false);
        instanceId += 1;
    }
}

// CHECKS

export const markAllAsReadyInProgressPublishItems = async (): Promise<void> => {
    const {loading} = $publishChecks.get();
    if (loading) return;

    const {inProgressIds} = $publishChecks.get();
    if (inProgressIds.length === 0) return;

    const ids = await markIdsReady(inProgressIds);
    if (ids.length === 0) return;

    const newInProgressIds = inProgressIds.filter(id => !hasContentIdInIds(id, ids));
    $publishChecks.setKey('inProgressIds', newInProgressIds);
};

export const excludeInProgressPublishItems = (): void => {
    const {excludedDependantItemsIds} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const inProgressDependantIds = $publishChecks.get().inProgressIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...inProgressDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
};

export const excludeInvalidPublishItems = (): void => {
    const {excludedDependantItemsIds} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const invalidDependantIds = $publishChecks.get().invalidIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...invalidDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
};

export const excludeNotPublishablePublishItems = (): void => {
    const {excludedDependantItemsIds} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const notPublishableDependantIds = $publishChecks.get().notPublishableIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...notPublishableDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
};

// PUBLISH

export const publishItems = async (): Promise<void> => {
    const ready = $isPublishReady.get();
    if (!ready) return;

    const taskId = await sendPublishRequest();
    if (!taskId) return;

    // pollTask(taskId);

    $publishDialog.setKey('open', false);
};

//
// * Utilities
//

const filterItemsWithChildren = (items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] => {
    return items.filter(item => item.hasChildren());
};

//
// * Internal Helpers
//

/** Debounced reload to batch rapid server events (100ms delay like PublishProcessor) */
const reloadPublishDialogDataDebounced = createDebounce(() => {
    reloadPublishDialogData();
}, 100);

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const {open, items} = $publishDialog.get();
    return open && items.length > 0;
};

/** Remove items by IDs from both main items and dependant items */
const removeItemsByIds = (idsToRemove: Set<string>): {removedMain: boolean; removedDependant: boolean} => {
    const {items} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();

    const newItems = items.filter(item => !idsToRemove.has(item.getId()));
    const newDependantItems = dependantItems.filter(item => !idsToRemove.has(item.getId()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependantItems.length !== dependantItems.length;

    if (removedMain) {
        $publishDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $publishDialogDependants.set(newDependantItems);
    }

    return {removedMain, removedDependant};
};

/** Patch items with updated data, keeping items not in the update */
const patchItemsWithUpdates = (updates: ContentSummaryAndCompareStatus[]): boolean => {
    const {items} = $publishDialog.get();
    const updateMap = new Map(updates.map(u => [u.getId(), u]));

    const hasUpdates = items.some(item => updateMap.has(item.getId()));
    if (!hasUpdates) return false;

    const patchedItems = items.map(item => updateMap.get(item.getId()) ?? item);
    $publishDialog.setKey('items', patchedItems);
    return true;
};

//
// * Internal Subscriptions
//

// Reload data when dialog opens OR exclusions change
$publishDialog.subscribe((state, oldState) => {
    const {open, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = state;
    const wasOpen = !!oldState?.open;
    const {loading} = $publishChecks.get();

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
    const exclusionsChanged =
        !isIdsEqual(excludedItemsIds, oldState?.excludedItemsIds) ||
        !isIdsEqual(excludedItemsWithChildrenIds, oldState?.excludedItemsWithChildrenIds) ||
        !isIdsEqual(excludedDependantItemsIds, oldState?.excludedDependantItemsIds);

    if (exclusionsChanged) {
        reloadPublishDialogDataDebounced();
    }
});

//
// * Socket Event Handlers
//

// Handle content created: reload dependencies as new content might be a child or dependency
$contentCreated.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    // New content could be a child of items with "include children" or a new dependency
    reloadPublishDialogDataDebounced();
});

// Handle content updates: patch main items, reload if dependants affected
$contentUpdated.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    const dependantItems = $publishDialogDependants.get();
    const updatedIds = new Set(event.data.map(item => item.getId()));

    // Patch main items immutably
    patchItemsWithUpdates(event.data);

    // Reload when dependants change - dependency graph might have changed
    const hasUpdatedDependants = dependantItems.some(item => updatedIds.has(item.getId()));
    if (hasUpdatedDependants) {
        reloadPublishDialogDataDebounced();
    }
});

// Handle content deletion: remove from lists, close if no items left, reload if needed
$contentDeleted.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    const deletedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(deletedIds);

    // Close dialog if all main items were deleted
    const {items} = $publishDialog.get();
    if (items.length === 0) {
        resetPublishDialogContext();
        return;
    }

    // Reload dependencies if any items were removed
    if (removedMain || removedDependant) {
        reloadPublishDialogDataDebounced();
    }
});

// Handle content archived: same as delete
$contentArchived.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    const archivedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(archivedIds);

    // Close dialog if all main items were archived
    const {items} = $publishDialog.get();
    if (items.length === 0) {
        resetPublishDialogContext();
        return;
    }

    // Reload dependencies if any items were removed
    if (removedMain || removedDependant) {
        reloadPublishDialogDataDebounced();
    }
});

// Handle content published: close dialog if all main items were published
$contentPublished.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    const {items} = $publishDialog.get();
    const publishedIds = new Set(event.data.map(item => item.getId()));

    // Check if all main items were published
    const allMainItemsPublished = items.every(item => publishedIds.has(item.getId()));
    if (allMainItemsPublished) {
        resetPublishDialogContext();
        return;
    }

    // Otherwise reload to update status
    reloadPublishDialogDataDebounced();
});

// TODO: Use AbortController to cancel the request if the instanceId changes

type ResolvePublishDependenciesResult = {
    dependantItems: ContentSummaryAndCompareStatus[];
    excludedItemsIds: ContentId[];
    excludedDependantItemsIds: ContentId[];
    requiredIds: ContentId[];
    invalidIds: ContentId[];
    invalidExcludable: boolean;
    inProgressIds: ContentId[];
    inProgressExcludable: boolean;
    notPublishableIds: ContentId[];
    notPublishableExcludable: boolean;
};

async function resolvePublishDependencies(): Promise<ResolvePublishDependenciesResult | undefined> {
    instanceId += 1;
    const currentInstanceId = instanceId;

    const {items, excludedItemsIds, excludedDependantItemsIds, excludedItemsWithChildrenIds} = $publishDialog.get();

    const initialExcludedIds = uniqueIds([...excludedItemsIds, ...excludedDependantItemsIds]);
    const allExcludedItemsWithChildrenIds = uniqueIds([...excludedItemsWithChildrenIds, ...excludedItemsIds]);

    const itemsIds = items.map(item => item.getContentId());
    const itemsWithChildrenIds = $publishDialogItemsWithChildren.get().filter(item => {
        return !hasContentIdInIds(item.getContentId(), allExcludedItemsWithChildrenIds);
    }).map(item => item.getContentId());

    const childrenIds = itemsWithChildrenIds.length > 0 ? await new FindIdsByParentsRequest(itemsWithChildrenIds).sendAndParse() : [];
    const maxResult = await createResolveDependenciesRequest(itemsIds, excludedItemsIds, allExcludedItemsWithChildrenIds).sendAndParse();
    const minResult = await createResolveDependenciesRequest(itemsIds, initialExcludedIds, allExcludedItemsWithChildrenIds).sendAndParse();

    if (currentInstanceId !== instanceId) return;

    const excludedIds = maxResult.getDependants().filter(id => {
        return !hasContentIdInIds(id, childrenIds) &&
            !hasContentIdInIds(id, minResult.getDependants()) &&
            !hasContentIdInIds(id, itemsIds);
    });

    // TODO: notifyIfOutboundContentsNotFound(maxResult);

    const dependantIds = minResult.getDependants();
    const invalidIds = minResult.getInvalid();
    const inProgressIds = minResult.getInProgress();
    const requiredIds = minResult.getRequired();
    // const nextIds = minResult.getNextDependants();
    const notPublishableIds = minResult.getNotPublishable();
    // const somePublishable = minResult.isSomePublishable();

    // setExcludedIds(excludedIds);

    const inProgressIdsWithoutInvalid = inProgressIds.filter(id => !hasContentIdInIds(id, invalidIds));
    const isNotAllExcluded = [...inProgressIdsWithoutInvalid, ...invalidIds].some(id => hasContentIdInIds(id, excludedIds));
    if (isNotAllExcluded) {
        // TODO: notify 'dialog.publish.notAllExcluded'
    }

    const missingExcludedIds = dependantIds.filter(id =>
        !hasContentIdInIds(id, childrenIds) &&
        !hasContentIdInIds(id, minResult.getDependants()) &&
        !hasContentIdInIds(id, itemsIds));

    const fullExcludedIds = uniqueIds([...excludedIds, ...missingExcludedIds]);

    const allDependantIds = maxResult.getDependants();

    // TODO: Cache dependant items
    const dependantItems = await fetchContentSummaryAndCompareStatus(allDependantIds);

    if (currentInstanceId !== instanceId) return;

    // const publishedDependantItems = dependantItems.filter(item => item.isPublished() && item.isOnline());
    // const publishedDependantItemsIds = publishedDependantItems.map(item => item.getContentId());

    // const filteredChildren = childrenIds.filter(id => !hasContentIdInIds(id, publishedDependantItemsIds));

    const newExcludedItemsIds = items.filter(item =>
        hasContentIdInIds(item.getContentId(), fullExcludedIds) ||
        hasContentIdInIds(item.getContentId(), excludedItemsIds)
    ).map(item => item.getContentId());

    const newExcludedDependantItemsIds = dependantItems.filter(item =>
        hasContentIdInIds(item.getContentId(), fullExcludedIds) ||
        hasContentIdInIds(item.getContentId(), excludedDependantItemsIds)
    ).map(item => item.getContentId());

    const isExcludableFromIds = (id: ContentId): boolean => {
        return !hasContentIdInIds(id, newExcludedItemsIds) &&
            !hasContentIdInIds(id, requiredIds) &&
            hasContentIdInIds(id, dependantIds);
    };

    const excludableInProgressIds = inProgressIdsWithoutInvalid.filter(isExcludableFromIds);
    const inProgressExcludable = excludableInProgressIds.length === inProgressIdsWithoutInvalid.length && inProgressIdsWithoutInvalid.length > 0;

    const excludableInvalidIds = invalidIds.filter(isExcludableFromIds);
    const invalidExcludable = excludableInvalidIds.length === invalidIds.length && invalidIds.length > 0;

    const excludableNotPublishableIds = notPublishableIds.filter(isExcludableFromIds);
    const notPublishableExcludable = excludableNotPublishableIds.length === notPublishableIds.length && notPublishableIds.length > 0;

    return {
        dependantItems,
        excludedItemsIds: newExcludedItemsIds,
        excludedDependantItemsIds: newExcludedDependantItemsIds,
        requiredIds,
        invalidIds,
        invalidExcludable,
        inProgressIds: inProgressIdsWithoutInvalid,
        inProgressExcludable,
        notPublishableIds,
        notPublishableExcludable,
    };
}

//
// * Requests
//

function createResolveDependenciesRequest(ids: ContentId[], excludedIds: ContentId[] = [], excludedChildrenIds: ContentId[] = []): ResolvePublishDependenciesRequest {
    return ResolvePublishDependenciesRequest.create()
        .setIds(ids)
        .setExcludedIds(excludedIds)
        .setExcludeChildrenIds(excludedChildrenIds)
        .build();
}

async function fetchContentSummaryAndCompareStatus(ids: ContentId[]): Promise<ContentSummaryAndCompareStatus[]> {
    if (ids.length === 0) return [];
    return await new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(ids);
}

// TODO: Add mechanism to prevent conflicting requests for reload, mark as ready, and server updates
// Right now we just lock the dialog and pray. Amen
async function markIdsReady(ids: ContentId[]): Promise<ContentId[]> {
    try {
        await new MarkAsReadyRequest(ids).sendAndParse();
        const count = ids.length;
        const msg = count > 1 ? i18n('notify.item.markedAsReady.multiple', count) : i18n('notify.item.markedAsReady', ids[0].toString());
        showFeedback(msg);
        return ids;
    } catch (e) {
        showError(i18n('notify.item.markedAsReady.error', ids.length));
        return [];
    }
}

async function sendPublishRequest(): Promise<TaskId | undefined> {
    const publishableIds = $publishableIds.get();
    const {message, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = $publishDialog.get();
    const allExcludedItemsWithChildrenIds = uniqueIds([...excludedItemsWithChildrenIds, ...excludedItemsIds]);
    const allExcludedItemsIds = uniqueIds([...excludedItemsIds, ...excludedDependantItemsIds, ...allExcludedItemsWithChildrenIds]);

    const request = new PublishContentRequest()
        .setIds(publishableIds)
        .setMessage(message || undefined)
        .setExcludedIds(allExcludedItemsIds)
        .setExcludeChildrenIds(allExcludedItemsWithChildrenIds);

    try {
        const taskId = await request.sendAndParse();
        showFeedback(i18n('dialog.publish.publishing', publishableIds.length));
        return taskId;
    } catch (e) {
        showError(i18n('dialog.publish.publishing.error'));
        return undefined;
    }
}
