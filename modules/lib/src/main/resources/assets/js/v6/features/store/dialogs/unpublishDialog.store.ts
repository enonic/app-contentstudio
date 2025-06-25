import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {resolveUnpublish, unpublishContent} from '../../api/unpublish';
import {trackTask, cleanupTask} from '../../services/task.service';
import {hasContentIdInIds} from '../../utils/cms/content/ids';
import {sortDependantsByInbound} from '../../utils/cms/content/sortDependants';
import {createDebounce} from '../../utils/timing/createDebounce';
import {$contentArchived, $contentCreated, $contentDeleted, $contentUnpublished, $contentUpdated} from '../socket.store';

//
// * Store state
//

type UnpublishDialogStore = {
    open: boolean;
    loading: boolean;
    failed: boolean;
    items: ContentSummaryAndCompareStatus[];
    dependants: ContentSummaryAndCompareStatus[];
    inboundTargets: ContentId[];
    inboundIgnored: boolean;
    referenceIds: string[]; // IDs of content that references items/dependants (for change detection)
};

type UnpublishDialogPendingStore = {
    submitting: boolean;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
    taskId?: TaskId;
};

// Initial state snapshot for reset
const initialState: UnpublishDialogStore = {
    open: false,
    loading: false,
    failed: false,
    items: [],
    dependants: [],
    inboundTargets: [],
    inboundIgnored: true,
    referenceIds: [],
};

const initialPendingState: UnpublishDialogPendingStore = {
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    pendingPrimaryName: undefined,
    taskId: undefined,
};

export const $unpublishDialog = map<UnpublishDialogStore>(structuredClone(initialState));
export const $unpublishDialogPending = map<UnpublishDialogPendingStore>(initialPendingState);

//
// * Derived state
//

export const $unpublishItemsCount = computed($unpublishDialog, ({items, dependants}) => items.length + dependants.length);

export const $isUnpublishTargetSite = computed($unpublishDialog, ({items, dependants}) => {
    return [...items, ...dependants].some(item => item.getContentSummary().isSite());
});

export const $isUnpublishBlockedByInbound = computed($unpublishDialog, ({inboundTargets, inboundIgnored}) => {
    return inboundTargets.length > 0 && !inboundIgnored;
});

export const $unpublishInboundIds = computed($unpublishDialog, ({inboundTargets}) => inboundTargets.map(id => id.toString()));

export const $isUnpublishDialogReady = computed([$unpublishDialog, $unpublishDialogPending, $isUnpublishBlockedByInbound], (state, pending, hasInbound) => {
    return state.open && !state.loading && !state.failed && !pending.submitting && state.items.length > 0 && !hasInbound;
});

export const $unpublishTaskId = computed($unpublishDialogPending, ({taskId}) => taskId);

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;

//
// * Helpers
//

const getAllTargetIds = (): ContentId[] => {
    const {items, dependants} = $unpublishDialog.get();
    return [...items, ...dependants].map(item => item.getContentId());
};

//
// * Public API
//

export const openUnpublishDialog = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    $unpublishDialog.set({
        ...structuredClone(initialState),
        open: true,
        items,
        inboundIgnored: true,
    });
    $unpublishDialogPending.set(initialPendingState);
};

export const cancelUnpublishDialog = (): void => {
    const {submitting, pendingIds} = $unpublishDialogPending.get();
    if (submitting || pendingIds.length > 0) {
        return;
    }

    resetUnpublishDialogContext();
};

export const resetUnpublishDialogContext = (): void => {
    instanceId += 1;
    const {taskId} = $unpublishDialogPending.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $unpublishDialog.set(initialState);
    $unpublishDialogPending.set(initialPendingState);
};

export const ignoreUnpublishInboundDependencies = (): void => {
    $unpublishDialog.setKey('inboundIgnored', true);
};

export const executeUnpublishDialogAction = async (): Promise<boolean> => {
    const {loading, failed, items} = $unpublishDialog.get();
    const {submitting} = $unpublishDialogPending.get();
    if (loading || failed || submitting || items.length === 0) {
        return false;
    }
    return confirmUnpublishAction(items);
};

export const confirmUnpublishAction = async (selectedItems: ContentSummaryAndCompareStatus[]): Promise<boolean> => {
    const {items, loading, failed} = $unpublishDialog.get();
    const {submitting} = $unpublishDialogPending.get();
    if (submitting || loading || failed) {
        return false;
    }

    const itemsToUnpublish = selectedItems.length > 0 ? selectedItems : items;
    if (itemsToUnpublish.length === 0) {
        return false;
    }

    const pendingIds = getAllTargetIds().map(id => id.toString());
    const pendingPrimaryName = itemsToUnpublish[0]?.getDisplayName() || itemsToUnpublish[0]?.getPath()?.toString();
    const pendingTotal = $unpublishItemsCount.get() || pendingIds.length;

    try {
        const taskId = await unpublishContent(itemsToUnpublish);

        $unpublishDialogPending.set({
            submitting: true,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
            taskId,
        });

        trackTask(taskId, {
            onComplete: (state, message) => {
                if (state === 'SUCCESS') {
                    const total = pendingTotal || pendingIds.length;
                    const successMessage = total > 1
                        ? i18n('dialog.unpublish.success.multiple', total)
                        : i18n('dialog.unpublish.success.single', pendingPrimaryName ?? '');
                    showSuccess(successMessage);
                } else {
                    showError(message);
                }
                resetUnpublishDialogContext();
            },
        });

        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $unpublishDialogPending.set(initialPendingState);
        $unpublishDialog.setKey('failed', true);
        return false;
    }
};

//
// * Data loading
//

const reloadUnpublishDialogData = async (): Promise<void> => {
    instanceId += 1;
    const currentInstance = instanceId;
    const {items, open} = $unpublishDialog.get();
    if (!open || items.length === 0) {
        return;
    }

    $unpublishDialog.setKey('loading', true);
    $unpublishDialog.setKey('failed', false);

    try {
        const ids = items.map(item => item.getContentId());
        const {dependants, inboundTargets, referenceIds} = await resolveAllDependantsAndInbound(currentInstance, ids);

        $unpublishDialog.set({
            ...$unpublishDialog.get(),
            dependants: sortDependantsByInbound(dependants, inboundTargets),
            inboundTargets,
            inboundIgnored: inboundTargets.length === 0,
            referenceIds,
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== instanceId) {
            return;
        }
        $unpublishDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        if (currentInstance === instanceId) {
            $unpublishDialog.setKey('loading', false);
        }
    }
};

const reloadUnpublishDialogDataDebounced = createDebounce(() => {
    void reloadUnpublishDialogData();
}, 100);

const resolveAllDependantsAndInbound = async (currentInstance: number, roots: ContentId[]): Promise<{dependants: ContentSummaryAndCompareStatus[]; inboundTargets: ContentId[]; referenceIds: string[]}> => {
    const result = await resolveUnpublish(roots);

    if (currentInstance !== instanceId || !result) {
        return {dependants: [], inboundTargets: [], referenceIds: []};
    }

    // Filter out root IDs from dependants
    const dependantIds = result.contentIds.filter(id => !hasContentIdInIds(id, roots));
    const dependants = await fetchContentSummariesWithStatus(dependantIds);

    if (currentInstance !== instanceId) {
        return {dependants: [], inboundTargets: [], referenceIds: []};
    }

    const inboundTargets = result.inboundDependencies.map(dep => dep.id);

    // Extract IDs of content that references items (for change detection)
    const referenceIds = result.inboundDependencies.flatMap(dep =>
        dep.inboundDependencies.map(id => id.toString())
    );

    return {dependants, inboundTargets, referenceIds};
};

//
// * State mutation helpers
//

const removeItemsByIds = (ids: Set<string>): {removedMain: boolean; removedDependant: boolean} => {
    const {items, dependants} = $unpublishDialog.get();

    const newItems = items.filter(item => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter(item => !ids.has(item.getContentId().toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain) {
        $unpublishDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $unpublishDialog.setKey('dependants', newDependants);
    }

    return {removedMain, removedDependant};
};

const patchItemsWithUpdates = (updates: ContentSummaryAndCompareStatus[]): {patchedMain: boolean; patchedDependants: boolean} => {
    const {items, dependants} = $unpublishDialog.get();
    const updateMap = new Map(updates.map(update => [update.getId(), update]));

    const patchedMain = items.some(item => updateMap.has(item.getId()));
    const patchedDependants = dependants.some(item => updateMap.has(item.getId()));

    if (patchedMain) {
        $unpublishDialog.setKey('items', items.map(item => updateMap.get(item.getId()) ?? item));
    }
    if (patchedDependants) {
        $unpublishDialog.setKey('dependants', dependants.map(item => updateMap.get(item.getId()) ?? item));
    }

    return {patchedMain, patchedDependants};
};

const isDialogActive = (): boolean => {
    const {open, items} = $unpublishDialog.get();
    return open && items.length > 0;
};

//
// * Completion handling
//

/** Handles external unpublish events (not triggered by this dialog's action) */
const handleExternalUnpublishEvent = (changeItems: ContentSummaryAndCompareStatus[]): void => {
    const ids = new Set(changeItems.map(item => item.getContentId().toString()));
    const state = $unpublishDialog.get();

    // If dialog is open but not submitting, update items/dependants
    if (state.open && !$unpublishDialogPending.get().submitting) {
        const {removedMain, removedDependant} = removeItemsByIds(ids);
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
// * Subscriptions
//

$unpublishDialog.subscribe(({open, loading}, prev) => {
    const wasOpen = !!prev?.open;
    if (!open || wasOpen || loading) {
        return;
    }
    void reloadUnpublishDialogData();
});

$contentCreated.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }
    reloadUnpublishDialogDataDebounced();
});

$contentUpdated.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }

    const {referenceIds} = $unpublishDialog.get();
    const updatedIds = new Set(event.data.map(item => item.getId()));

    const {patchedMain, patchedDependants} = patchItemsWithUpdates(event.data);

    // Check if referencing content was updated (might have removed reference)
    const referenceUpdated = referenceIds.some(id => updatedIds.has(id));

    if (patchedMain || patchedDependants || referenceUpdated) {
        reloadUnpublishDialogDataDebounced();
    }
});

$contentArchived.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }

    const archivedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(archivedIds);

    if ($unpublishDialog.get().items.length === 0) {
        resetUnpublishDialogContext();
        return;
    }

    if (removedMain || removedDependant) {
        reloadUnpublishDialogDataDebounced();
    }
});

$contentDeleted.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }

    const {referenceIds} = $unpublishDialog.get();
    const deletedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(deletedIds);

    if ($unpublishDialog.get().items.length === 0) {
        resetUnpublishDialogContext();
        return;
    }

    // Check if referencing content was deleted (removes reference)
    const referenceDeleted = referenceIds.some(id => deletedIds.has(id));

    if (removedMain || removedDependant || referenceDeleted) {
        reloadUnpublishDialogDataDebounced();
    }
});

$contentUnpublished.subscribe((event) => {
    if (!event) {
        return;
    }
    handleExternalUnpublishEvent(event.data);
});
