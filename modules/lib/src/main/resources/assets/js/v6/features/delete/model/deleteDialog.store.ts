import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../entities/content';
import { trackTask, cleanupTask } from '../../../entities/task';
import { archiveContent } from '../api/delete.api';

//
// * Store State
//

type DeleteDialogStore = {
    // Dialog state
    open: boolean;
    loading: boolean;
    failed: boolean;
    // Lifecycle guard against stale async results; bumped on reset and after each reload
    instance: number;
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
    instance: 0,
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

// Number of dependant summaries loaded per page
export const DEPENDANT_LOAD_SIZE = 36;

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

export const $deleteTaskId = computed($deleteDialog, ({ taskId }) => taskId);

//
// * Helpers
//

let loadingMore = false;

const getAllTargetIds = (): ContentId[] => {
    const { items, dependantIds } = $deleteDialog.get();
    return [...items.map((item) => item.getContentId()), ...dependantIds];
};

export const orderSummariesByIds = (summaries: ContentSummary[], orderIds: ContentId[]): ContentSummary[] => {
    const indexById = new Map<string, number>();
    orderIds.forEach((id, index) => indexById.set(id.toString(), index));
    const indexOf = (item: ContentSummary): number => indexById.get(item.getContentId().toString()) ?? orderIds.length;
    return [...summaries].sort((a, b) => indexOf(a) - indexOf(b));
};

// Loads the next slice into the window, preserving id order. Returns early if a newer
// reload superseded this one (guardId no longer matches the current instance).
async function loadDeleteDependantWindow(allIds: ContentId[], start: number, guardId: number): Promise<void> {
    const sliceIds = allIds.slice(start, start + DEPENDANT_LOAD_SIZE);
    const summaries = sliceIds.length > 0 ? await fetchContentSummaries(sliceIds) : [];

    if (guardId !== $deleteDialog.get().instance) return;

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

    const { dependantIds, dependantWindow, instance } = $deleteDialog.get();
    if (dependantWindow >= dependantIds.length) return;

    loadingMore = true;
    try {
        await loadDeleteDependantWindow(dependantIds, dependantWindow, instance);
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
        instance: $deleteDialog.get().instance,
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
    const { taskId, instance } = $deleteDialog.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $deleteDialog.set({ ...structuredClone(initialState), instance: instance + 1 });
};

// TODO: Wire up archive message input in the dialog after design is ready
export const setDeleteArchiveMessage = (message: string): void => {
    $deleteDialog.setKey('archiveMessage', message);
};

export const ignoreDeleteInboundDependencies = (): void => {
    $deleteDialog.setKey('inboundIgnored', true);
};

export const executeDeleteDialogAction = async (): Promise<boolean> => {
    const state = $deleteDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    const totalCount = $deleteItemsCount.get();
    const pendingIds = getAllTargetIds().map((id) => id.toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();
    const pendingTotal = totalCount || state.items.length;

    const result = await archiveContent(getArchiveContentIds(state.items), state.archiveMessage);

    return result.match(
        (taskId) => {
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
        },
        (error) => {
            showError(error.message);
            $deleteDialog.set({
                ...$deleteDialog.get(),
                submitting: false,
                pendingIds: [],
                pendingTotal: 0,
                taskId: undefined,
            });
            return false;
        },
    );
};
