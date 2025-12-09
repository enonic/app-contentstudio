import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {TaskEvent} from '@enonic/lib-admin-ui/task/TaskEvent';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskInfo} from '@enonic/lib-admin-ui/task/TaskInfo';
import {clampProgress} from '../../utils/cms/content/progress';
import {startProgress, completeProgress, resetProgress, updateProgress} from './progress.store';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentServerChangeItem} from '../../../../app/event/ContentServerChangeItem';
import {ArchiveContentRequest} from '../../../../app/resource/ArchiveContentRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {DeleteContentRequest} from '../../../../app/resource/DeleteContentRequest';
import {GetTaskInfoRequest} from '../../../../app/resource/GetTaskInfoRequest';
import {ResolveDeleteRequest} from '../../../../app/resource/ResolveDeleteRequest';
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
    taskProgress?: number;
    pendingAction?: DeleteAction;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
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
    taskProgress: undefined,
    pendingIds: [],
    pendingTotal: 0,
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
// const clampProgress = (value: number): number => {
//     if (!Number.isFinite(value)) {
//         return 0;
//     }
//     return Math.min(100, Math.max(0, Math.round(value)));
// };

//
// * Instance Guard
//

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;
let deleteTaskHandler: ((event: TaskEvent) => void) | undefined;
let deleteCompletionTimeout: ReturnType<typeof setTimeout> | undefined;

//
// * Helpers
//

const getAllTargetIds = (): ContentId[] => {
    const {items, dependants} = $deleteDialog.get();
    return [...items, ...dependants].map(item => item.getContentId());
};

const buildArchiveRequest = (items: ContentSummaryAndCompareStatus[], message: string): ArchiveContentRequest => {
    const request = new ArchiveContentRequest();
    items.forEach(item => request.addContentId(item.getContentId()));
    request.setArchiveMessage(message);
    return request;
};

const buildDeleteRequest = (items: ContentSummaryAndCompareStatus[]): DeleteContentRequest => {
    const request = new DeleteContentRequest();
    items.forEach(item => request.addContentPath(item.getContentSummary().getPath()));
    return request;
};

//
// * Public API
//

export const openDeleteDialog = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    resetProgress();
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
    if (deleteTaskHandler) {
        TaskEvent.un(deleteTaskHandler);
        deleteTaskHandler = undefined;
    }
    if (deleteCompletionTimeout) {
        clearTimeout(deleteCompletionTimeout);
        deleteCompletionTimeout = undefined;
    }
    $deleteDialog.set(structuredClone(initialState));
    resetProgress();
};

// TODO: Wire up archive message input in the dialog after design is ready
export const setDeleteArchiveMessage = (message: string): void => {
    $deleteDialog.setKey('archiveMessage', message);
};

export const ignoreDeleteInboundDependencies = (): void => {
    $deleteDialog.setKey('inboundIgnored', true);
};

export const $deleteProgress = computed($deleteDialog, ({pendingIds, pendingTotal, submitting, taskProgress}): number => {
    if (!submitting) {
        return 0;
    }

    if (typeof taskProgress === 'number') {
        return clampProgress(taskProgress);
    }

    const total = pendingTotal || pendingIds.length;
    if (total === 0) {
        return 0;
    }
    const completed = Math.max(0, total - pendingIds.length);
    const ratio = completed / total;
    return clampProgress(ratio * 100);
});

export const executeDeleteDialogAction = async (action: DeleteAction): Promise<boolean> => {
    const state = $deleteDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    const totalCount = $deleteItemsCount.get();
    const pendingIds = getAllTargetIds().map(id => id.toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();

    const request = action === 'archive'
        ? buildArchiveRequest(state.items, state.archiveMessage)
        : buildDeleteRequest(state.items);

    try {
        startProgress();
        $deleteDialog.set({
            ...state,
            submitting: true,
            taskProgress: 0,
            pendingAction: action,
            pendingIds,
            pendingTotal: totalCount || state.items.length,
            pendingPrimaryName,
        });

        const taskId = await request.sendAndParse();
        trackDeleteTask(taskId);
        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $deleteDialog.set({
            ...$deleteDialog.get(),
            submitting: false,
            taskProgress: undefined,
            pendingAction: undefined,
            pendingIds: [],
            pendingTotal: 0,
        });
        resetProgress();
        return false;
    } finally {
        // resetProgress();
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
        const result = await new ResolveDeleteRequest(ids).sendAndParse();

        if (currentInstance !== instanceId) return;

        const dependantIds = result.getContentIds().filter(id => !hasContentIdInIds(id, ids));
        const dependants = dependantIds.length > 0
            ? await new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(dependantIds)
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

const trackDeleteTask = (taskId: TaskId): void => {
    if (deleteTaskHandler) {
        TaskEvent.un(deleteTaskHandler);
    }
    if (deleteCompletionTimeout) {
        clearTimeout(deleteCompletionTimeout);
        deleteCompletionTimeout = undefined;
    }

    let hasEvents = false;

    const handleTaskInfo = (taskInfo: TaskInfo): void => {
        if (taskInfo.getState() === TaskState.FINISHED) {
            $deleteDialog.setKey('taskProgress', 100);
            completeProgress();
            if (deleteTaskHandler) { TaskEvent.un(deleteTaskHandler); deleteTaskHandler = undefined; }
            if ($deleteDialog.get().pendingIds.length === 0) {
                deleteCompletionTimeout = setTimeout(() => {
                    if ($deleteDialog.get().submitting) {
                        resetDeleteDialogContext();
                    }
                }, 3000);
            }
            return;
        }

        if (taskInfo.getState() === TaskState.FAILED) {
            $deleteDialog.set({
                ...$deleteDialog.get(),
                submitting: false,
                taskProgress: undefined,
                pendingAction: undefined,
                pendingIds: [],
                pendingTotal: 0,
            });
            if (deleteTaskHandler) {
                TaskEvent.un(deleteTaskHandler);
                deleteTaskHandler = undefined;
            }
            if (deleteCompletionTimeout) {
                clearTimeout(deleteCompletionTimeout);
                deleteCompletionTimeout = undefined;
            }
            showError(i18n('notify.delete.failed'));
            return;
        }

        const nextProgress = clampProgress(taskInfo.getProgressPercentage());
        $deleteDialog.setKey('taskProgress', nextProgress);
        updateProgress(nextProgress);
    };

    deleteTaskHandler = (event) => {
        if (!event || !event.getTaskInfo().getId().equals(taskId)) {
            return;
        }

        hasEvents = true;
        handleTaskInfo(event.getTaskInfo());
    };

    TaskEvent.on(deleteTaskHandler);

    void new GetTaskInfoRequest(taskId).sendAndParse().then(taskInfo => {
        if (!deleteTaskHandler || hasEvents || !taskInfo.getId().equals(taskId)) {
            return;
        }
        handleTaskInfo(taskInfo);
    }).catch(() => undefined);
};

//
// * Completion Handling
//

const handleCompletionEvent = (changeItems: ContentServerChangeItem[], kind: DeleteAction): void => {
    const ids = new Set(changeItems.map(item => item.getContentId().toString()));
    const state = $deleteDialog.get();
    const {pendingAction, pendingIds} = state;
    const isPendingMatch = pendingAction === kind && pendingIds.length > 0;

    if (state.open) {
        const {removedMain, removedDependant} = removeItemsByIds(ids);
        if (removedMain && state.items.length === 0) {
            resetDeleteDialogContext();
            return;
        }

        if (removedMain || removedDependant) {
            reloadDeleteDialogDataDebounced();
        }
    }

    if (!isPendingMatch) {
        return;
    }

    const remaining = pendingIds.filter(id => !ids.has(id));
    if (remaining.length === 0) {
        const total = state.pendingTotal || pendingIds.length;
        if (pendingAction === 'archive') {
            const message = total > 1
                ? i18n('dialog.archive.success.multiple', total)
                : i18n('dialog.archive.success.single', state.pendingPrimaryName ?? '');
            NotifyManager.get().showSuccess(message);
        } else if (pendingAction === 'delete') {
            const message = total > 1
                ? i18n('notify.deleted.success.multiple', total)
                : i18n('notify.deleted.success.single', state.pendingPrimaryName ?? '');
            NotifyManager.get().showSuccess(message);
        }
        resetDeleteDialogContext();
        return;
    }

    $deleteDialog.setKey('pendingIds', remaining);
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
    handleCompletionEvent(event.data, 'archive');
});

$contentDeleted.subscribe((event) => {
    if (!event) {
        return;
    }
    handleCompletionEvent(event.data, 'delete');
});
