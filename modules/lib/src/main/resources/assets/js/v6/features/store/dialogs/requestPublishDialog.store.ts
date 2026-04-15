import {showError, showFeedback, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {type ContentId} from '../../../../app/content/ContentId';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {IssueType} from '../../../../app/issue/IssueType';
import {PublishRequest} from '../../../../app/issue/PublishRequest';
import {CreateIssueRequest} from '../../../../app/issue/resource/CreateIssueRequest';
import {fetchContentSummaries} from '../../api/content';
import {markAsReady, resolvePublishDependencies} from '../../api/publish';
import {buildItems, dedupeItems, getItemIds} from '../../utils/cms/content/buildItems';
import {hasContentIdInIds, uniqueIds} from '../../utils/cms/content/ids';
import {patchItemsById} from '../../utils/cms/content/patchItemsById';
import {findContentIdsWithCreatedDescendants} from '../../utils/cms/content/paths';
import {createGuardedSocketHandler} from '../../utils/store/createGuardedSocketHandler';
import {createDebounce} from '../../utils/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentPublished,
    $contentRenamed,
    $contentUpdated,
} from '../socket.store';

const DEPENDENCY_RELOAD_DELAY_MS = 150;

type RequestPublishDialogStore = {
    open: boolean;
    title: string;
    description: string;
    assigneeIds: string[];
    items: ContentSummary[];
    excludeChildrenIds: ContentId[];
    dependants: ContentSummary[];
    excludedDependantIds: ContentId[];
    requiredDependantIds: ContentId[];
    loading: boolean;
    failed: boolean;
    submitting: boolean;
};

type RequestPublishChecksStore = {
    invalidIds: ContentId[];
    invalidExcludable: boolean;
    inProgressIds: ContentId[];
    inProgressExcludable: boolean;
    notPublishableIds: ContentId[];
    notPublishableExcludable: boolean;
};

const initialState: RequestPublishDialogStore = {
    open: false,
    title: '',
    description: '',
    assigneeIds: [],
    items: [],
    excludeChildrenIds: [],
    dependants: [],
    excludedDependantIds: [],
    requiredDependantIds: [],
    loading: false,
    failed: false,
    submitting: false,
};

const initialChecksState: RequestPublishChecksStore = {
    invalidIds: [],
    invalidExcludable: false,
    inProgressIds: [],
    inProgressExcludable: false,
    notPublishableIds: [],
    notPublishableExcludable: false,
};

export const $requestPublishDialog = map<RequestPublishDialogStore>(structuredClone(initialState));

const $requestPublishChecks = map<RequestPublishChecksStore>(structuredClone(initialChecksState));

export const $requestPublishDialogCreateCount = computed(
    $requestPublishDialog,
    ({items, dependants, excludedDependantIds}) => {
        const includedDependants = dependants.filter(item =>
            !hasContentIdInIds(item.getContentId(), excludedDependantIds));
        return items.length + includedDependants.length;
    },
);

export const $requestPublishDialogErrors = computed(
    [$requestPublishDialog, $requestPublishChecks],
    ({excludedDependantIds}, checks) => {
        const excludedSet = new Set<string>(excludedDependantIds.map(id => id.toString()));
        const invalidCount = checks.invalidIds.filter(id => !excludedSet.has(id.toString())).length;
        const inProgressCount = checks.inProgressIds.filter(id => !excludedSet.has(id.toString())).length;
        const noPermissionsCount = checks.notPublishableIds.filter(id => !excludedSet.has(id.toString())).length;

        return {
            invalid: {
                count: invalidCount,
                disabled: !checks.invalidExcludable,
            },
            inProgress: {
                count: inProgressCount,
                disabled: !checks.inProgressExcludable,
            },
            noPermissions: {
                count: noPermissionsCount,
                disabled: !checks.notPublishableExcludable,
            },
        };
    },
);

export const $isRequestPublishReady = computed(
    [$requestPublishDialog, $requestPublishDialogCreateCount, $requestPublishDialogErrors],
    ({loading, failed}, total, errors): boolean => {
        if (loading || failed) {
            return false;
        }
        return total > 0 &&
               errors.invalid.count === 0 &&
               errors.inProgress.count === 0 &&
               errors.noPermissions.count === 0;
    },
);

let instanceId = 0;
let hasQueuedRequestPublishSocketChanges = false;
const queuedRequestPublishRemovedIds = new Set<string>();

const reloadDependenciesDebounced = createDebounce(() => {
    void reloadRequestPublishDependencies();
}, DEPENDENCY_RELOAD_DELAY_MS);

const hasOpenRequestPublishDialog = (): boolean => {
    const {open, items} = $requestPublishDialog.get();
    return open && items.length > 0;
};

const isRequestPublishDialogActive = (): boolean => {
    const {submitting} = $requestPublishDialog.get();
    return hasOpenRequestPublishDialog() && !submitting;
};

const onActiveRequestPublishSocketEvent = createGuardedSocketHandler(isRequestPublishDialogActive);

const clearQueuedRequestPublishSocketChanges = (): void => {
    hasQueuedRequestPublishSocketChanges = false;
    queuedRequestPublishRemovedIds.clear();
};

const queueRequestPublishSocketChanges = (removedIds?: Iterable<string>): void => {
    hasQueuedRequestPublishSocketChanges = true;

    if (!removedIds) {
        return;
    }

    for (const id of removedIds) {
        queuedRequestPublishRemovedIds.add(id);
    }
};

const onRequestPublishSocketEvent = <T>(
    handler: (event: T) => void,
    getRemovedIds?: (event: T) => Iterable<string>,
): ((event: T | null | undefined) => void) => {
    const activeHandler = onActiveRequestPublishSocketEvent(handler);

    return (event) => {
        if (event == null) {
            return;
        }

        const {submitting} = $requestPublishDialog.get();
        if (submitting && hasOpenRequestPublishDialog()) {
            queueRequestPublishSocketChanges(getRemovedIds?.(event));
            return;
        }

        activeHandler(event);
    };
};

const patchTrackedRequestPublishItems = (
    updates: ContentSummary[],
): {updatedMain: boolean; updatedDependants: boolean} => {
    if (updates.length === 0) {
        return {updatedMain: false, updatedDependants: false};
    }

    const state = $requestPublishDialog.get();
    const patchedItems = patchItemsById(state.items, updates);
    const patchedDependants = patchItemsById(state.dependants, updates);
    const updatedMain = patchedItems.changed;
    const updatedDependants = patchedDependants.changed;

    if (!updatedMain && !updatedDependants) {
        return {updatedMain, updatedDependants};
    }

    $requestPublishDialog.set({
        ...state,
        items: patchedItems.items,
        dependants: patchedDependants.items,
    });

    return {updatedMain, updatedDependants};
};

const refreshRequestPublishMainItems = async (ids: ContentId[]): Promise<void> => {
    if (ids.length === 0) {
        return;
    }

    try {
        const updatedItems = await fetchContentSummaries(ids);
        if (updatedItems.length > 0) {
            patchTrackedRequestPublishItems(updatedItems);
        }
    } catch (error) {
        console.error(error);
    }
};

const syncQueuedRequestPublishSocketChanges = async (): Promise<void> => {
    if (!hasQueuedRequestPublishSocketChanges) {
        return;
    }

    const removedIds = new Set(queuedRequestPublishRemovedIds);
    clearQueuedRequestPublishSocketChanges();

    if (!hasOpenRequestPublishDialog()) {
        return;
    }

    if (removedIds.size > 0) {
        removeTrackedRequestPublishItems(removedIds);

        if ($requestPublishDialog.get().items.length === 0) {
            resetRequestPublishDialogContext();
            return;
        }
    }

    const itemIds = getItemIds($requestPublishDialog.get().items);
    if (itemIds.length > 0) {
        try {
            const updatedItems = await fetchContentSummaries(itemIds);
            if (updatedItems.length > 0) {
                patchTrackedRequestPublishItems(updatedItems);
            }
        } catch (error) {
            console.error(error);
        }
    }

    await reloadRequestPublishDependencies();
};

const removeTrackedRequestPublishItems = (
    idsToRemove: Set<string>,
): {removedMain: boolean; removedDependants: boolean} => {
    const state = $requestPublishDialog.get();
    const items = state.items.filter(item => !idsToRemove.has(item.getContentId().toString()));
    const dependants = state.dependants.filter(item => !idsToRemove.has(item.getContentId().toString()));
    const excludeChildrenIds = state.excludeChildrenIds.filter(id => !idsToRemove.has(id.toString()));
    const excludedDependantIds = state.excludedDependantIds.filter(id => !idsToRemove.has(id.toString()));
    const requiredDependantIds = state.requiredDependantIds.filter(id => !idsToRemove.has(id.toString()));

    const removedMain = items.length !== state.items.length;
    const removedDependants = dependants.length !== state.dependants.length;
    const exclusionsChanged = excludeChildrenIds.length !== state.excludeChildrenIds.length ||
        excludedDependantIds.length !== state.excludedDependantIds.length ||
        requiredDependantIds.length !== state.requiredDependantIds.length;

    if (!removedMain && !removedDependants && !exclusionsChanged) {
        return {removedMain, removedDependants};
    }

    $requestPublishDialog.set({
        ...state,
        items,
        dependants,
        excludeChildrenIds,
        excludedDependantIds,
        requiredDependantIds,
    });

    return {removedMain, removedDependants};
};

const getRemovedRequestPublishIds = (items: {getContentId: () => {toString: () => string}}[]): Set<string> => {
    return new Set(items.map(item => item.getContentId().toString()));
};

const handleRemovedRequestPublishItems = (idsToRemove: Set<string>): void => {
    const {removedMain, removedDependants} = removeTrackedRequestPublishItems(idsToRemove);

    if ($requestPublishDialog.get().items.length === 0) {
        resetRequestPublishDialogContext();
        return;
    }

    if (removedMain || removedDependants) {
        reloadDependenciesDebounced();
    }
};

const resetDependenciesState = (state: RequestPublishDialogStore): RequestPublishDialogStore => {
    return {
        ...state,
        dependants: [],
        excludedDependantIds: [],
        requiredDependantIds: [],
        loading: false,
        failed: false,
    };
};

const resetChecksState = (): void => {
    $requestPublishChecks.set(structuredClone(initialChecksState));
};

export const resetRequestPublishDialogContext = (): void => {
    instanceId += 1;
    reloadDependenciesDebounced.cancel();
    clearQueuedRequestPublishSocketChanges();
    $requestPublishDialog.set(structuredClone(initialState));
    resetChecksState();
};

export const openRequestPublishDialog = (
    items?: ContentSummary[],
    includeChildren = false,
): void => {
    resetRequestPublishDialogContext();

    if (items && items.length > 0) {
        setRequestPublishItems(items, includeChildren);
    }

    $requestPublishDialog.setKey('open', true);
};

export const setRequestPublishTitle = (title: string): void => {
    $requestPublishDialog.setKey('title', title);
};

export const setRequestPublishDescription = (description: string): void => {
    $requestPublishDialog.setKey('description', description);
};

export const setRequestPublishAssignees = (assigneeIds: string[]): void => {
    $requestPublishDialog.setKey('assigneeIds', [...assigneeIds]);
};

export const setRequestPublishItems = (
    items: ContentSummary[],
    includeChildren = false,
): void => {
    const nextItems = dedupeItems(items);

    if (nextItems.length === 0) {
        $requestPublishDialog.set(resetDependenciesState({
            ...$requestPublishDialog.get(),
            items: [],
            excludeChildrenIds: [],
        }));
        resetChecksState();
        return;
    }

    const excludeChildrenIds = includeChildren ? [] : getItemIds(nextItems);

    $requestPublishDialog.set({
        ...$requestPublishDialog.get(),
        items: nextItems,
        excludeChildrenIds,
    });

    reloadDependenciesDebounced();
};

export const setRequestPublishItemIncludeChildren = (id: ContentId, includeChildren: boolean): void => {
    const state = $requestPublishDialog.get();
    const alreadyExcluded = hasContentIdInIds(id, state.excludeChildrenIds);

    if (includeChildren && alreadyExcluded) {
        $requestPublishDialog.setKey(
            'excludeChildrenIds',
            state.excludeChildrenIds.filter(item => !item.equals(id)),
        );
        reloadDependenciesDebounced();
        return;
    }

    if (!includeChildren && !alreadyExcluded) {
        $requestPublishDialog.setKey('excludeChildrenIds', [...state.excludeChildrenIds, id]);
        reloadDependenciesDebounced();
    }
};

export const removeRequestPublishItem = (id: ContentId): void => {
    const {items, excludeChildrenIds} = $requestPublishDialog.get();
    const newItems = items.filter(item => !item.getContentId().equals(id));

    if (newItems.length === 0) {
        resetRequestPublishDialogContext();
        return;
    }

    $requestPublishDialog.set({
        ...$requestPublishDialog.get(),
        items: newItems,
        excludeChildrenIds: excludeChildrenIds.filter(i => !i.equals(id)),
    });

    reloadDependenciesDebounced();
};

export const setRequestPublishDependantIncluded = (id: ContentId, included: boolean): void => {
    const state = $requestPublishDialog.get();
    if (hasContentIdInIds(id, state.requiredDependantIds)) {
        return;
    }

    const isExcluded = hasContentIdInIds(id, state.excludedDependantIds);
    if (included && isExcluded) {
        $requestPublishDialog.setKey(
            'excludedDependantIds',
            state.excludedDependantIds.filter(item => !item.equals(id)),
        );
        return;
    }

    if (!included && !isExcluded) {
        $requestPublishDialog.setKey('excludedDependantIds', [...state.excludedDependantIds, id]);
    }
};

export const excludeInvalidRequestPublishItems = (): void => {
    const {dependants, excludedDependantIds, requiredDependantIds} = $requestPublishDialog.get();
    const dependantIds = dependants.map(item => item.getContentId());
    const invalidIds = $requestPublishChecks.get().invalidIds;
    const idsToExclude = invalidIds
        .filter(id => hasContentIdInIds(id, dependantIds))
        .filter(id => !hasContentIdInIds(id, requiredDependantIds));

    if (idsToExclude.length === 0) {
        return;
    }

    $requestPublishDialog.setKey(
        'excludedDependantIds',
        uniqueIds([...excludedDependantIds, ...idsToExclude]),
    );
};

export const excludeInProgressRequestPublishItems = (): void => {
    const {dependants, excludedDependantIds, requiredDependantIds} = $requestPublishDialog.get();
    const dependantIds = dependants.map(item => item.getContentId());
    const inProgressIds = $requestPublishChecks.get().inProgressIds;
    const idsToExclude = inProgressIds
        .filter(id => hasContentIdInIds(id, dependantIds))
        .filter(id => !hasContentIdInIds(id, requiredDependantIds));

    if (idsToExclude.length === 0) {
        return;
    }

    $requestPublishDialog.setKey(
        'excludedDependantIds',
        uniqueIds([...excludedDependantIds, ...idsToExclude]),
    );
};

export const excludeNotPublishableRequestPublishItems = (): void => {
    const {dependants, excludedDependantIds, requiredDependantIds} = $requestPublishDialog.get();
    const dependantIds = dependants.map(item => item.getContentId());
    const notPublishableIds = $requestPublishChecks.get().notPublishableIds;
    const idsToExclude = notPublishableIds
        .filter(id => hasContentIdInIds(id, dependantIds))
        .filter(id => !hasContentIdInIds(id, requiredDependantIds));

    if (idsToExclude.length === 0) {
        return;
    }

    $requestPublishDialog.setKey(
        'excludedDependantIds',
        uniqueIds([...excludedDependantIds, ...idsToExclude]),
    );
};

export const markAllAsReadyInProgressRequestPublishItems = async (): Promise<void> => {
    const currentState = $requestPublishDialog.get();
    if (currentState.loading) {
        return;
    }

    const {inProgressIds} = $requestPublishChecks.get();
    if (inProgressIds.length === 0) {
        return;
    }

    $requestPublishDialog.set({
        ...currentState,
        loading: true,
        failed: false,
    });

    const ids = await markIdsReady(inProgressIds);
    if (ids.length === 0) {
        $requestPublishDialog.setKey('loading', false);
        return;
    }

    await reloadRequestPublishDependencies();

    try {
        const updatedItems = await fetchContentSummaries(ids);
        if (updatedItems.length > 0) {
            patchTrackedRequestPublishItems(updatedItems);
        }
    } catch (error) {
        console.error(error);
    }
};

export const submitRequestPublishDialog = async (): Promise<void> => {
    const state = $requestPublishDialog.get();
    const title = state.title.trim();
    const ready = $isRequestPublishReady.get();

    if (!title || state.submitting || !ready) {
        return;
    }

    $requestPublishDialog.setKey('submitting', true);

    const approvers = state.assigneeIds.map(id => PrincipalKey.fromString(id));
    const publishRequest = PublishRequest
        .create()
        .addExcludeIds(state.excludedDependantIds)
        .addPublishRequestItems(buildItems(state.items, state.excludeChildrenIds))
        .build();

    try {
        const issue = await new CreateIssueRequest()
            .setApprovers(approvers)
            .setPublishRequest(publishRequest)
            .setTitle(title)
            .setDescription(state.description.trim())
            .setType(IssueType.PUBLISH_REQUEST)
            .sendAndParse();

        showSuccess(i18n('notify.publishRequest.created'));
        if (approvers.length > issue.getApprovers().length) {
            showWarning(i18n('notify.issue.assignees.norights'));
        }

        resetRequestPublishDialogContext();
    } catch (error) {
        console.error(error);
        showError(error?.message ?? String(error));
    } finally {
        $requestPublishDialog.setKey('submitting', false);

        if (hasOpenRequestPublishDialog()) {
            await syncQueuedRequestPublishSocketChanges();
        }
    }
};

const reloadRequestPublishDependencies = async (): Promise<void> => {
    const currentInstance = ++instanceId;
    const state = $requestPublishDialog.get();
    const itemIds = getItemIds(state.items);

    if (itemIds.length === 0) {
        $requestPublishDialog.set(resetDependenciesState({
            ...state,
            dependants: [],
            excludedDependantIds: [],
            requiredDependantIds: [],
        }));
        resetChecksState();
        return;
    }

    $requestPublishDialog.set({
        ...state,
        loading: true,
        failed: false,
    });

    try {
        const result = await resolvePublishDependencies({
            ids: itemIds,
            excludeChildrenIds: state.excludeChildrenIds,
        });

        if (currentInstance !== instanceId) {
            return;
        }

        const dependantIds = result.getDependants()
            .filter(id => !hasContentIdInIds(id, itemIds));
        const dependants = await fetchContentSummaries(dependantIds);

        if (currentInstance !== instanceId) {
            return;
        }

        const latestState = $requestPublishDialog.get();
        const requiredDependantIds = result.getRequired()
            .filter(id => hasContentIdInIds(id, dependantIds));
        const nextExcludedDependantIds = latestState.excludedDependantIds
            .filter(id => hasContentIdInIds(id, dependantIds))
            .filter(id => !hasContentIdInIds(id, requiredDependantIds));

        const invalidIds = result.getInvalid();
        const inProgressIds = result.getInProgress().filter(id => !hasContentIdInIds(id, invalidIds));
        const notPublishableIds = result.getNotPublishable();

        const isExcludable = (id: ContentId): boolean => {
            return !hasContentIdInIds(id, itemIds) &&
                   !hasContentIdInIds(id, requiredDependantIds) &&
                   hasContentIdInIds(id, dependantIds);
        };

        const invalidExcludable = invalidIds.length > 0 && invalidIds.every(id => isExcludable(id));
        const inProgressExcludable = inProgressIds.length > 0 && inProgressIds.every(id => isExcludable(id));
        const notPublishableExcludable = notPublishableIds.length > 0 && notPublishableIds.every(id => isExcludable(id));

        $requestPublishDialog.set({
            ...latestState,
            dependants,
            requiredDependantIds,
            excludedDependantIds: nextExcludedDependantIds,
            loading: false,
            failed: false,
        });

        $requestPublishChecks.set({
            invalidIds,
            invalidExcludable,
            inProgressIds,
            inProgressExcludable,
            notPublishableIds,
            notPublishableExcludable,
        });
    } catch (error) {
        if (currentInstance !== instanceId) {
            return;
        }
        console.error(error);
        $requestPublishDialog.set({
            ...$requestPublishDialog.get(),
            loading: false,
            failed: true,
        });
        showError(error?.message ?? String(error));
    }
};

const markIdsReady = async (ids: ContentId[]): Promise<ContentId[]> => {
    try {
        await markAsReady(ids);
        const count = ids.length;
        const message = count > 1
            ? i18n('notify.item.markedAsReady.multiple', count)
            : i18n('notify.item.markedAsReady', ids[0].toString());
        showFeedback(message);
        return ids;
    } catch (error) {
        showError(i18n('notify.item.markedAsReady.error', ids.length));
        return [];
    }
};

$contentCreated.subscribe(onRequestPublishSocketEvent((event) => {
    const mainItemIds = findContentIdsWithCreatedDescendants($requestPublishDialog.get().items, event.data);
    if (mainItemIds.length === 0) {
        return;
    }

    void refreshRequestPublishMainItems(mainItemIds).finally(() => {
        reloadDependenciesDebounced();
    });
}));

$contentUpdated.subscribe(onRequestPublishSocketEvent((event) => {
    const {updatedMain, updatedDependants} = patchTrackedRequestPublishItems(event.data);

    if (updatedMain || updatedDependants) {
        reloadDependenciesDebounced();
    }
}));

$contentRenamed.subscribe(onRequestPublishSocketEvent((event) => {
    patchTrackedRequestPublishItems(event.data.items);
}));

$contentDeleted.subscribe(onRequestPublishSocketEvent((event) => {
    handleRemovedRequestPublishItems(getRemovedRequestPublishIds(event.data));
}, (event) => event.data.map(item => item.getContentId().toString())));

$contentArchived.subscribe(onRequestPublishSocketEvent((event) => {
    handleRemovedRequestPublishItems(getRemovedRequestPublishIds(event.data));
}, (event) => event.data.map(item => item.getContentId().toString())));

$contentPublished.subscribe(onRequestPublishSocketEvent((event) => {
    handleRemovedRequestPublishItems(getRemovedRequestPublishIds(event.data));
}, (event) => event.data.map(item => item.getContentId().toString())));
