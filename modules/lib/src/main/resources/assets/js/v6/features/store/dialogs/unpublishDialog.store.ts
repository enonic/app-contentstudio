import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ResolveUnpublishRequest} from '../../../../app/resource/ResolveUnpublishRequest';
import {UnpublishContentRequest} from '../../../../app/resource/UnpublishContentRequest';
import {$contentUnpublished} from '../socket.store';
import {createDebounce} from '../../utils/timing/createDebounce';

export type UnpublishAction = 'unpublish';

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
    yesCallback?: () => void;
    noCallback?: () => void;
};

type UnpublishDialogPendingStore = {
    submitting: boolean;
    pendingAction?: UnpublishAction;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
};

// Initial state snapshot for reset
const initialViewState: UnpublishDialogStore = {
    open: false,
    loading: false,
    failed: false,
    items: [],
    dependants: [],
    inboundTargets: [],
    inboundIgnored: true,
    yesCallback: undefined,
    noCallback: undefined,
};

const initialPendingState: UnpublishDialogPendingStore = {
    submitting: false,
    pendingAction: undefined,
    pendingIds: [],
    pendingTotal: 0,
    pendingPrimaryName: undefined,
};

export const $unpublishDialog = map<UnpublishDialogStore>(initialViewState);
export const $unpublishDialogPending = map<UnpublishDialogPendingStore>(initialPendingState);

//
// * Derived state
//

export const $unpublishTotalItems = computed($unpublishDialog, ({items, dependants}) => items.length + dependants.length);

export const $unpublishHasSite = computed($unpublishDialog, ({items, dependants}) => {
    return [...items, ...dependants].some(item => item.getContentSummary().isSite());
});

export const $unpublishHasBlockingInbound = computed($unpublishDialog, ({inboundTargets, inboundIgnored}) => {
    return inboundTargets.length > 0 && !inboundIgnored;
});

export const $unpublishInboundIds = computed($unpublishDialog, ({inboundTargets}) => inboundTargets.map(id => id.toString()));

export const $unpublishDialogReady = computed([$unpublishDialog, $unpublishHasBlockingInbound], (state, hasInbound) => {
    const {submitting} = $unpublishDialogPending.get();
    return state.open && !state.loading && !state.failed && !submitting && state.items.length > 0 && !hasInbound;
});

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;

//
// * Helpers
//

const sortDependants = (dependants: ContentSummaryAndCompareStatus[], inboundTargets: ContentId[]): ContentSummaryAndCompareStatus[] => {
    if (dependants.length === 0 || inboundTargets.length === 0) {
        return dependants;
    }
    const inboundSet = new Set(inboundTargets.map(id => id.toString()));
    return [...dependants].sort((a, b) => {
        const aInbound = inboundSet.has(a.getContentId().toString()) ? 1 : 0;
        const bInbound = inboundSet.has(b.getContentId().toString()) ? 1 : 0;
        if (aInbound !== bInbound) {
            return bInbound - aInbound;
        }
        const aLabel = a.getDisplayName() || a.getPath()?.toString() || '';
        const bLabel = b.getDisplayName() || b.getPath()?.toString() || '';
        return aLabel.localeCompare(bLabel);
    });
};

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

export const openUnpublishDialog = (items: ContentSummaryAndCompareStatus[], callbacks?: {onYes?: () => void; onNo?: () => void;}): void => {
    if (items.length === 0) {
        return;
    }

    instanceId += 1;

    $unpublishDialog.set({
        ...initialViewState,
        open: true,
        loading: true,
        items,
        inboundIgnored: true,
        yesCallback: callbacks?.onYes,
        noCallback: callbacks?.onNo,
    });
    $unpublishDialogPending.set(initialPendingState);
};

export const cancelUnpublishDialog = (): void => {
    const {pendingAction} = $unpublishDialogPending.get();
    const {noCallback} = $unpublishDialog.get();
    if (pendingAction) {
        return;
    }

    noCallback?.();
    resetUnpublishDialogContext();
};

export const resetUnpublishDialogContext = (): void => {
    instanceId += 1;
    $unpublishDialog.set(initialViewState);
    $unpublishDialogPending.set(initialPendingState);
};

export const ignoreUnpublishInboundDependencies = (): void => {
    $unpublishDialog.setKey('inboundIgnored', true);
};

export const executeUnpublishDialogAction = async (): Promise<boolean> => {
    const viewState = $unpublishDialog.get();
    const pendingState = $unpublishDialogPending.get();
    if (viewState.loading || viewState.failed || pendingState.submitting || viewState.items.length === 0) {
        return false;
    }
    return confirmUnpublishAction('unpublish', viewState.items);
};

export const confirmUnpublishAction = async (action: UnpublishAction, items: ContentSummaryAndCompareStatus[]): Promise<boolean> => {
    const viewState = $unpublishDialog.get();
    const pendingState = $unpublishDialogPending.get();
    if (action !== 'unpublish' || pendingState.submitting || viewState.loading || viewState.failed) {
        return false;
    }

    const itemsToUnpublish = items.length > 0 ? items : viewState.items;
    if (itemsToUnpublish.length === 0) {
        return false;
    }

    const pendingIds = getAllTargetIds().map(id => id.toString());
    const pendingPrimaryName = itemsToUnpublish[0]?.getDisplayName() || itemsToUnpublish[0]?.getPath()?.toString();
    const pendingTotal = $unpublishTotalItems.get() || pendingIds.length;
    const request = buildUnpublishRequest(itemsToUnpublish);

    try {
        viewState.yesCallback?.();

        $unpublishDialogPending.set({
            submitting: true,
            pendingAction: action,
            pendingIds,
            pendingTotal,
            pendingPrimaryName,
        });
        $unpublishDialog.set({
            ...viewState,
            open: false,
        });

        await request.sendAndParse();
        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $unpublishDialogPending.set(initialPendingState);
        $unpublishDialog.set({
            ...viewState,
            open: true,
        });
        return false;
    }
};

//
// * Data loading
//

const reloadUnpublishDialogData = async (): Promise<void> => {
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
            dependants: sortDependants(dependants, inboundTargets),
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

    if (removedMain || removedDependant) {
        $unpublishDialog.set({
            ...$unpublishDialog.get(),
            items: newItems,
            dependants: newDependants,
        });
    }

    return {removedMain, removedDependant};
};

//
// * Completion handling
//

const handleCompletionEvent = (changeItems: ContentSummaryAndCompareStatus[]): void => {
    const ids = new Set(changeItems.map(item => item.getContentId().toString()));
    const state = $unpublishDialog.get();
    const {pendingAction, pendingIds, pendingTotal, pendingPrimaryName} = $unpublishDialogPending.get();
    const isPendingMatch = pendingAction === 'unpublish' && pendingIds.length > 0;

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

$unpublishDialog.subscribe(({open}, prev) => {
    const wasOpen = prev?.open ?? false;
    if (open && !wasOpen) {
        void reloadUnpublishDialogData();
    } else if (!open && wasOpen) {
        instanceId += 1;
    }
});

$contentUnpublished.subscribe((event) => {
    if (!event) {
        return;
    }
    handleCompletionEvent(event.data);
});
