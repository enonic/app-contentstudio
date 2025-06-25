import {showError, showFeedback, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {IssueType} from '../../../../app/issue/IssueType';
import {PublishRequest} from '../../../../app/issue/PublishRequest';
import {CreateIssueRequest} from '../../../../app/issue/resource/CreateIssueRequest';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {markAsReady, resolvePublishDependencies} from '../../api/publish';
import {buildItems, dedupeItems, getItemIds} from '../../utils/cms/content/buildItems';
import {hasContentIdInIds, uniqueIds} from '../../utils/cms/content/ids';
import {createDebounce} from '../../utils/timing/createDebounce';

const DEPENDENCY_RELOAD_DELAY_MS = 150;

type RequestPublishDialogStore = {
    open: boolean;
    title: string;
    description: string;
    assigneeIds: string[];
    items: ContentSummaryAndCompareStatus[];
    excludedChildrenIds: ContentId[];
    dependants: ContentSummaryAndCompareStatus[];
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
    excludedChildrenIds: [],
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

const reloadDependenciesDebounced = createDebounce(() => {
    void reloadRequestPublishDependencies();
}, DEPENDENCY_RELOAD_DELAY_MS);

const patchItemsWithUpdates = (
    items: ContentSummaryAndCompareStatus[],
    updates: ContentSummaryAndCompareStatus[],
): ContentSummaryAndCompareStatus[] => {
    if (updates.length === 0) {
        return items;
    }

    const updateMap = new Map<string, ContentSummaryAndCompareStatus>();
    updates.forEach(item => updateMap.set(item.getId(), item));

    return items.map(item => updateMap.get(item.getId()) ?? item);
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
    $requestPublishDialog.set(structuredClone(initialState));
    resetChecksState();
};

export const openRequestPublishDialog = (
    items?: ContentSummaryAndCompareStatus[],
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
    items: ContentSummaryAndCompareStatus[],
    includeChildren = false,
): void => {
    const nextItems = dedupeItems(items);

    if (nextItems.length === 0) {
        $requestPublishDialog.set(resetDependenciesState({
            ...$requestPublishDialog.get(),
            items: [],
            excludedChildrenIds: [],
        }));
        resetChecksState();
        return;
    }

    const excludedChildrenIds = includeChildren ? [] : getItemIds(nextItems);

    $requestPublishDialog.set({
        ...$requestPublishDialog.get(),
        items: nextItems,
        excludedChildrenIds,
    });

    reloadDependenciesDebounced();
};

export const setRequestPublishItemIncludeChildren = (id: ContentId, includeChildren: boolean): void => {
    const state = $requestPublishDialog.get();
    const alreadyExcluded = hasContentIdInIds(id, state.excludedChildrenIds);

    if (includeChildren && alreadyExcluded) {
        $requestPublishDialog.setKey(
            'excludedChildrenIds',
            state.excludedChildrenIds.filter(item => !item.equals(id)),
        );
        reloadDependenciesDebounced();
        return;
    }

    if (!includeChildren && !alreadyExcluded) {
        $requestPublishDialog.setKey('excludedChildrenIds', [...state.excludedChildrenIds, id]);
        reloadDependenciesDebounced();
    }
};

export const removeRequestPublishItem = (id: ContentId): void => {
    const {items, excludedChildrenIds} = $requestPublishDialog.get();
    const newItems = items.filter(item => !item.getContentId().equals(id));

    if (newItems.length === 0) {
        resetRequestPublishDialogContext();
        return;
    }

    $requestPublishDialog.set({
        ...$requestPublishDialog.get(),
        items: newItems,
        excludedChildrenIds: excludedChildrenIds.filter(i => !i.equals(id)),
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
        const updatedItems = await fetchContentSummariesWithStatus(ids);
        if (updatedItems.length > 0) {
            const state = $requestPublishDialog.get();
            $requestPublishDialog.set({
                ...state,
                items: patchItemsWithUpdates(state.items, updatedItems),
                dependants: patchItemsWithUpdates(state.dependants, updatedItems),
            });
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
        .addPublishRequestItems(buildItems(state.items, state.excludedChildrenIds))
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
            excludeChildrenIds: state.excludedChildrenIds,
        });

        if (currentInstance !== instanceId) {
            return;
        }

        const dependantIds = result.getDependants()
            .filter(id => !hasContentIdInIds(id, itemIds));
        const dependants = await fetchContentSummariesWithStatus(dependantIds);

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
