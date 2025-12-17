import {showError, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {resolveUnpublish, unpublishContent} from '../../api/unpublish';
import {hasContentIdInIds} from '../../utils/cms/content/ids';
import {clampProgress} from '../../utils/cms/content/progress';
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
    progressValue: number;
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
    progressValue: 0,
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

export const $unpublishProgress = computed($unpublishDialogPending, ({progressValue}) => clampProgress(progressValue));

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;
let unpublishProgressInterval: ReturnType<typeof setInterval> | undefined;

const clearUnpublishProgressInterval = (): void => {
    if (unpublishProgressInterval) {
        clearInterval(unpublishProgressInterval);
        unpublishProgressInterval = undefined;
    }
};

const startUnpublishProgressSimulation = (): void => {
    clearUnpublishProgressInterval();
    $unpublishDialogPending.setKey('progressValue', 0);
    unpublishProgressInterval = setInterval(() => {
        const {progressValue, submitting} = $unpublishDialogPending.get();
        if (!submitting || progressValue >= 95) {
            return;
        }
        // Gentle curve: moderate initial growth, slowing down near the end
        const increment = Math.max(1, Math.round(Math.cbrt(95 - progressValue) * 1.5));
        $unpublishDialogPending.setKey('progressValue', Math.min(95, progressValue + increment));
    }, 350);
};

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

    clearUnpublishProgressInterval();
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
    clearUnpublishProgressInterval();
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
        startUnpublishProgressSimulation();
        $unpublishDialogPending.set({
            submitting: true,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
            progressValue: 0,
        });

        await unpublishContent(itemsToUnpublish);
        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        clearUnpublishProgressInterval();
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

const handleCompletionEvent = (changeItems: ContentSummaryAndCompareStatus[]): void => {
    const ids = new Set(changeItems.map(item => item.getContentId().toString()));
    const state = $unpublishDialog.get();
    const {pendingIds, pendingTotal, pendingPrimaryName} = $unpublishDialogPending.get();
    const isPendingMatch = pendingIds.length > 0;

    if (state.open) {
        const {removedMain, removedDependant} = removeItemsByIds(ids);
        if (removedMain && state.items.length === 0) {
            resetUnpublishDialogContext();
            return;
        }

        if (removedMain || removedDependant) {
            reloadUnpublishDialogDataDebounced();
        }
    }

    if (!isPendingMatch) {
        return;
    }

    const remaining = pendingIds.filter(id => !ids.has(id));
    if (remaining.length === 0) {
        clearUnpublishProgressInterval();
        $unpublishDialogPending.setKey('progressValue', 100);
        const total = pendingTotal || pendingIds.length;
        const message = total > 1
            ? i18n('dialog.unpublish.success.multiple', total)
            : i18n('dialog.unpublish.success.single', pendingPrimaryName ?? '');
        showSuccess(message);
        resetUnpublishDialogContext();
        return;
    }

    $unpublishDialogPending.setKey('pendingIds', remaining);
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
    handleCompletionEvent(event.data);
});
