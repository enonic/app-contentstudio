import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { atom, computed, map } from 'nanostores';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { EditContentEvent } from '../../../../app/event/EditContentEvent';
import { duplicateContent, type DuplicateContentParams } from '../api/duplicate.api';
import { cleanupTask, trackTask } from '../../../entities/task';
import { hasContentIdInIds, isIdsEqual } from '../../../shared/lib/cms/content/ids';
import { $isWizard } from '../../../shared/app-state/app.store';
import { $contentDuplicated } from '../../../shared/socket/socket.store';

//
// * Types
//

type DuplicateDialogStore = {
    open: boolean;
    loading: boolean;
    failed: boolean;
    // Lifecycle guard against stale async results; bumped on reset and at each reload start
    instance: number;
    items: ContentSummary[];
    dependants: ContentSummary[];
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
    instance: 0,
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

let duplicateCompletionHandled = false;

//
// * Derived State
//

export const $duplicateItemsCount = computed(
    $duplicateDialog,
    ({ items, dependants }) => items.length + dependants.length,
);

export const $isDuplicateSelectionSynced = computed(
    [$duplicateDialog, $duplicateDraftIncludeChildrenIds],
    (state, draft) => {
        return isIdsEqual(state.includeChildrenIds, draft);
    },
);

export const $isDuplicateDialogReady = computed([$duplicateDialog, $isDuplicateSelectionSynced], (state, synced) => {
    return state.open && synced && !state.loading && !state.failed && !state.submitting && state.items.length > 0;
});

export const $duplicateTaskId = computed($duplicateDialog, ({ taskId }) => taskId);

//
// * Public API
//

export const openDuplicateDialog = (items: ContentSummary[]): void => {
    if (items.length === 0) {
        return;
    }

    duplicateCompletionHandled = false;

    const includeChildrenIds = items.filter((item) => item.hasChildren()).map((item) => item.getContentId());

    $duplicateDraftIncludeChildrenIds.set(includeChildrenIds);

    $duplicateDialog.set({
        ...structuredClone(initialDuplicateDialogState),
        instance: $duplicateDialog.get().instance,
        open: true,
        items,
        includeChildrenIds,
    });
};

export const cancelDuplicateDialog = (): void => {
    const { submitting } = $duplicateDialog.get();
    if (submitting) {
        return;
    }
    resetDuplicateDialogContext();
};

export const resetDuplicateDialogContext = (): void => {
    const { taskId, instance } = $duplicateDialog.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $duplicateDraftIncludeChildrenIds.set([]);
    $duplicateDialog.set({ ...structuredClone(initialDuplicateDialogState), instance: instance + 1 });
};

export const toggleDuplicateIncludeChildren = (id: ContentId, include: boolean): void => {
    const draft = $duplicateDraftIncludeChildrenIds.get();

    const hasId = hasContentIdInIds(id, draft);
    if (include && hasId) return;
    if (!include && !hasId) return;

    const next = include ? [...draft, id] : draft.filter((itemId) => !itemId.equals(id));

    $duplicateDraftIncludeChildrenIds.set(next);
};

export const applyDuplicateIncludeChildrenSelection = (): void => {
    const draft = $duplicateDraftIncludeChildrenIds.get();
    $duplicateDialog.setKey('includeChildrenIds', [...draft]);
};

export const cancelDuplicateIncludeChildrenSelection = (): void => {
    const { includeChildrenIds } = $duplicateDialog.get();
    $duplicateDraftIncludeChildrenIds.set([...includeChildrenIds]);
};

export const executeDuplicateDialogAction = async (): Promise<boolean> => {
    const state = $duplicateDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    const parentPath = state.items[0]?.getPath()?.getParentPath()?.toString();
    const unsubscribeOpenTab = setupOpenTabListener(parentPath);

    const includeChildrenSet = new Set(state.includeChildrenIds.map((id) => id.toString()));
    const params: DuplicateContentParams[] = state.items.map((item) => {
        const includeChildren = includeChildrenSet.has(item.getContentId().toString());
        return { contentId: item.getContentId(), includeChildren };
    });

    const pendingIds = state.items.map((item) => item.getContentId().toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();
    const pendingTotal = state.items.length;

    const result = await duplicateContent(params);

    return result.match(
        (taskId) => {
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
        },
        (error) => {
            showError(error.message);
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
        },
    );
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

        const matchedItem = event.data.find((item) => item.getPath()?.getParentPath()?.toString() === parentPath);

        if (matchedItem) {
            new EditContentEvent([matchedItem]).fire();
            cleanup();
        }
    });

    return unsubscribe;
};

//
// * Completion Handling
//

const handleDuplicateSuccess = (): void => {
    if (duplicateCompletionHandled) return;

    duplicateCompletionHandled = true;

    const state = $duplicateDialog.get();
    const total = state.pendingTotal || state.items.length || state.pendingIds.length;
    const primaryName =
        state.pendingPrimaryName || state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString() || '';

    const singleMessage = i18n('dialog.duplicate.success.single', primaryName);
    const multipleMessage = i18n('dialog.duplicate.success.multiple', total);
    const message = total > 1 ? multipleMessage : singleMessage;

    showSuccess(message);
    resetDuplicateDialogContext();
};
