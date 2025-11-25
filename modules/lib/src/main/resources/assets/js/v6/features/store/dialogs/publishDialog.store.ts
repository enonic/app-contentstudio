import {computed, map} from 'nanostores';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentId} from '../../../../app/content/ContentId';
import {hasContentById, hasContentIdInIds, isIdsEqual, uniqueIds} from '../../utils/cms/content/ids';
import {ResolvePublishDependenciesRequest} from '../../../../app/resource/ResolvePublishDependenciesRequest';
import {FindIdsByParentsRequest} from '../../../../app/resource/FindIdsByParentsRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {MarkAsReadyRequest} from '../../../../app/resource/MarkAsReadyRequest';
import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {PublishContentRequest} from '../../../../app/resource/PublishContentRequest';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';

type MainItem = {
    id: string;
    content: ContentSummaryAndCompareStatus;
    included: boolean;
    childrenIncluded: boolean;
    required: boolean;
};

type DependantItem = {
    id: string;
    content: ContentSummaryAndCompareStatus;
    included: boolean;
    required: boolean;
};

type PublishDialogSelectionStore = {
    excludedItemsIds: ContentId[];
    excludedItemsWithChildrenIds: ContentId[];
    excludedDependantItemsIds: ContentId[];
}

type PublishDialogStore = {
    // State
    open: boolean;
    failed: boolean;
    // Content
    items: ContentSummaryAndCompareStatus[];
    dependantItems: ContentSummaryAndCompareStatus[];
    message?: string;
} & PublishDialogSelectionStore;

type PublishChecksStore = {
    loading: boolean;
    requiredIds: ContentId[];
    invalidIds: ContentId[];
    invalidExcludable: boolean;
    inProgressIds: ContentId[];
    inProgressExcludable: boolean;
    notPublishableIds: ContentId[];
    notPublishableExcludable: boolean;
}

type PublishCheckError = {
    count: number;
    disabled: boolean;
};

type PublishCheckErrorsStore = {
    invalid: PublishCheckError;
    inProgress: PublishCheckError;
    noPermissions: PublishCheckError;
}

export const $publishDialog = map<PublishDialogStore>({
    open: false,
    failed: false,
    items: [],
    dependantItems: [],
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
});

const $publishDialogItemsWithChildren = computed($publishDialog, (state) => {
    return filterItemsWithChildren(state.items);
});

export const $draftPublishDialogSelection = map<PublishDialogSelectionStore>({
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
});

export const $isPublishSelectionSynced = computed([$draftPublishDialogSelection, $publishDialog], (draft, current): boolean => {
    const {excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = current;
    return isIdsEqual(excludedItemsIds, draft.excludedItemsIds) &&
        isIdsEqual(excludedItemsWithChildrenIds, draft.excludedItemsWithChildrenIds) &&
        isIdsEqual(excludedDependantItemsIds, draft.excludedDependantItemsIds);
});

const $publishChecks = map<PublishChecksStore>({
    loading: false,
    requiredIds: [],
    invalidIds: [],
    invalidExcludable: false,
    inProgressIds: [],
    inProgressExcludable: false,
    notPublishableIds: [],
    notPublishableExcludable: false,
});

export const $mainPublishItems = computed([$publishDialog, $draftPublishDialogSelection, $publishChecks], ({items}, {excludedItemsIds, excludedItemsWithChildrenIds}, {requiredIds}): MainItem[] => {
    return items.map(item => ({
        id: item.getId(),
        content: item,
        included: !hasContentIdInIds(item.getContentId(), excludedItemsIds),
        childrenIncluded: !hasContentIdInIds(item.getContentId(), excludedItemsWithChildrenIds),
        required: hasContentIdInIds(item.getContentId(), requiredIds),
    }));
});

export const $dependantPublishItems = computed([$publishDialog, $draftPublishDialogSelection, $publishChecks], ({dependantItems}, {excludedDependantItemsIds}, {requiredIds}): DependantItem[] => {
    return dependantItems.map(item => ({
        id: item.getId(),
        content: item,
        included: !hasContentIdInIds(item.getContentId(), excludedDependantItemsIds),
        required: hasContentIdInIds(item.getContentId(), requiredIds),
    }));
});

export const $publishableIds = computed([$mainPublishItems, $dependantPublishItems], (mainItems, dependantItems): ContentId[] => {
    return [...mainItems, ...dependantItems].filter(item => item.included).map(item => item.content.getContentId());
});

export const $totalPublishableItems = computed($publishableIds, (publishableIds): number => {
    return publishableIds.length;
});

export const $publishCheckErrors = computed([$publishChecks], (state): PublishCheckErrorsStore => {
    return {
        invalid: {
            count: state.invalidIds.length,
            disabled: !state.invalidExcludable,
        },
        inProgress: {
            count: state.inProgressIds.length,
            disabled: !state.inProgressExcludable,
        },
        noPermissions: {
            count: state.notPublishableIds.length,
            disabled: !state.notPublishableExcludable,
        },
    };
});

export const $isPublishChecking = computed([$publishChecks], ({loading}): boolean => {
    return loading;
});

export const $isPublishReady = computed([$publishChecks, $isPublishSelectionSynced, $totalPublishableItems], ({loading, invalidIds, inProgressIds, notPublishableIds}, synced, totalPublishableItems): boolean => {
    return synced && !loading && invalidIds.length === 0 && inProgressIds.length === 0 && notPublishableIds.length === 0 && totalPublishableItems > 0;
});

// ! ID of the current fetch operation
// Used to cancel old ongoing fetch operations if the instanceId changes
let instanceId = 0;

//
// * Public API
//

export const setPublishDialogState = (state: Partial<Omit<PublishDialogStore, 'open' | 'failed' | 'items' | 'dependantItems'>>) => {
    const {message, ...exclusions} = state;

    $publishDialog.set({
        ...$publishDialog.get(),
        message,
        ...exclusions,
    });
    $draftPublishDialogSelection.set({
        ...$draftPublishDialogSelection.get(),
        ...exclusions,
    });
}

// OPEN & RESET

export const openPublishDialog = (items: ContentSummaryAndCompareStatus[], includeChildItems = false, excludedIds: ContentId[] = []) => {
    const current = $publishDialog.value;

    if (current.open || items.length === 0) return;

    const excludedItemsWithChildrenIds = !includeChildItems ? filterItemsWithChildren(items).map(item => item.getContentId()) : [];

    $publishDialog.set({
        open: true,
        failed: false,
        items,
        dependantItems: [],
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });

    // TODO: Sync after updates to $publishDialog
    $draftPublishDialogSelection.set({
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });
};

export const openPublishDialogWithState = (items: ContentSummaryAndCompareStatus[], excludedIds: ContentId[], message?: string) => {
    openPublishDialog(items, false, excludedIds);
    if (message) {
        $publishDialog.setKey('message', message);
    }
}

export const resetPublishDialogContext = () => {
    $publishDialog.set({
        open: false,
        failed: false,
        items: [],
        dependantItems: [],
        excludedItemsIds: [],
        excludedItemsWithChildrenIds: [],
        excludedDependantItemsIds: [],
    });

    $draftPublishDialogSelection.set({
        excludedItemsIds: [],
        excludedItemsWithChildrenIds: [],
        excludedDependantItemsIds: [],
    });

    $publishChecks.set({
        loading: false,
        requiredIds: [],
        invalidIds: [],
        invalidExcludable: false,
        inProgressIds: [],
        inProgressExcludable: false,
        notPublishableIds: [],
        notPublishableExcludable: false,
    });

    instanceId += 1;
};

// SELECTION

export const applyDraftPublishDialogSelection = () => {
    const synced = $isPublishSelectionSynced.get();
    if (synced) return;

    const selection = $draftPublishDialogSelection.get();

    $publishDialog.set({
        ...$publishDialog.get(),
        ...selection,
    });
}

export const cancelDraftPublishDialogSelection = () => {
    const synced = $isPublishSelectionSynced.get();
    if (synced) return;

    const {excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = $publishDialog.get();

    $draftPublishDialogSelection.set({
        excludedItemsIds,
        excludedItemsWithChildrenIds,
        excludedDependantItemsIds,
    });
}

export const setPublishDialogItemSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialog.get().items);
    if (!hasItem) return;

    const {excludedItemsIds, ...rest} = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedItemsIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedItemsIds = selected ? excludedItemsIds.filter(i => !i.equals(id)) : [...excludedItemsIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedItemsIds: newExcludedItemsIds,
    });
}

export const setPublishDialogItemWithChildrenSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialogItemsWithChildren.get());
    if (!hasItem) return;

    const {excludedItemsWithChildrenIds, ...rest} = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedItemsWithChildrenIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedItemsWithChildrenIds = selected ? excludedItemsWithChildrenIds.filter(i => !i.equals(id)) : [...excludedItemsWithChildrenIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedItemsWithChildrenIds: newExcludedItemsWithChildrenIds,
    });
}

export const setPublishDialogDependantItemSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialog.get().dependantItems);
    if (!hasItem) return;

    const {excludedDependantItemsIds, ...rest} = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedDependantItemsIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedDependantItemsIds = selected ? excludedDependantItemsIds.filter(i => !i.equals(id)) : [...excludedDependantItemsIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedDependantItemsIds: newExcludedDependantItemsIds,
    });
}

// DATA

async function reloadPublishDialogData(): Promise<void> {
    try {
        $publishChecks.setKey('loading', true);

        const result = await resolvePublishDependencies();
        if (!result) return;

        const {dependantItems, excludedItemsIds, excludedDependantItemsIds, ...checks} = result;

        $publishDialog.set({
            ...$publishDialog.get(),
            dependantItems,
            excludedItemsIds,
            excludedDependantItemsIds,
        });

        $draftPublishDialogSelection.set({
            ...$draftPublishDialogSelection.get(),
            excludedItemsIds,
            excludedDependantItemsIds,
        });

        $publishChecks.set({
            ...$publishChecks.get(),
            ...checks,
        });
    } catch (error) {
        $publishDialog.setKey('failed', true);
        // TODO: Notify error
    } finally {
        $publishChecks.setKey('loading', false);
        instanceId += 1;
    }
}

// CHECKS

export const markAllAsReadyInProgressPublishItems = async (): Promise<void> => {
    const {loading} = $publishChecks.get();
    if (loading) return;

    const {inProgressIds} = $publishChecks.get();
    if (inProgressIds.length === 0) return;

    const ids = await markIdsReady(inProgressIds);
    if (ids.length === 0) return;

    const newInProgressIds = inProgressIds.filter(id => !hasContentIdInIds(id, ids));
    $publishChecks.setKey('inProgressIds', newInProgressIds);
};

export const excludeInProgressPublishItems = (): void => {
    const {dependantItems, excludedDependantItemsIds} = $publishDialog.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const inProgressDependantIds = $publishChecks.get().inProgressIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...inProgressDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
};

export const excludeInvalidPublishItems = (): void => {
    const {dependantItems, excludedDependantItemsIds} = $publishDialog.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const invalidDependantIds = $publishChecks.get().invalidIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...invalidDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
};

export const excludeNotPublishablePublishItems = (): void => {
    const {dependantItems, excludedDependantItemsIds} = $publishDialog.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const notPublishableDependantIds = $publishChecks.get().notPublishableIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...notPublishableDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
};

// PUBLISH

export const publishItems = async (): Promise<void> => {
    const ready = $isPublishReady.get();
    if (!ready) return;

    const taskId = await sendPublishRequest();
    if (!taskId) return;

    // pollTask(taskId);

    $publishDialog.setKey('open', false);
};

//
// * Utilities
//

const filterItemsWithChildren = (items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] => {
    return items.filter(item => item.hasChildren());
};

//
// * Internal
//

$publishDialog.subscribe(({open}, _) => {
    if (!open) return;

    reloadPublishDialogData();
});

// TODO: Use AbortController to cancel the request if the instanceId changes

type ResolvePublishDependenciesResult = {
    dependantItems: ContentSummaryAndCompareStatus[];
    excludedItemsIds: ContentId[];
    excludedDependantItemsIds: ContentId[];
    requiredIds: ContentId[];
    invalidIds: ContentId[];
    invalidExcludable: boolean;
    inProgressIds: ContentId[];
    inProgressExcludable: boolean;
    notPublishableIds: ContentId[];
    notPublishableExcludable: boolean;
};

async function resolvePublishDependencies(): Promise<ResolvePublishDependenciesResult | undefined> {
    instanceId += 1;
    const currentInstanceId = instanceId;

    const {items, excludedItemsIds, excludedDependantItemsIds, excludedItemsWithChildrenIds} = $publishDialog.get();

    const initialExcludedIds = uniqueIds([...excludedItemsIds, ...excludedDependantItemsIds]);
    const allExcludedItemsWithChildrenIds = uniqueIds([...excludedItemsWithChildrenIds, ...excludedItemsIds]);

    const itemsIds = items.map(item => item.getContentId());
    const itemsWithChildrenIds = $publishDialogItemsWithChildren.get().filter(item => {
        return !hasContentIdInIds(item.getContentId(), allExcludedItemsWithChildrenIds);
    }).map(item => item.getContentId());

    const childrenIds = itemsWithChildrenIds.length > 0 ? await new FindIdsByParentsRequest(itemsWithChildrenIds).sendAndParse() : [];
    const maxResult = await createResolveDependenciesRequest(itemsIds, excludedItemsIds, allExcludedItemsWithChildrenIds).sendAndParse();
    const minResult = await createResolveDependenciesRequest(itemsIds, initialExcludedIds, allExcludedItemsWithChildrenIds).sendAndParse();

    if (currentInstanceId !== instanceId) return;

    const excludedIds = maxResult.getDependants().filter(id => {
        return !hasContentIdInIds(id, childrenIds) &&
            !hasContentIdInIds(id, minResult.getDependants()) &&
            !hasContentIdInIds(id, itemsIds);
    });

    // TODO: notifyIfOutboundContentsNotFound(maxResult);

    const dependantIds = minResult.getDependants();
    const invalidIds = minResult.getInvalid();
    const inProgressIds = minResult.getInProgress();
    const requiredIds = minResult.getRequired();
    // const nextIds = minResult.getNextDependants();
    const notPublishableIds = minResult.getNotPublishable();
    // const somePublishable = minResult.isSomePublishable();

    // setExcludedIds(excludedIds);

    const inProgressIdsWithoutInvalid = inProgressIds.filter(id => !hasContentIdInIds(id, invalidIds));
    const isNotAllExcluded = [...inProgressIdsWithoutInvalid, ...invalidIds].some(id => hasContentIdInIds(id, excludedIds));
    if (isNotAllExcluded) {
        // TODO: notify 'dialog.publish.notAllExcluded'
    }

    const missingExcludedIds = dependantIds.filter(id =>
        !hasContentIdInIds(id, childrenIds) &&
        !hasContentIdInIds(id, minResult.getDependants()) &&
        !hasContentIdInIds(id, itemsIds));

    const fullExcludedIds = uniqueIds([...excludedIds, ...missingExcludedIds]);

    const allDependantIds = maxResult.getDependants();

    // TODO: Cache dependant items
    const dependantItems = await fetchContentSummaryAndCompareStatus(allDependantIds);

    if (currentInstanceId !== instanceId) return;

    // const publishedDependantItems = dependantItems.filter(item => item.isPublished() && item.isOnline());
    // const publishedDependantItemsIds = publishedDependantItems.map(item => item.getContentId());

    // const filteredChildren = childrenIds.filter(id => !hasContentIdInIds(id, publishedDependantItemsIds));

    const newExcludedItemsIds = items.filter(item =>
        hasContentIdInIds(item.getContentId(), fullExcludedIds) ||
        hasContentIdInIds(item.getContentId(), excludedItemsIds)
    ).map(item => item.getContentId());

    const newExcludedDependantItemsIds = dependantItems.filter(item =>
        hasContentIdInIds(item.getContentId(), fullExcludedIds) ||
        hasContentIdInIds(item.getContentId(), excludedDependantItemsIds)
    ).map(item => item.getContentId());

    const isExcludableFromIds = (id: ContentId): boolean => {
        return !hasContentIdInIds(id, newExcludedItemsIds) &&
            !hasContentIdInIds(id, requiredIds) &&
            hasContentIdInIds(id, dependantIds);
    };

    const excludableInProgressIds = inProgressIdsWithoutInvalid.filter(isExcludableFromIds);
    const inProgressExcludable = excludableInProgressIds.length === inProgressIdsWithoutInvalid.length && inProgressIdsWithoutInvalid.length > 0;

    const excludableInvalidIds = invalidIds.filter(isExcludableFromIds);
    const invalidExcludable = excludableInvalidIds.length === invalidIds.length && invalidIds.length > 0;

    const excludableNotPublishableIds = notPublishableIds.filter(isExcludableFromIds);
    const notPublishableExcludable = excludableNotPublishableIds.length === notPublishableIds.length && notPublishableIds.length > 0;

    return {
        dependantItems,
        excludedItemsIds: newExcludedItemsIds,
        excludedDependantItemsIds: newExcludedDependantItemsIds,
        requiredIds,
        invalidIds,
        invalidExcludable,
        inProgressIds: inProgressIdsWithoutInvalid,
        inProgressExcludable,
        notPublishableIds,
        notPublishableExcludable,
    };
}

// REQUESTS

function createResolveDependenciesRequest(ids: ContentId[], excludedIds: ContentId[] = [], excludedChildrenIds: ContentId[] = []): ResolvePublishDependenciesRequest {
    return ResolvePublishDependenciesRequest.create()
        .setIds(ids)
        .setExcludedIds(excludedIds)
        .setExcludeChildrenIds(excludedChildrenIds)
        .build();
}

async function fetchContentSummaryAndCompareStatus(ids: ContentId[]): Promise<ContentSummaryAndCompareStatus[]> {
    if (ids.length === 0) return [];
    return await new ContentSummaryAndCompareStatusFetcher().fetchAndCompareStatus(ids);
}

// TODO: Add mechanism to prevent conflicting requests for reload, mark as ready, and server updates
// Right now we just lock the dialog and pray. Amen
async function markIdsReady(ids: ContentId[]): Promise<ContentId[]> {
    try {
        await new MarkAsReadyRequest(ids).sendAndParse();
        const count = ids.length;
        const msg = count > 1 ? i18n('notify.item.markedAsReady.multiple', count) : i18n('notify.item.markedAsReady', ids[0].toString());
        showFeedback(msg);
        return ids;
    } catch (e) {
        showError(i18n('notify.item.markedAsReady.error', ids.length));
        return [];
    }
}

async function sendPublishRequest(): Promise<TaskId | undefined> {
    const publishableIds = $publishableIds.get();
    const {message, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = $publishDialog.get();
    const allExcludedItemsWithChildrenIds = uniqueIds([...excludedItemsWithChildrenIds, ...excludedItemsIds]);
    const allExcludedItemsIds = uniqueIds([...excludedItemsIds, ...excludedDependantItemsIds, ...allExcludedItemsWithChildrenIds]);

    const request = new PublishContentRequest()
        .setIds(publishableIds)
        .setMessage(message || undefined)
        .setExcludedIds(allExcludedItemsIds)
        .setExcludeChildrenIds(allExcludedItemsWithChildrenIds);

    try {
        const taskId = await request.sendAndParse();
        showFeedback(i18n('dialog.publish.publishing', publishableIds.length));
        return taskId;
    } catch (e) {
        showError(i18n('dialog.publish.publishing.error'));
        return undefined;
    }
}
