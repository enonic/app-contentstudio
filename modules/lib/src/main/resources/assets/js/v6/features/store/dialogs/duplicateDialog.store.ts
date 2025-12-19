import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {atom, computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {EditContentEvent} from '../../../../app/event/EditContentEvent';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ContentDuplicateParams} from '../../../../app/resource/ContentDuplicateParams';
import {DuplicateContentRequest} from '../../../../app/resource/DuplicateContentRequest';
import {GetDescendantsOfContentsRequest} from '../../../../app/resource/GetDescendantsOfContentsRequest';
import {hasContentIdInIds, isIdsEqual} from '../../utils/cms/content/ids';
import {createDebounce} from '../../utils/timing/createDebounce';
import {$isWizard} from '../app.store';
import {$contentArchived, $contentCreated, $contentDeleted, $contentDuplicated, $contentUpdated} from '../socket.store';
import {reload as reloadContentTree} from '../contentTreeLoadingStore';
import {cleanupTask, trackTask} from '../../services/task.service';

//
// * Store state
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

const initialState: DuplicateDialogStore = {
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

export const $duplicateDialog = map<DuplicateDialogStore>(structuredClone(initialState));
export const $duplicateDraftIncludeChildrenIds = atom<ContentId[]>([]);

//
// * Derived state
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
// * Instance guard / timers
//

let instanceId = 0;
let duplicateCompletionHandled = false;
const OPEN_TAB_EXPIRY_MS = 5 * 60 * 1000;

type PendingOpenTab = {
    startedAt: number;
    expiresAt: number;
    parentPath?: string;
};

let pendingOpenTab: PendingOpenTab | null = null;

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
        ...structuredClone(initialState),
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
    clearPendingOpenTab();
    resetDuplicateDialogContext();
};

export const resetDuplicateDialogContext = (): void => {
    instanceId += 1;
    const {taskId} = $duplicateDialog.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    duplicateCompletionHandled = false;
    $duplicateDraftIncludeChildrenIds.set([]);
    $duplicateDialog.set(structuredClone(initialState));
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

const clearPendingOpenTab = (): void => {
    pendingOpenTab = null;
};

const setPendingOpenTab = (items: ContentSummaryAndCompareStatus[]): void => {
    if (!$isWizard.get()) {
        clearPendingOpenTab();
        return;
    }

    const parentPath = items[0]?.getPath()?.getParentPath()?.toString();
    const startedAt = Date.now();

    const expiresAt = startedAt + OPEN_TAB_EXPIRY_MS;

    pendingOpenTab = {
        startedAt,
        expiresAt,
        parentPath,
    };

    setTimeout(() => {
        if (pendingOpenTab?.expiresAt === expiresAt) {
            clearPendingOpenTab();
        }
    }, OPEN_TAB_EXPIRY_MS);
};

const maybeOpenDuplicateInNewTab = (items: ContentSummaryAndCompareStatus[], timestamp: number): void => {
    if (!$isWizard.get() || !pendingOpenTab) {
        return;
    }

    if (timestamp < pendingOpenTab.startedAt || timestamp > pendingOpenTab.expiresAt) {
        clearPendingOpenTab();
        return;
    }

    if (!items || items.length === 0) {
        clearPendingOpenTab();
        return;
    }

    const parentPath = pendingOpenTab.parentPath;
    const matchedItem = parentPath
        ? items.find(item => item.getPath()?.getParentPath()?.toString() === parentPath)
        : items[0];

    if (matchedItem) {
        new EditContentEvent([matchedItem]).fire();
    }

    clearPendingOpenTab();
};

export const executeDuplicateDialogAction = async (): Promise<boolean> => {
    const state = $duplicateDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    setPendingOpenTab(state.items);

    const includeChildrenSet = new Set(state.includeChildrenIds.map(id => id.toString()));
    const params = state.items.map(item => {
        const includeChildren = includeChildrenSet.has(item.getContentId().toString());
        return new ContentDuplicateParams(item.getContentId()).setIncludeChildren(includeChildren);
    });

    const pendingIds = state.items.map(item => item.getContentId().toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();
    const pendingTotal = state.items.length;

    try {
        const taskId = await new DuplicateContentRequest(params).sendAndParse();

        $duplicateDialog.set({
            ...state,
            submitting: true,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
            taskId,
        });

        trackTask(taskId, {
            onComplete: (resultState, message) => {
                if (resultState === 'SUCCESS') {
                    handleDuplicateSuccess('task');
                } else {
                    showError(message || i18n('notify.duplicate.failed'));
                    clearPendingOpenTab();
                    resetDuplicateDialogContext();
                }
            },
        });

        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        clearPendingOpenTab();
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
// * Data loading
//

const reloadDuplicateDialogData = async (): Promise<void> => {
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
        const ids = await new GetDescendantsOfContentsRequest().setContentPaths(paths).sendAndParse();
        if (currentInstance !== instanceId) return;

        const dependants = ids.length > 0
            ? await new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(ids)
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
};

const reloadDuplicateDialogDataDebounced = createDebounce(() => {
    void reloadDuplicateDialogData();
}, 100);

//
// * Helpers
//

const isDialogActive = (): boolean => {
    const {open, items} = $duplicateDialog.get();
    return open && items.length > 0;
};

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
// * Completion handling
//

const handleDuplicateSuccess = (source: 'socket' | 'timeout' | 'task'): void => {
    if (duplicateCompletionHandled) {
        return;
    }
    duplicateCompletionHandled = true;

    const state = $duplicateDialog.get();
    const total = state.pendingTotal || state.items.length || state.pendingIds.length;
    const primaryName = state.pendingPrimaryName
        || state.items[0]?.getDisplayName()
        || state.items[0]?.getPath()?.toString()
        || '';
    const singleMessage = i18n('dialog.duplicate.success.multiple', total);
    const multipleMessage = i18n('dialog.duplicate.success.single', primaryName);
    const message = total > 1
        ? singleMessage
        : multipleMessage;

    showSuccess(message);
    reloadContentTree();
    resetDuplicateDialogContext();
};

const handleDuplicateCompletionEvent = (items: ContentSummaryAndCompareStatus[], timestamp: number): void => {
    maybeOpenDuplicateInNewTab(items, timestamp);

    const state = $duplicateDialog.get();
    if (!state.submitting) {
        return;
    }

    handleDuplicateSuccess('socket');
};

//
// * Subscriptions
//

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

$contentCreated.subscribe((event) => {
    if (!event || !isDialogActive()) {
        return;
    }
    reloadDuplicateDialogDataDebounced();
});

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

$contentDuplicated.subscribe((event) => {
    if (!event) {
        return;
    }
    handleDuplicateCompletionEvent(event.data, event.timestamp);
});
