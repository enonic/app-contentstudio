import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentIds} from '../../../../app/content/ContentIds';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {MoveContentRequest} from '../../../../app/resource/MoveContentRequest';
import {cleanupTask, trackTask} from '../../services/task.service';
import {$isWizard} from '../app.store';
import {getCurrentItems} from '../contentTreeSelection.store';

//
// * Types
//

type MoveDialogStore = {
    open: boolean;
    itemsCount: number;
    submitting: boolean;
    destinationId: string | null;
    destinationItem: ContentSummaryAndCompareStatus | null;
    destinationPath: string | null;
    excludedIds: string[];
    taskId?: TaskId;
    pendingTotal: number;
    pendingPrimaryName?: string;
    pendingDestinationPath?: string;
};

//
// * Store State
//

const initialState: MoveDialogStore = {
    open: false,
    itemsCount: 0,
    submitting: false,
    destinationId: null,
    destinationItem: null,
    destinationPath: null,
    excludedIds: [],
    taskId: undefined,
    pendingTotal: 0,
    pendingPrimaryName: undefined,
    pendingDestinationPath: undefined,
};

export const $moveDialog = map<MoveDialogStore>(structuredClone(initialState));

//
// * Derived State
//

export const $moveItemsCount = computed($moveDialog, ({itemsCount}) => itemsCount);
export const $moveCurrentItems = computed($moveDialog, ({open}) => (open ? getCurrentItems() : []));
export const $isMoveDialogReady = computed($moveDialog, ({open, submitting, itemsCount, destinationId}) => {
    return open && !submitting && itemsCount > 0 && !!destinationId;
});
export const $moveTaskId = computed($moveDialog, ({taskId}) => taskId);

let moveCompletionHandled = false;

//
// * Public API
//

export const openMoveDialog = (itemsCount = 1): void => {
    if (itemsCount <= 0) {
        return;
    }
    moveCompletionHandled = false;
    const excludedIds = getCurrentItems().map((item) => item.getContentId().toString());
    $moveDialog.set({
        open: true,
        itemsCount,
        submitting: false,
        destinationId: null,
        destinationItem: null,
        destinationPath: null,
        excludedIds,
        taskId: undefined,
        pendingTotal: 0,
        pendingPrimaryName: undefined,
        pendingDestinationPath: undefined,
    });
};

export const cancelMoveDialog = (): void => {
    const {submitting} = $moveDialog.get();
    if (submitting) {
        return;
    }
    resetMoveDialogContext();
};

export const resetMoveDialogContext = (): void => {
    const {taskId} = $moveDialog.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $moveDialog.set(structuredClone(initialState));
};

export const setMoveItemsCount = (itemsCount: number): void => {
    $moveDialog.setKey('itemsCount', itemsCount);
};

export const setMoveDestinationId = (destinationId: string | null): void => {
    $moveDialog.setKey('destinationId', destinationId);
    if (!destinationId) {
        $moveDialog.setKey('destinationItem', null);
        $moveDialog.setKey('destinationPath', null);
    }
};

export const setMoveDestinationItem = (item: ContentSummaryAndCompareStatus | null): void => {
    $moveDialog.setKey('destinationItem', item);
    $moveDialog.setKey('destinationId', item ? item.getContentId().toString() : null);
    $moveDialog.setKey('destinationPath', item?.getPath()?.toString() ?? null);
};

export const executeMoveDialogAction = async (): Promise<boolean> => {
    const state = $moveDialog.get();
    if (state.submitting || state.itemsCount === 0 || !state.destinationId) {
        return false;
    }

    const items = getCurrentItems();
    if (items.length === 0) {
        showError(i18n('notify.item.nothingToMove'));
        return false;
    }

    const destinationPath = state.destinationItem?.getPath();
    if (!destinationPath) {
        showError(i18n('notify.item.nothingToMove'));
        return false;
    }

    const contentIds = ContentIds.create()
        .fromContentIds(items.map(item => item.getContentId()))
        .build();
    const pendingTotal = items.length;
    const pendingPrimaryName = items[0]?.getDisplayName() || items[0]?.getPath()?.toString() || '';
    const pendingDestinationPath = destinationPath.toString();

    try {
        const taskId = await new MoveContentRequest(contentIds, destinationPath).sendAndParse();

        $moveDialog.set({
            ...state,
            submitting: true,
            taskId,
            pendingTotal,
            pendingPrimaryName,
            pendingDestinationPath,
        });

        trackTask(taskId, {
            onComplete: (resultState, message) => {
                if (resultState === 'SUCCESS') {
                    handleMoveSuccess();
                } else {
                    showError(message || i18n('notify.process.failed', i18n('action.move')));
                    resetMoveDialogContext();
                }
            },
        });

        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $moveDialog.set({
            ...$moveDialog.get(),
            submitting: false,
            taskId: undefined,
            pendingTotal: 0,
            pendingPrimaryName: undefined,
            pendingDestinationPath: undefined,
        });
        return false;
    }
};

const handleMoveSuccess = (): void => {
    if (moveCompletionHandled) return;
    moveCompletionHandled = true;

    const state = $moveDialog.get();
    const total = state.pendingTotal || state.itemsCount || 1;
    const destinationPath = state.pendingDestinationPath || state.destinationPath || '';
    const destinationLabel = destinationPath || i18n('field.root');
    const baseMessage = i18n(
        total > 1 ? 'notify.items.moved.to.multi' : 'notify.items.moved.to.single',
        total,
    );
    const message = $isWizard.get() ? baseMessage : `${baseMessage} ${destinationLabel}`;

    showSuccess(message);
    resetMoveDialogContext();
};
