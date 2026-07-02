import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentServerChangeItem } from '../../../../app/event/ContentServerChangeItem';
import { fetchContentSummaries } from '../../../entities/content';
import { archiveContent, resolveForDelete } from '../../api/delete';
import { trackTask, cleanupTask } from '../../../entities/task';
import { hasContentIdInIds } from '../../../shared/lib/cms/content/ids';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentUpdated,
} from '../../../shared/socket/socket.store';

//
// * Types
//

//
// * Store State
//

type DeleteDialogStore = {
    // Dialog state
    open: boolean;
    loading: boolean;
    failed: boolean;
    // Content
    items: ContentSummary[];
    // Full ordered dependant id list (inbound-first); summaries load lazily, a window at a time.
    dependantIds: ContentId[];
    // Loaded window of dependant summaries (a prefix of dependantIds)
    dependants: ContentSummary[];
    dependantWindow: number;
    archiveMessage: string;
    // Validation
    inboundTargets: ContentId[];
    inboundIgnored: boolean;
    // IDs of content referencing the items (inbound sources); changes to these may add/remove references
    inboundSourceIds: string[];
    // Pending operation (after dialog closes)
    submitting: boolean;
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
    dependantIds: [],
    dependants: [],
    dependantWindow: 0,
    archiveMessage: '',
    inboundTargets: [],
    inboundIgnored: false,
    inboundSourceIds: [],
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    taskId: undefined,
};

export const $deleteDialog = map<DeleteDialogStore>(structuredClone(initialState));

//
// * Derived State
//

// Count uses the full dependant id list, not just the loaded window.
export const $deleteItemsCount = computed(
    $deleteDialog,
    ({ items, dependantIds }) => items.length + dependantIds.length,
);

export const $hasMoreDeleteDependants = computed(
    $deleteDialog,
    ({ dependantIds, dependantWindow }) => dependantWindow < dependantIds.length,
);

export const $isDeleteTargetSite = computed($deleteDialog, ({ items, dependants }) => {
    return [...items, ...dependants].some((item) => item.isSite());
});

export const $isDeleteBlockedByInbound = computed($deleteDialog, ({ inboundTargets, inboundIgnored }) => {
    return inboundTargets.length > 0 && !inboundIgnored;
});

export const $deleteInboundIds = computed($deleteDialog, ({ inboundTargets }) => {
    return inboundTargets.map((id) => id.toString());
});

export const $isDeleteDialogReady = computed([$deleteDialog, $isDeleteBlockedByInbound], (state, isBlocked) => {
    return state.open && !state.loading && !state.failed && !state.submitting && state.items.length > 0 && !isBlocked;
});
// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;

// Number of dependant summaries loaded per page
const DEPENDANT_LOAD_SIZE = 36;

let loadingMore = false;

//
// * Helpers
//

const getAllTargetIds = (): ContentId[] => {
    const { items, dependantIds } = $deleteDialog.get();
    return [...items.map((item) => item.getContentId()), ...dependantIds];
};

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

const orderSummariesByIds = (summaries: ContentSummary[], orderIds: ContentId[]): ContentSummary[] => {
    const indexById = new Map<string, number>();
    orderIds.forEach((id, index) => indexById.set(id.toString(), index));
    const indexOf = (item: ContentSummary): number => indexById.get(item.getContentId().toString()) ?? orderIds.length;
    return [...summaries].sort((a, b) => indexOf(a) - indexOf(b));
};

// Loads the next slice into the window, preserving id order. Returns null if a newer
// reload superseded this one (guardId no longer matches the current instanceId).
async function loadDeleteDependantWindow(allIds: ContentId[], start: number, guardId: number): Promise<void> {
    const sliceIds = allIds.slice(start, start + DEPENDANT_LOAD_SIZE);
    const summaries = sliceIds.length > 0 ? await fetchContentSummaries(sliceIds) : [];

    if (guardId !== instanceId) return;

    const { dependants, dependantIds } = $deleteDialog.get();
    const currentIds = new Set(dependantIds.map((id) => id.toString()));
    const byId = new Map<string, ContentSummary>();
    for (const item of [...(start === 0 ? [] : dependants), ...summaries]) {
        const key = item.getContentId().toString();
        if (currentIds.has(key)) {
            byId.set(key, item);
        }
    }

    $deleteDialog.set({
        ...$deleteDialog.get(),
        dependants: orderSummariesByIds([...byId.values()], dependantIds),
        dependantWindow: Math.min(start + DEPENDANT_LOAD_SIZE, dependantIds.length),
    });
}

/** Lazy-load the next window of dependant summaries (triggered by list scroll). */
export const loadMoreDeleteDependants = async (): Promise<void> => {
    if (loadingMore) return;

    const { dependantIds, dependantWindow } = $deleteDialog.get();
    if (dependantWindow >= dependantIds.length) return;

    loadingMore = true;
    const guardId = instanceId;
    try {
        await loadDeleteDependantWindow(dependantIds, dependantWindow, guardId);
    } finally {
        loadingMore = false;
    }
};

const getArchiveContentIds = (items: ContentSummary[]): ContentId[] => {
    return items.map((item) => item.getContentId());
};

//
// * Public API
//

export const openDeleteDialog = (items: ContentSummary[]): void => {
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
    const { submitting } = $deleteDialog.get();
    if (submitting) {
        return;
    }

    resetDeleteDialogContext();
};

export const resetDeleteDialogContext = (): void => {
    instanceId += 1;
    const { taskId } = $deleteDialog.get();
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

export const $deleteTaskId = computed($deleteDialog, ({ taskId }) => taskId);

export const executeDeleteDialogAction = async (): Promise<boolean> => {
    const state = $deleteDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    const totalCount = $deleteItemsCount.get();
    const pendingIds = getAllTargetIds().map((id) => id.toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();
    const pendingTotal = totalCount || state.items.length;

    try {
        const taskId = await archiveContent(getArchiveContentIds(state.items), state.archiveMessage);

        $deleteDialog.set({
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
                    const total = pendingTotal || pendingIds.length;
                    const successMessage =
                        total > 1
                            ? i18n('dialog.archive.success.multiple', total)
                            : i18n('dialog.archive.success.single', pendingPrimaryName ?? '');
                    showSuccess(successMessage);
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
    const { items, open, loading } = $deleteDialog.get();
    if (!open || items.length === 0 || loading) {
        return;
    }

    $deleteDialog.setKey('loading', true);
    $deleteDialog.setKey('failed', false);

    try {
        const ids = items.map((item) => item.getContentId());
        const result = await resolveForDelete(ids);

        if (currentInstance !== instanceId) return;

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

        if (currentInstance !== instanceId) return;

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

//
// * Completion Handling
//

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

//
// * Internal Subscriptions
//

// Reload data when dialog opens
$deleteDialog.subscribe(({ open, loading }, oldState) => {
    const wasOpen = !!oldState?.open;
    if (!open || wasOpen || loading) return;
    reloadDeleteDialogData();
});

//
// * Socket Event Handlers
//

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const { open, items, submitting } = $deleteDialog.get();
    return open && !submitting && items.length > 0;
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

    const { dependants } = $deleteDialog.get();
    const updatedIds = new Set(event.data.map((item) => item.getId()));

    // Patch main items with updated data (display name, status, etc.)
    patchItemsWithUpdates(event.data);

    // Reload when dependants change, or when a referencing content is edited to drop a reference.
    const hasDependantUpdates = dependants.some((item) => updatedIds.has(item.getId()));
    if (hasDependantUpdates || hasInboundSourceChange(updatedIds)) {
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
