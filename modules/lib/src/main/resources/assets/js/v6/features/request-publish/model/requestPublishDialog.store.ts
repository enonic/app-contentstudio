import { showError, showFeedback, showSuccess, showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { IssueType } from '../../../../app/issue/IssueType';
import { PublishRequest } from '../../../../app/issue/PublishRequest';
import { createIssue } from '../../../entities/issue/api/issues.api';
import { fetchContentSummaries } from '../../../entities/content';
import { markAsReady, resolvePublishDependencies } from '../../../entities/content/api/publish.api';
import { buildItems, dedupeItems, getItemIds } from '../../../shared/lib/cms/content/buildItems';
import {
    DEPENDANT_LOAD_SIZE,
    createDependantWindowLoader,
    fetchDependantWindowSlice,
    orderSummariesByIds,
    pruneDependantWindow,
} from '../../../entities/content/lib/dependantWindow';
import { calcDependantsSelection, nextDependantExclusions } from '../../../shared/lib/cms/content/dependantsSelection';
import { hasContentIdInIds, uniqueIds } from '../../../shared/lib/cms/content/ids';
import { patchTrackedContentItems, removeTrackedContentItems } from '../../../shared/lib/cms/content/trackedItems';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';

const DEPENDENCY_RELOAD_DELAY_MS = 150;

type RequestPublishDialogStore = {
    open: boolean;
    title: string;
    description: string;
    assigneeIds: string[];
    items: ContentSummary[];
    excludeChildrenIds: ContentId[];
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;
    publishableContentIds: ContentId[];
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
};

const initialState: RequestPublishDialogStore = {
    open: false,
    title: '',
    description: '',
    assigneeIds: [],
    items: [],
    excludeChildrenIds: [],
    dependants: [],
    dependantIds: [],
    dependantWindow: 0,
    publishableContentIds: [],
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
};

export const $requestPublishDialog = map<RequestPublishDialogStore>(structuredClone(initialState));

const $requestPublishChecks = map<RequestPublishChecksStore>(structuredClone(initialChecksState));

export const $requestPublishDialogCreateCount = computed(
    $requestPublishDialog,
    ({ items, dependantIds, excludedDependantIds }) => {
        const includedDependants = dependantIds.filter((id) => !hasContentIdInIds(id, excludedDependantIds));
        return items.length + includedDependants.length;
    },
);

export const $requestPublishHasMoreDependants = computed(
    $requestPublishDialog,
    ({ dependantIds, dependantWindow }) => dependantWindow < dependantIds.length,
);

export const $requestPublishDependantsSelection = computed(
    $requestPublishDialog,
    ({ dependantIds, requiredDependantIds, excludedDependantIds }) =>
        calcDependantsSelection(dependantIds, requiredDependantIds, excludedDependantIds),
);

export const $requestPublishDialogErrors = computed(
    [$requestPublishDialog, $requestPublishChecks],
    ({ excludedDependantIds }, checks) => {
        const excludedSet = new Set<string>(excludedDependantIds.map((id) => id.toString()));
        const invalidCount = checks.invalidIds.filter((id) => !excludedSet.has(id.toString())).length;
        const inProgressCount = checks.inProgressIds.filter((id) => !excludedSet.has(id.toString())).length;

        return {
            invalid: {
                count: invalidCount,
                disabled: !checks.invalidExcludable,
            },
            inProgress: {
                count: inProgressCount,
                disabled: !checks.inProgressExcludable,
            },
        };
    },
);

export const $requestPublishPublishableCount = computed(
    $requestPublishDialog,
    ({ publishableContentIds, excludedDependantIds }) => {
        return publishableContentIds.filter((id) => !hasContentIdInIds(id, excludedDependantIds)).length;
    },
);

export const $isRequestPublishReady = computed(
    [
        $requestPublishDialog,
        $requestPublishDialogCreateCount,
        $requestPublishPublishableCount,
        $requestPublishDialogErrors,
    ],
    ({ loading, failed }, total, publishableCount, errors): boolean => {
        if (loading || failed) {
            return false;
        }
        // Publish permission is intentionally not a gate: a publish request is how a
        // user without publish rights asks someone else to publish.
        return total > 0 && publishableCount > 0 && errors.invalid.count === 0 && errors.inProgress.count === 0;
    },
);

let instanceId = 0;
let hasQueuedRequestPublishSocketChanges = false;
const queuedRequestPublishRemovedIds = new Set<string>();

export const reloadDependenciesDebounced = createDebounce(() => {
    void reloadRequestPublishDependencies();
}, DEPENDENCY_RELOAD_DELAY_MS);

export const hasOpenRequestPublishDialog = (): boolean => {
    const { open, items } = $requestPublishDialog.get();
    return open && items.length > 0;
};

const clearQueuedRequestPublishSocketChanges = (): void => {
    hasQueuedRequestPublishSocketChanges = false;
    queuedRequestPublishRemovedIds.clear();
};

export const queueRequestPublishSocketChanges = (removedIds?: Iterable<string>): void => {
    hasQueuedRequestPublishSocketChanges = true;

    if (!removedIds) {
        return;
    }

    for (const id of removedIds) {
        queuedRequestPublishRemovedIds.add(id);
    }
};

export const patchTrackedRequestPublishItems = (
    updates: ContentSummary[],
): { updatedMain: boolean; updatedDependants: boolean } => {
    const change = patchTrackedContentItems($requestPublishDialog.get(), updates);

    if (change.changed) {
        $requestPublishDialog.set(change.state);
    }

    return {
        updatedMain: change.changedMain,
        updatedDependants: change.changedDependants,
    };
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

export const removeTrackedRequestPublishItems = (
    idsToRemove: Set<string>,
): { removedMain: boolean; removedDependants: boolean } => {
    const change = removeTrackedContentItems($requestPublishDialog.get(), idsToRemove);
    const pruned = pruneDependantWindow(change.changed ? change.state : $requestPublishDialog.get(), idsToRemove);

    // The publishable set can also reference a removed dependant beyond the loaded window.
    const nextPublishableIds = pruned.state.publishableContentIds.filter((id) => !idsToRemove.has(id.toString()));
    const publishableChanged = nextPublishableIds.length !== pruned.state.publishableContentIds.length;

    if (change.changed || pruned.changed || publishableChanged) {
        $requestPublishDialog.set({
            ...pruned.state,
            publishableContentIds: nextPublishableIds,
        });
    }

    return {
        removedMain: change.changedMain,
        // An id-only prune (dependant beyond the loaded window) must also count:
        // callers rely on this flag to reschedule the reload that refreshes checks.
        removedDependants: change.changedDependants || pruned.changed,
    };
};

const resetDependenciesState = (state: RequestPublishDialogStore): RequestPublishDialogStore => {
    return {
        ...state,
        dependants: [],
        dependantIds: [],
        dependantWindow: 0,
        publishableContentIds: [],
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

export const openRequestPublishDialog = (items?: ContentSummary[], includeChildren = false): void => {
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

export const setRequestPublishItems = (items: ContentSummary[], includeChildren = false): void => {
    const nextItems = dedupeItems(items);

    if (nextItems.length === 0) {
        $requestPublishDialog.set(
            resetDependenciesState({
                ...$requestPublishDialog.get(),
                items: [],
                excludeChildrenIds: [],
            }),
        );
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
            state.excludeChildrenIds.filter((item) => !item.equals(id)),
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
    const { items, excludeChildrenIds } = $requestPublishDialog.get();
    const newItems = items.filter((item) => !item.getContentId().equals(id));

    if (newItems.length === 0) {
        resetRequestPublishDialogContext();
        return;
    }

    $requestPublishDialog.set({
        ...$requestPublishDialog.get(),
        items: newItems,
        excludeChildrenIds: excludeChildrenIds.filter((i) => !i.equals(id)),
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
            state.excludedDependantIds.filter((item) => !item.equals(id)),
        );
        return;
    }

    if (!included && !isExcluded) {
        $requestPublishDialog.setKey('excludedDependantIds', [...state.excludedDependantIds, id]);
    }
};

export const toggleRequestPublishDependantsSelection = (): void => {
    const { dependantIds, requiredDependantIds, excludedDependantIds } = $requestPublishDialog.get();
    const selection = calcDependantsSelection(dependantIds, requiredDependantIds, excludedDependantIds);
    if (selection.selectableIds.length === 0) {
        return;
    }

    $requestPublishDialog.setKey('excludedDependantIds', nextDependantExclusions(selection, excludedDependantIds));
};

export const excludeInvalidRequestPublishItems = (): void => {
    const { dependantIds, excludedDependantIds, requiredDependantIds } = $requestPublishDialog.get();
    const invalidIds = $requestPublishChecks.get().invalidIds;
    const idsToExclude = invalidIds
        .filter((id) => hasContentIdInIds(id, dependantIds))
        .filter((id) => !hasContentIdInIds(id, requiredDependantIds));

    if (idsToExclude.length === 0) {
        return;
    }

    $requestPublishDialog.setKey('excludedDependantIds', uniqueIds([...excludedDependantIds, ...idsToExclude]));
};

export const excludeInProgressRequestPublishItems = (): void => {
    const { dependantIds, excludedDependantIds, requiredDependantIds } = $requestPublishDialog.get();
    const inProgressIds = $requestPublishChecks.get().inProgressIds;
    const idsToExclude = inProgressIds
        .filter((id) => hasContentIdInIds(id, dependantIds))
        .filter((id) => !hasContentIdInIds(id, requiredDependantIds));

    if (idsToExclude.length === 0) {
        return;
    }

    $requestPublishDialog.setKey('excludedDependantIds', uniqueIds([...excludedDependantIds, ...idsToExclude]));
};

export const markAllAsReadyInProgressRequestPublishItems = async (): Promise<void> => {
    const currentState = $requestPublishDialog.get();
    if (currentState.loading) {
        return;
    }

    const { inProgressIds } = $requestPublishChecks.get();
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

    const approvers = state.assigneeIds.map((id) => PrincipalKey.fromString(id));
    const publishRequest = PublishRequest.create()
        .addExcludeIds(state.excludedDependantIds)
        .addPublishRequestItems(buildItems(state.items, state.excludeChildrenIds))
        .build();

    try {
        const result = await createIssue({
            title,
            description: state.description.trim(),
            approvers,
            publishRequest,
            type: IssueType.PUBLISH_REQUEST,
        });

        if (result.isErr()) {
            console.error(result.error);
            showError(result.error.message);
            return;
        }

        const issue = result.value;

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

export const loadMoreRequestPublishDependants = createDependantWindowLoader($requestPublishDialog, () => instanceId);

const reloadRequestPublishDependencies = async (): Promise<void> => {
    const currentInstance = ++instanceId;
    const state = $requestPublishDialog.get();
    const itemIds = getItemIds(state.items);

    if (itemIds.length === 0) {
        $requestPublishDialog.set(
            resetDependenciesState({
                ...state,
                dependants: [],
                excludedDependantIds: [],
                requiredDependantIds: [],
            }),
        );
        resetChecksState();
        return;
    }

    $requestPublishDialog.set({
        ...state,
        loading: true,
        failed: false,
    });

    try {
        const dependenciesResult = await resolvePublishDependencies({
            ids: itemIds,
            excludeChildrenIds: state.excludeChildrenIds,
        });

        if (currentInstance !== instanceId) {
            return;
        }

        if (dependenciesResult.isErr()) {
            console.error(dependenciesResult.error);
            $requestPublishDialog.set({
                ...$requestPublishDialog.get(),
                loading: false,
                failed: true,
            });
            showError(dependenciesResult.error.message);
            return;
        }

        const result = dependenciesResult.value;

        const allDependantIds = result.getDependants().filter((id) => !hasContentIdInIds(id, itemIds));

        const firstWindow = await fetchDependantWindowSlice(allDependantIds, 0);

        if (currentInstance !== instanceId) {
            return;
        }

        if (firstWindow.failed) {
            $requestPublishDialog.set({
                ...$requestPublishDialog.get(),
                loading: false,
                failed: true,
            });
            return;
        }

        const dependants = orderSummariesByIds(firstWindow.summaries, allDependantIds);

        const latestState = $requestPublishDialog.get();
        const requiredDependantIds = result.getRequired().filter((id) => hasContentIdInIds(id, allDependantIds));
        const nextExcludedDependantIds = latestState.excludedDependantIds
            .filter((id) => hasContentIdInIds(id, allDependantIds))
            .filter((id) => !hasContentIdInIds(id, requiredDependantIds));

        const invalidIds = result.getInvalid();
        const inProgressIds = result.getInProgress().filter((id) => !hasContentIdInIds(id, invalidIds));

        const isExcludable = (id: ContentId): boolean => {
            return (
                !hasContentIdInIds(id, itemIds) &&
                !hasContentIdInIds(id, requiredDependantIds) &&
                hasContentIdInIds(id, allDependantIds)
            );
        };

        const invalidExcludable = invalidIds.length > 0 && invalidIds.every((id) => isExcludable(id));
        const inProgressExcludable = inProgressIds.length > 0 && inProgressIds.every((id) => isExcludable(id));

        $requestPublishDialog.set({
            ...latestState,
            dependants,
            dependantIds: allDependantIds,
            dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, allDependantIds.length),
            publishableContentIds: result.getPublishable(),
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
    const result = await markAsReady(ids);
    return result.match(
        () => {
            const count = ids.length;
            const message =
                count > 1
                    ? i18n('notify.item.markedAsReady.multiple', count)
                    : i18n('notify.item.markedAsReady', ids[0].toString());
            showFeedback(message);
            return ids;
        },
        () => {
            showError(i18n('notify.item.markedAsReady.error', ids.length));
            return [];
        },
    );
};
