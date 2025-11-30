import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentServerChangeItem} from '../../../../app/event/ContentServerChangeItem';
import {ArchiveContentRequest} from '../../../../app/resource/ArchiveContentRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {DeleteContentRequest} from '../../../../app/resource/DeleteContentRequest';
import {ResolveDeleteRequest} from '../../../../app/resource/ResolveDeleteRequest';
import {$contentArchived, $contentDeleted} from '../socket.store';
import {createDebounce} from '../../utils/timing/createDebounce';
import {hasContentIdInIds} from '../../utils/cms/content/ids';

export type DeleteAction = 'archive' | 'delete';

//
// * Store state
//

type DeleteDialogStore = {
    open: boolean;
    loading: boolean;
    failed: boolean;
    submitting: boolean;
    items: ContentSummaryAndCompareStatus[];
    dependants: ContentSummaryAndCompareStatus[];
    inboundTargets: ContentId[];
    inboundIgnored: boolean;
    archiveMessage: string;
    pendingAction?: DeleteAction;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
    yesCallback?: () => void;
    noCallback?: () => void;
};

// Initial state snapshot for reset
const initialState: DeleteDialogStore = {
    open: false,
    loading: false,
    failed: false,
    submitting: false,
    items: [],
    dependants: [],
    inboundTargets: [],
    inboundIgnored: true,
    archiveMessage: '',
    pendingIds: [],
    pendingTotal: 0,
};

export const $deleteDialog = map<DeleteDialogStore>(initialState);

//
// * Derived state
//

export const $deleteTotalItems = computed($deleteDialog, ({items, dependants}) => items.length + dependants.length);

export const $deleteHasSite = computed($deleteDialog, ({items, dependants}) => {
    return [...items, ...dependants].some(item => item.getContentSummary().isSite());
});

export const $deleteHasBlockingInbound = computed($deleteDialog, ({inboundTargets, inboundIgnored}) => {
    return inboundTargets.length > 0 && !inboundIgnored;
});

export const $deleteInboundIds = computed($deleteDialog, ({inboundTargets}) => inboundTargets.map(id => id.toString()));

export const $deleteDialogReady = computed([$deleteDialog, $deleteHasBlockingInbound], (state, hasInbound) => {
    return state.open && !state.loading && !state.failed && !state.submitting && state.items.length > 0 && !hasInbound;
});

// ! Guards against stale async results (increment on each dialog lifecycle)
let instanceId = 0;
// Track the open state to debounce reloads on reopening
let wasOpen = false;

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

export const openDeleteDialog = (items: ContentSummaryAndCompareStatus[], callbacks?: {onYes?: () => void; onNo?: () => void;}): void => {
    if (items.length === 0) {
        return;
    }

    instanceId += 1;

    $deleteDialog.set({
        ...initialState,
        open: true,
        loading: true,
        items,
        inboundIgnored: true,
        yesCallback: callbacks?.onYes,
        noCallback: callbacks?.onNo,
    });
};

export const cancelDeleteDialog = (): void => {
    const {noCallback, pendingAction} = $deleteDialog.get();
    if (pendingAction) {
        return;
    }

    noCallback?.();
    resetDeleteDialogContext();
};

export const resetDeleteDialogContext = (): void => {
    instanceId += 1;
    $deleteDialog.set(initialState);
};

// TODO: Wire up archive message input in the dialog after design is ready
export const setDeleteArchiveMessage = (message: string): void => {
    $deleteDialog.setKey('archiveMessage', message);
};

export const ignoreDeleteInboundDependencies = (): void => {
    $deleteDialog.setKey('inboundIgnored', true);
};

export const executeDeleteDialogAction = async (action: DeleteAction): Promise<boolean> => {
    const state = $deleteDialog.get();
    if (state.loading || state.failed || state.submitting || state.items.length === 0) {
        return false;
    }

    // Invoke legacy yes callback for backward compatibility
    state.yesCallback?.();

    const totalCount = $deleteTotalItems.get();
    const pendingIds = getAllTargetIds().map(id => id.toString());
    const pendingPrimaryName = state.items[0]?.getDisplayName() || state.items[0]?.getPath()?.toString();

    const request = action === 'archive'
        ? buildArchiveRequest(state.items, state.archiveMessage)
        : buildDeleteRequest(state.items);

    try {
        $deleteDialog.set({
            ...state,
            submitting: true,
            pendingAction: action,
            pendingIds,
            pendingTotal: totalCount || state.items.length,
            pendingPrimaryName,
            open: false,
        });

        await request.sendAndParse();
        return true;
    } catch (error) {
        showError(error?.message ?? String(error));
        $deleteDialog.set({
            ...state,
            submitting: false,
            pendingAction: undefined,
            pendingIds: [],
            pendingTotal: 0,
            open: true,
        });
        return false;
    }
};

//
// * Data loading
//

const reloadDeleteDialogData = async (): Promise<void> => {
    const currentInstance = instanceId;
    const {items, open} = $deleteDialog.get();
    if (!open || items.length === 0) {
        return;
    }

    $deleteDialog.setKey('loading', true);
    $deleteDialog.setKey('failed', false);

    try {
        const ids = items.map(item => item.getContentId());
        const result = await new ResolveDeleteRequest(ids).sendAndParse();
        if (currentInstance !== instanceId) {
            return;
        }

        const dependantIds = result.getContentIds().filter(id => !hasContentIdInIds(id, ids));
        const dependants = dependantIds.length > 0
            ? await new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(dependantIds)
            : [];

        if (currentInstance !== instanceId) {
            return;
        }

        const inboundTargets = result.getInboundDependencies().map(dep => dep.getId());

        $deleteDialog.set({
            ...$deleteDialog.get(),
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
        $deleteDialog.setKey('failed', true);
        showError(error?.message ?? String(error));
    } finally {
        if (currentInstance === instanceId) {
            $deleteDialog.setKey('loading', false);
        }
    }
};

const reloadDeleteDialogDataDebounced = createDebounce(() => {
    void reloadDeleteDialogData();
}, 100);

//
// * State mutation helpers
//

const removeItemsByIds = (ids: Set<string>): {removedMain: boolean; removedDependant: boolean} => {
    const {items, dependants} = $deleteDialog.get();

    const newItems = items.filter(item => !ids.has(item.getContentId().toString()));
    const newDependants = dependants.filter(item => !ids.has(item.getContentId().toString()));

    const removedMain = newItems.length !== items.length;
    const removedDependant = newDependants.length !== dependants.length;

    if (removedMain || removedDependant) {
        $deleteDialog.set({
            ...$deleteDialog.get(),
            items: newItems,
            dependants: newDependants,
        });
    }

    return {removedMain, removedDependant};
};

//
// * Completion handling
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
// * Subscriptions
//

$deleteDialog.subscribe(({open}) => {
    if (open && !wasOpen) {
        void reloadDeleteDialogData();
    } else if (!open && wasOpen) {
        instanceId += 1;
    }
    wasOpen = open;
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
