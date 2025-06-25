import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {atom, computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {duplicateContent, type DuplicateContentParams, getDescendantsOfContents} from '../../api/duplicate';
import {cleanupTask, trackTask} from '../../services/task.service';
import {hasContentIdInIds, isIdsEqual} from '../../utils/cms/content/ids';
import {createDebounce} from '../../utils/timing/createDebounce';
import {$isWizard} from '../app.store';
import {$contentArchived, $contentCreated, $contentDeleted, $contentDuplicated, $contentUpdated} from '../socket.store';

//
// * Types
//

type DuplicateDialogStore = {
    open: boolean;
    loading: boolean;
    failed: boolean;
    items: ContentSummaryAndCompareStatus[];
    dependants: ContentSummaryAndCompareStatus[];
    includeChildrenIds: ContentId[];
    submitting: boolean;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
    taskId?: TaskId;
};

//
// * Store State
//

const initialDuplicateDialogState: DuplicateDialogStore = {
    open: false,
    loading: false,
    failed: false,
    items: [],
    dependants: [],
    includeChildrenIds: [],
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    pendingPrimaryName: undefined,
    taskId: undefined,
};

export const $duplicateDialog = map<DuplicateDialogStore>(structuredClone(initialDuplicateDialogState));
export const $duplicateDraftIncludeChildrenIds = atom<ContentId[]>([]);

// ! ID of the current fetch operation
// Used to cancel old ongoing fetch operations if the instanceId changes
let instanceId = 0;
let duplicateCompletionHandled = false;

//
// * Derived State
//

export const $duplicateItemsCount = computed($duplicateDialog, ({items, dependants}) => items.length + dependants.length);

export const $isDuplicateSelectionSynced = computed([$duplicateDialog, $duplicateDraftIncludeChildrenIds], (state, draft) => {
    return isIdsEqual(state.includeChildrenIds, draft);
});

export const $isDuplicateDialogReady = computed([$duplicateDialog, $isDuplicateSelectionSynced], (state, synced) => {
    return state.open && synced && !state.loading && !state.failed && !state.submitting && state.items.length > 0;
});

export const $duplicateTaskId = computed($duplicateDialog, ({taskId}) => taskId);

//
// * Public API
//

export const openDuplicateDialog = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    duplicateCompletionHandled = false;

    const includeChildrenIds = items
        .filter(item => item.hasChildren())
        .map(item => item.getContentId());

    $duplicateDraftIncludeChildrenIds.set(includeChildrenIds);

    $duplicateDialog.set({
        ...structuredClone(initialDuplicateDialogState),
        open: true,
        items,
        includeChildrenIds,
    });
};

export const cancelDuplicateDialog = (): void => {
    const {submitting} = $duplicateDialog.get();
    if (submitting) {
        return;
    }
    resetDuplicateDialogContext();
};

export const resetDuplicateDialogContext = (): void => {
    instanceId += 1;
    const {taskId} = $duplicateDialog.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $duplicateDraftIncludeChildrenIds.set([]);
    $duplicateDialog.set(structuredClone(initialDuplicateDialogState));
};

export const toggleDuplicateIncludeChildren = (id: ContentId, include: boolean): void => {
    const draft = $duplicateDraftIncludeChildrenIds.get();

    const hasId = hasContentIdInIds(id, draft);
    if (include && hasId) return;
    if (!include && !hasId) return;

    const next = include
        ? [...draft, id]
        : draft.filter(itemId => !itemId.equals(id));

    $duplicateDraftIncludeChildrenIds.set(next);
};

export const applyDuplicateIncludeChildrenSelection = (): void => {
    const draft = $duplicateDraftIncludeChildrenIds.get();
    $duplicateDialog.setKey('includeChildrenIds', [...draft]);
};

export const cancelDuplicateIncludeChildrenSelection = (): void => {
    const {includeChildrenIds} = $duplicateDialog.get();
    $duplicateDraftIncludeChildrenIds.set([...includeChildrenIds]);
};

export const executeDuplicateDialogAction = async (): Promise<boolean> => {
    const state = $duplicateDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    const parentPath = state.items[0]?.getPath()?.getParentPath()?.toString();
    const unsubscribeOpenTab = setupOpenTabListener(parentPath);

    const includeChildrenSet = new Set(state.includeChildrenIds.map(id => id.toString()));
    const params: DuplicateContentParams[] = state.items.map(item => {
        const includeChildren = includeChildrenSet.has(item.getContentId().toString());
        return {contentId: item.getContentId(), includeChildren};
    });

    const pendingIds = state.items.map(item => item.getContentId().toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();
    const pendingTotal = state.items.length;

    try {
        const taskId = await duplicateContent(params);

        $duplicateDialog.set({
            ...$duplicateDialog.get(),
            submitting: true,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
            taskId,
        });

        trackTask(taskId, {
            onComplete: (resultState, message) => {
                if (resultState === 'SUCCESS') {
                    handleDuplicateSuccess();
                } else {
                    showError(message || i18n('notify.duplicate.failed'));
                    unsubscribeOpenTab();
                    resetDuplicateDialogContext();
                }
            },
        });

        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        unsubscribeOpenTab();
        $duplicateDialog.set({
            ...$duplicateDialog.get(),
            submitting: false,
            pendingIds: [],
            pendingTotal: 0,
            pendingPrimaryName: undefined,
            taskId: undefined,
        });
        return false;
    }
};

//
// * Utilities
//

const OPEN_TAB_TIMEOUT_MS = 300_000; // 5 minutes max wait for socket event

const setupOpenTabListener = (parentPath: string | undefined): (() => void) => {
    if (!$isWizard.get() || !parentPath) {
        return () => {};
    }

    const startedAt = Date.now();

    const cleanup = (): void => {
        unsubscribe();
        clearTimeout(timeoutId);
    };

    // Auto-cleanup after timeout to prevent orphaned listeners
    const timeoutId = setTimeout(cleanup, OPEN_TAB_TIMEOUT_MS);

    const unsubscribe = $contentDuplicated.subscribe((event) => {
        if (!event) return;

        // Ignore events from before we started (prevents stale matches)
        if (event.timestamp < startedAt) {
            return;
        }

        const matchedItem = event.data.find(
            item => item.getPath()?.getParentPath()?.toString() === parentPath
        );

        if (matchedItem) {
            new EditContentEvent([matchedItem]).fire();
            cleanup();
        }
    });

    return unsubscribe;
};

//
// * Internal Helpers
//

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const {open, items} = $duplicateDialog.get();
    return open && items.length > 0;
};

/** Remove items by IDs from both main items and dependant items */
const removeItemsByIds = (ids: Set<string>): {removedMain: boolean; removedDependant: boolean} => {
    const {items, dependants} = $duplicateDialog.get();

    const newItems = items.filter(item => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter(item => !ids.has(item.getContentId().toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain) {
        $duplicateDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $duplicateDialog.setKey('dependants', newDependants);
    }

    return {removedMain, removedDependant};
};

/** Patch items with updated data, keeping items not in the update */
const patchItemsWithUpdates = (updates: ContentSummaryAndCompareStatus[]): {patchedMain: boolean; patchedDependants: boolean} => {
    const {items, dependants} = $duplicateDialog.get();
    const updateMap = new Map(updates.map(update => [update.getId(), update]));

    const patchedMain = items.some(item => updateMap.has(item.getId()));
    const patchedDependants = dependants.some(item => updateMap.has(item.getId()));

    if (patchedMain) {
        $duplicateDialog.setKey('items', items.map(item => updateMap.get(item.getId()) ?? item));
    }
    if (patchedDependants) {
        $duplicateDialog.setKey('dependants', dependants.map(item => updateMap.get(item.getId()) ?? item));
    }

    return {patchedMain, patchedDependants};
};

//
// * Internal Subscriptions
//

// Reload data when dialog opens OR includeChildrenIds change
$duplicateDialog.subscribe((state, oldState) => {
    const {open, includeChildrenIds} = state;
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
});

//
// * Socket Event Handlers
//

// Handle content created: reload dependencies as new content might be a child
$contentCreated.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }
    reloadDuplicateDialogDataDebounced();
});

// Handle content updates: patch main items, reload if dependants affected
$contentUpdated.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }

    const {dependants} = $duplicateDialog.get();
    const updatedIds = new Set(event.data.map(item => item.getId()));

    const {patchedMain, patchedDependants} = patchItemsWithUpdates(event.data);

    const dependantsUpdated = dependants.some(item => updatedIds.has(item.getId()));

    if (patchedMain || patchedDependants || dependantsUpdated) {
        reloadDuplicateDialogDataDebounced();
    }
});

// Handle content deletion: remove from lists, close if no items left, reload if needed
$contentDeleted.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }

    const deletedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(deletedIds);

    if ($duplicateDialog.get().items.length === 0) {
        resetDuplicateDialogContext();
        return;
    }

    if (removedMain || removedDependant) {
        reloadDuplicateDialogDataDebounced();
    }
});

// Handle content archived: same as delete
$contentArchived.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }

    const archivedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(archivedIds);

    if ($duplicateDialog.get().items.length === 0) {
        resetDuplicateDialogContext();
        return;
    }

    if (removedMain || removedDependant) {
        reloadDuplicateDialogDataDebounced();
    }
});

//
// * Completion Handling
//

const handleDuplicateSuccess = (): void => {
    if (duplicateCompletionHandled) return;

    duplicateCompletionHandled = true;

    const state = $duplicateDialog.get();
    const total = state.pendingTotal || state.items.length || state.pendingIds.length;
    const primaryName = state.pendingPrimaryName
        || state.items[0]?.getDisplayName()
        || state.items[0]?.getPath()?.toString()
        || '';

    const singleMessage = i18n('dialog.duplicate.success.single', primaryName);
    const multipleMessage = i18n('dialog.duplicate.success.multiple', total);
    const message = total > 1 ? multipleMessage : singleMessage;

    showSuccess(message);
    resetDuplicateDialogContext();
};

//
// * Requests
//

async function reloadDuplicateDialogData(): Promise<void> {
    instanceId += 1;
    const currentInstance = instanceId;
    const {items, includeChildrenIds, open} = $duplicateDialog.get();
    if (!open || items.length === 0) {
        return;
    }

    const includeSet = new Set(includeChildrenIds.map(id => id.toString()));
    const rootsWithChildren = items.filter(item => includeSet.has(item.getContentId().toString()) && item.hasChildren());

    if (rootsWithChildren.length === 0) {
        $duplicateDialog.setKey('dependants', []);
        return;
    }

    $duplicateDialog.setKey('loading', true);
    $duplicateDialog.setKey('failed', false);

    try {
        const paths = rootsWithChildren.map(item => item.getContentSummary().getPath());
        const ids = await getDescendantsOfContents(paths);
        if (currentInstance !== instanceId) return;

        const dependants = ids.length > 0
            ? await fetchContentSummariesWithStatus(ids)
            : [];

        if (currentInstance !== instanceId) return;

        $duplicateDialog.set({
            ...$duplicateDialog.get(),
            dependants,
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== instanceId) return;
        $duplicateDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        if (currentInstance === instanceId) {
            $duplicateDialog.setKey('loading', false);
        }
    }
}

/** Debounced reload to batch rapid server events (100ms delay) */
const reloadDuplicateDialogDataDebounced = createDebounce(reloadDuplicateDialogData, 100);
