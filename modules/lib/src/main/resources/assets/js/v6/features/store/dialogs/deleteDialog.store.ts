import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentServerChangeItem} from '../../../../app/event/ContentServerChangeItem';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {archiveContent, deleteContent, resolveForDelete} from '../../api/delete';
import {trackTask, cleanupTask} from '../../services/task.service';
import {hasContentIdInIds} from '../../utils/cms/content/ids';
import {sortDependantsByInbound} from '../../utils/cms/content/sortDependants';
import {createDebounce} from '../../utils/timing/createDebounce';
import {$contentArchived, $contentCreated, $contentDeleted, $contentUpdated} from '../socket.store';

//
// * Types
//

export type DeleteAction = 'archive' | 'delete';

//
// * Store State
//

type DeleteDialogStore = {
    // Dialog state
    open: boolean;
    loading: boolean;
    failed: boolean;
    // Content
    items: ContentSummaryAndCompareStatus[];
    dependants: ContentSummaryAndCompareStatus[];
    archiveMessage: string;
    // Validation
    inboundTargets: ContentId[];
    inboundIgnored: boolean;
    // Pending operation (after dialog closes)
    submitting: boolean;
    pendingAction?: DeleteAction;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
    taskId?: TaskId;
};

const initialState: DeleteDialogStore = {
    open: false,
    loading: false,
    failed: false,
    items: [],
    dependants: [],
    archiveMessage: '',
    inboundTargets: [],
    inboundIgnored: false,
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    taskId: undefined,
};

export const $deleteDialog = map<DeleteDialogStore>(structuredClone(initialState));

//
// * Derived State
//

export const $deleteItemsCount = computed($deleteDialog, ({items, dependants}) => items.length + dependants.length);

export const $isDeleteTargetSite = computed($deleteDialog, ({items, dependants}) => {
    return [...items, ...dependants].some(item => item.getContentSummary().isSite());
});

export const $isDeleteBlockedByInbound = computed($deleteDialog, ({inboundTargets, inboundIgnored}) => {
    return inboundTargets.length > 0 && !inboundIgnored;
});

export const $deleteInboundIds = computed($deleteDialog, ({inboundTargets}) => {
    return inboundTargets.map(id => id.toString());
});

export const $isDeleteDialogReady = computed([$deleteDialog, $isDeleteBlockedByInbound], (state, isBlocked) => {
    return state.open && !state.loading && !state.failed && !state.submitting && state.items.length > 0 && !isBlocked;
});
// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;

//
// * Helpers
//

const getAllTargetIds = (): ContentId[] => {
    const {items, dependants} = $deleteDialog.get();
    return [...items, ...dependants].map(item => item.getContentId());
};

const getArchiveContentIds = (items: ContentSummaryAndCompareStatus[]): ContentId[] => {
    return items.map(item => item.getContentId());
};

const getDeleteContentPaths = (items: ContentSummaryAndCompareStatus[]) => {
    return items.map(item => item.getContentSummary().getPath());
};

//
// * Public API
//

export const openDeleteDialog = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    $deleteDialog.set({
        ...structuredClone(initialState),
        open: true,
        items,
    });
};

export const cancelDeleteDialog = (): void => {
    const {pendingAction} = $deleteDialog.get();
    if (pendingAction) {
        return;
    }

    resetDeleteDialogContext();
};

export const resetDeleteDialogContext = (): void => {
    instanceId += 1;
    const {taskId} = $deleteDialog.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $deleteDialog.set(structuredClone(initialState));
};

// TODO: Wire up archive message input in the dialog after design is ready
export const setDeleteArchiveMessage = (message: string): void => {
    $deleteDialog.setKey('archiveMessage', message);
};

export const ignoreDeleteInboundDependencies = (): void => {
    $deleteDialog.setKey('inboundIgnored', true);
};

export const $deleteTaskId = computed($deleteDialog, ({taskId}) => taskId);

export const executeDeleteDialogAction = async (action: DeleteAction): Promise<boolean> => {
    const state = $deleteDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    const totalCount = $deleteItemsCount.get();
    const pendingIds = getAllTargetIds().map(id => id.toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();
    const pendingTotal = totalCount || state.items.length;

    try {
        const taskId = action === 'archive'
            ? await archiveContent(getArchiveContentIds(state.items), state.archiveMessage)
            : await deleteContent(getDeleteContentPaths(state.items));

        $deleteDialog.set({
            ...state,
            submitting: true,
            pendingAction: action,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
            taskId,
        });

        trackTask(taskId, {
            onComplete: (resultState, message) => {
                if (resultState === 'SUCCESS') {
                    const total = pendingTotal || pendingIds.length;
                    if (action === 'archive') {
                        const successMessage = total > 1
                            ? i18n('dialog.archive.success.multiple', total)
                            : i18n('dialog.archive.success.single', pendingPrimaryName ?? '');
                        showSuccess(successMessage);
                    } else {
                        const successMessage = total > 1
                            ? i18n('notify.deleted.success.multiple', total)
                            : i18n('notify.deleted.success.single', pendingPrimaryName ?? '');
                        showSuccess(successMessage);
                    }
                } else {
                    showError(message);
                }
                resetDeleteDialogContext();
            },
        });

        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $deleteDialog.set({
            ...$deleteDialog.get(),
            submitting: false,
            pendingAction: undefined,
            pendingIds: [],
            pendingTotal: 0,
            taskId: undefined,
        });
        return false;
    }
};

//
// * Internal Helpers
//

const reloadDeleteDialogData = async (): Promise<void> => {
    const currentInstance = instanceId;
    const {items, open, loading} = $deleteDialog.get();
    if (!open || items.length === 0 || loading) {
        return;
    }

    $deleteDialog.setKey('loading', true);
    $deleteDialog.setKey('failed', false);

    try {
        const ids = items.map(item => item.getContentId());
        const result = await resolveForDelete(ids);

        if (currentInstance !== instanceId) return;

        const dependantIds = result.getContentIds().filter(id => !hasContentIdInIds(id, ids));
        const dependants = dependantIds.length > 0
            ? await fetchContentSummariesWithStatus(dependantIds)
            : [];

        if (currentInstance !== instanceId) return;

        const inboundTargets = result.getInboundDependencies().map(dep => dep.getId());

        $deleteDialog.set({
            ...$deleteDialog.get(),
            dependants: sortDependantsByInbound(dependants, inboundTargets),
            inboundTargets,
            inboundIgnored: inboundTargets.length === 0,
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== instanceId) return;

        $deleteDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        instanceId += 1;
        $deleteDialog.setKey('loading', false);
    }
};

const reloadDeleteDialogDataDebounced = createDebounce(() => {
    void reloadDeleteDialogData();
}, 100);

/** Patch items with updated data, keeping items not in the update */
const patchItemsWithUpdates = (updates: ContentSummaryAndCompareStatus[]): boolean => {
    const {items} = $deleteDialog.get();
    const updateMap = new Map(updates.map(u => [u.getId(), u]));

    const hasUpdates = items.some(item => updateMap.has(item.getId()));
    if (!hasUpdates) return false;

    const patchedItems = items.map(item => updateMap.get(item.getId()) ?? item);
    $deleteDialog.setKey('items', patchedItems);
    return true;
};

/** Remove items by IDs from both main items and dependants */
const removeItemsByIds = (ids: Set<string>): {removedMain: boolean; removedDependant: boolean} => {
    const {items, dependants} = $deleteDialog.get();

    const newItems = items.filter(item => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter(item => !ids.has(item.getContentId().toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain) {
        $deleteDialog.setKey('items', newItems);
    }
    if (removedDependant) {
        $deleteDialog.setKey('dependants', newDependants);
    }

    return {removedMain, removedDependant};
};

//
// * Completion Handling
//

/** Handles external delete/archive events (not triggered by this dialog's action) */
const handleExternalDeleteEvent = (changeItems: ContentServerChangeItem[]): void => {
    const ids = new Set(changeItems.map(item => item.getContentId().toString()));
    const state = $deleteDialog.get();

    // If dialog is open but not submitting, update items/dependants
    if (state.open && !state.submitting) {
        const {removedMain, removedDependant} = removeItemsByIds(ids);
        if (removedMain && state.items.length === 0) {
            resetDeleteDialogContext();
            return;
        }

        if (removedMain || removedDependant) {
            reloadDeleteDialogDataDebounced();
        }
    }
};

//
// * Internal Subscriptions
//

// Reload data when dialog opens
$deleteDialog.subscribe(({open, loading}, oldState) => {
    const wasOpen = !!oldState?.open;
    if (!open || wasOpen || loading) return;
    reloadDeleteDialogData();
});

//
// * Socket Event Handlers
//

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const {open, items} = $deleteDialog.get();
    return open && items.length > 0;
};

// Handle content created: reload dependencies as new content might be a child or dependency
$contentCreated.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    // New content could be a child of items being deleted
    reloadDeleteDialogDataDebounced();
});

// Handle content updates: patch main items, reload if dependants affected
$contentUpdated.subscribe((event) => {
    if (!event || !isDialogActive()) return;

    const {dependants} = $deleteDialog.get();
    const updatedIds = new Set(event.data.map(item => item.getId()));

    // Patch main items with updated data (display name, status, etc.)
    patchItemsWithUpdates(event.data);

    // Reload when dependants change - dependency graph might have changed
    const hasDependantUpdates = dependants.some(item => updatedIds.has(item.getId()));
    if (hasDependantUpdates) {
        reloadDeleteDialogDataDebounced();
    }
});

$contentArchived.subscribe((event) => {
    if (!event) {
        return;
    }
    handleExternalDeleteEvent(event.data);
});

$contentDeleted.subscribe((event) => {
    if (!event) {
        return;
    }
    handleExternalDeleteEvent(event.data);
});
