import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ResolveUnpublishRequest} from '../../../../app/resource/ResolveUnpublishRequest';
import {UnpublishContentRequest} from '../../../../app/resource/UnpublishContentRequest';
import {$contentArchived, $contentCreated, $contentDeleted, $contentUnpublished, $contentUpdated} from '../socket.store';
import {createDebounce} from '../../utils/timing/createDebounce';
import {sortDependantsByInbound} from '../../utils/cms/content/sortDependants';
import {completeProgress, resetProgress, startProgress} from './progress.store';

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
};

type UnpublishDialogPendingStore = {
    submitting: boolean;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
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
};

const initialPendingState: UnpublishDialogPendingStore = {
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    pendingPrimaryName: undefined,
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

export const $unpublishProgress = computed($unpublishDialogPending, ({pendingIds, pendingTotal, submitting}) => {
    if (!submitting) {
        return 0;
    }
    const total = pendingTotal || pendingIds.length;
    if (total === 0) {
        return 0;
    }
    const completed = Math.max(0, total - pendingIds.length);
    return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
});

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;

//
// * Helpers
//

const getAllTargetIds = (): ContentId[] => {
    const {items, dependants} = $unpublishDialog.get();
    return [...items, ...dependants].map(item => item.getContentId());
};

const buildUnpublishRequest = (items: ContentSummaryAndCompareStatus[]): UnpublishContentRequest => {
    const request = new UnpublishContentRequest();
    request.setIncludeChildren(true);
    items.forEach(item => request.addId(item.getContentId()));
    return request;
};

//
// * Public API
//

export const openUnpublishDialog = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    resetProgress();
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
    $unpublishDialog.set(initialState);
    $unpublishDialogPending.set(initialPendingState);
    resetProgress();
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
    const request = buildUnpublishRequest(itemsToUnpublish);

    try {
        startProgress();
        $unpublishDialogPending.set({
            submitting: true,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
        });
        // $unpublishDialog.setKey('open', false);

        await request.sendAndParse();
        completeProgress();
        // $unpublishDialog.setKey('open', false);
        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $unpublishDialogPending.set(initialPendingState);
        $unpublishDialog.setKey('failed', true);
        return false;
    } finally {
        // resetProgress();
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
        const {dependants, inboundTargets} = await resolveAllDependantsAndInbound(currentInstance, ids);

        $unpublishDialog.set({
            ...$unpublishDialog.get(),
            dependants: sortDependantsByInbound(dependants, inboundTargets),
            inboundTargets,
            inboundIgnored: inboundTargets.length === 0,
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

const resolveAllDependantsAndInbound = async (currentInstance: number, roots: ContentId[]): Promise<{dependants: ContentSummaryAndCompareStatus[]; inboundTargets: ContentId[]}> => {
    const visited = new Set<string>(roots.map(id => id.toString()));
    const queue: ContentId[] = [...roots];
    const dependantIds: ContentId[] = [];
    const inboundTargets = new Set<string>();

    while (queue.length > 0) {
        const batch = queue.splice(0);
        const result = await new ResolveUnpublishRequest(batch).sendAndParse();
        if (currentInstance !== instanceId) {
            return {dependants: [], inboundTargets: []};
        }

        // Collect dependants returned for this batch
        result.getContentIds()
            .filter(id => !visited.has(id.toString()))
            .forEach(id => {
                visited.add(id.toString());
                dependantIds.push(id);
                queue.push(id);
            });

        // Flag any item (root or dependant) that has inbound deps
        result.getInboundDependencies().forEach(dep => {
            inboundTargets.add(dep.getId().toString());
        });
    }

    const dependants = dependantIds.length > 0
        ? await new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(dependantIds)
        : [];

    if (currentInstance !== instanceId) {
        return {dependants: [], inboundTargets: []};
    }

    return {
        dependants,
        inboundTargets: Array.from(inboundTargets).map(id => new ContentId(id)),
    };
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

    const {patchedMain, patchedDependants} = patchItemsWithUpdates(event.data);
    if (patchedMain || patchedDependants) {
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

    const deletedIds = new Set(event.data.map(item => item.getContentId().toString()));
    const {removedMain, removedDependant} = removeItemsByIds(deletedIds);

    if ($unpublishDialog.get().items.length === 0) {
        resetUnpublishDialogContext();
        return;
    }

    if (removedMain || removedDependant) {
        reloadUnpublishDialogDataDebounced();
    }
});

$contentUnpublished.subscribe((event) => {
    if (!event) {
        return;
    }
    handleCompletionEvent(event.data);
});
