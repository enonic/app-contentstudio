import { showError, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries } from '../../../entities/content';
import { unpublishContent } from '../api/unpublish.api';
import { trackTask, cleanupTask } from '../../../entities/task';

//
// * Store state
//

type UnpublishDialogStore = {
    open: boolean;
    loading: boolean;
    failed: boolean;
    // Lifecycle guard against stale async results; bumped on reset and at the start of each reload
    instance: number;
    items: ContentSummary[];
    dependantIds: ContentId[];
    dependants: ContentSummary[];
    dependantWindow: number;
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
    instance: 0,
    items: [],
    dependantIds: [],
    dependants: [],
    dependantWindow: 0,
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

export const $unpublishItemsCount = computed(
    $unpublishDialog,
    ({ items, dependantIds }) => items.length + dependantIds.length,
);

export const $hasMoreUnpublishDependants = computed(
    $unpublishDialog,
    ({ dependantIds, dependantWindow }) => dependantWindow < dependantIds.length,
);

export const $isUnpublishTargetSite = computed($unpublishDialog, ({ items, dependants }) => {
    return [...items, ...dependants].some((item) => item.isSite());
});

export const $isUnpublishBlockedByInbound = computed($unpublishDialog, ({ inboundTargets, inboundIgnored }) => {
    return inboundTargets.length > 0 && !inboundIgnored;
});

export const $unpublishInboundIds = computed($unpublishDialog, ({ inboundTargets }) =>
    inboundTargets.map((id) => id.toString()),
);

export const $isUnpublishDialogReady = computed(
    [$unpublishDialog, $unpublishDialogPending, $isUnpublishBlockedByInbound],
    (state, pending, hasInbound) => {
        return (
            state.open &&
            !state.loading &&
            !state.failed &&
            !pending.submitting &&
            state.items.length > 0 &&
            !hasInbound
        );
    },
);

export const $unpublishTaskId = computed($unpublishDialogPending, ({ taskId }) => taskId);

// Number of dependant summaries loaded per page
export const DEPENDANT_LOAD_SIZE = 36;

let loadingMore = false;

//
// * Helpers
//

const getAllTargetIds = (): ContentId[] => {
    const { items, dependantIds } = $unpublishDialog.get();
    return [...items.map((item) => item.getContentId()), ...dependantIds];
};

export const orderSummariesByIds = (summaries: ContentSummary[], orderIds: ContentId[]): ContentSummary[] => {
    const indexById = new Map<string, number>();
    orderIds.forEach((id, index) => indexById.set(id.toString(), index));
    const indexOf = (item: ContentSummary): number => indexById.get(item.getContentId().toString()) ?? orderIds.length;
    return [...summaries].sort((a, b) => indexOf(a) - indexOf(b));
};

async function loadUnpublishDependantWindow(allIds: ContentId[], start: number, guardId: number): Promise<void> {
    const sliceIds = allIds.slice(start, start + DEPENDANT_LOAD_SIZE);
    const summaries = sliceIds.length > 0 ? await fetchContentSummaries(sliceIds) : [];

    if (guardId !== $unpublishDialog.get().instance) return;

    const { dependants, dependantIds } = $unpublishDialog.get();
    const currentIds = new Set(dependantIds.map((id) => id.toString()));
    const byId = new Map<string, ContentSummary>();
    for (const item of [...(start === 0 ? [] : dependants), ...summaries]) {
        const key = item.getContentId().toString();
        if (currentIds.has(key)) {
            byId.set(key, item);
        }
    }

    $unpublishDialog.set({
        ...$unpublishDialog.get(),
        dependants: orderSummariesByIds([...byId.values()], dependantIds),
        dependantWindow: Math.min(start + DEPENDANT_LOAD_SIZE, dependantIds.length),
    });
}

export const loadMoreUnpublishDependants = async (): Promise<void> => {
    if (loadingMore) return;

    const { dependantIds, dependantWindow, instance } = $unpublishDialog.get();
    if (dependantWindow >= dependantIds.length) return;

    loadingMore = true;
    try {
        await loadUnpublishDependantWindow(dependantIds, dependantWindow, instance);
    } finally {
        loadingMore = false;
    }
};

//
// * Public API
//

export const openUnpublishDialog = (items: ContentSummary[]): void => {
    if (items.length === 0) {
        return;
    }

    $unpublishDialog.set({
        ...structuredClone(initialState),
        instance: $unpublishDialog.get().instance,
        open: true,
        items,
        inboundIgnored: true,
    });
    $unpublishDialogPending.set(initialPendingState);
};

export const cancelUnpublishDialog = (): void => {
    const { submitting, pendingIds } = $unpublishDialogPending.get();
    if (submitting || pendingIds.length > 0) {
        return;
    }

    resetUnpublishDialogContext();
};

export const resetUnpublishDialogContext = (): void => {
    const { instance } = $unpublishDialog.get();
    const { taskId } = $unpublishDialogPending.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $unpublishDialog.set({ ...initialState, instance: instance + 1 });
    $unpublishDialogPending.set(initialPendingState);
};

export const ignoreUnpublishInboundDependencies = (): void => {
    $unpublishDialog.setKey('inboundIgnored', true);
};

export const executeUnpublishDialogAction = async (): Promise<boolean> => {
    const { loading, failed, items } = $unpublishDialog.get();
    const { submitting } = $unpublishDialogPending.get();
    if (loading || failed || submitting || items.length === 0) {
        return false;
    }
    return confirmUnpublishAction(items);
};

export const confirmUnpublishAction = async (selectedItems: ContentSummary[]): Promise<boolean> => {
    const { items, loading, failed } = $unpublishDialog.get();
    const { submitting } = $unpublishDialogPending.get();
    if (submitting || loading || failed) {
        return false;
    }

    const itemsToUnpublish = selectedItems.length > 0 ? selectedItems : items;
    if (itemsToUnpublish.length === 0) {
        return false;
    }

    const pendingIds = getAllTargetIds().map((id) => id.toString());
    const pendingPrimaryName = itemsToUnpublish[0]?.getDisplayName() || itemsToUnpublish[0]?.getPath()?.toString();
    const pendingTotal = $unpublishItemsCount.get() || pendingIds.length;

    const result = await unpublishContent({
        contentIds: itemsToUnpublish.map((item) => item.getContentId()),
    });

    return result.match(
        (taskId) => {
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
                        const successMessage =
                            total > 1
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
        },
        (error) => {
            showError(error.message);
            $unpublishDialogPending.set(initialPendingState);
            $unpublishDialog.setKey('failed', true);
            return false;
        },
    );
};
