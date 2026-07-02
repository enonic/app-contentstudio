import { showError, showFeedback, showSuccess } from '@enonic/lib-admin-ui/notify/MessageBus';
import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { fetchContentSummaries, compareContent, hasUnpublishedChildren } from '../../../entities/content';
import { calcSecondaryStatus, calcTreePublishStatus } from '../../../shared/lib/cms/content/status';
import {
    findIdsByParents,
    markAsReady,
    publishContent,
    resolvePublishDependencies as resolvePublishDeps,
} from '../../../entities/content/api/publish.api';
import { cleanupTask, trackTask } from '../../../entities/task';
import type { TaskResultState } from '../../../entities/task';
import { nextDependantExclusions } from '../../../shared/lib/cms/content/dependantsSelection';
import { hasContentById, hasContentIdInIds, isIdsEqual, uniqueIds } from '../../../shared/lib/cms/content/ids';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { $config } from '../../../shared/config/config.store';
import {
    $compareStatuses,
    $compareStatusesLoading,
    $dependantIds,
    $dependantWindow,
    $draftPublishDialogSelection,
    $hasUnpublishedChildrenIds,
    $isPublishReady,
    $isPublishSelectionSynced,
    $publishableContentIds,
    $publishableIds,
    $publishChecks,
    $publishDependantsSelection,
    $publishDialog,
    $publishDialogDependants,
    $publishDialogItemsWithChildren,
    $publishDialogPending,
    $publishScheduleErrors,
    $showExcludedDependants,
    $visibleDependantIds,
    DEPENDANT_LOAD_SIZE,
    filterItemsWithChildren,
    initialChecksState,
    initialPendingState,
    initialPublishDialogState,
    initialSelectionState,
    validateSchedule,
    type PublishDialogStore,
    type PublishSchedule,
} from './publishDialog.store';

//
// * Publish Dialog Commands
//
// The write path for the publish dialog: open/close/reset, selection and
// schedule mutations, data reloads, and the publish action itself.
// Components call these; subscription wiring lives in publishDialog.service.
//

// ! ID of the current fetch operation
// Used to cancel old ongoing fetch operations if the instanceId changes
let instanceId = 0;

let cleanLoad = false;

// Drops dependant exclusions and re-runs the auto-exclude pass on the next resolve (legacy `resetExclusions`)
let resetExclusions = false;

// Guard for compare-status fetches; bumped on reset and on each new fetch
let compareInstanceId = 0;

/** Drops dependant exclusions and re-runs the auto-exclude pass on the next reload. */
export const flagPublishExclusionsReset = (): void => {
    resetExclusions = true;
};

//
// * Public API
//

export const setPublishDialogState = (state: Partial<Omit<PublishDialogStore, 'open' | 'failed' | 'items'>>) => {
    const { message, ...exclusions } = state;

    $publishDialog.set({
        ...$publishDialog.get(),
        message,
        ...exclusions,
    });
    $draftPublishDialogSelection.set({
        ...$draftPublishDialogSelection.get(),
        ...exclusions,
    });
};

// SYNC

export const syncPublishDialogContext = async ({
    items,
    excludeChildrenIds = [],
    excludedDependantIds = [],
    message,
    schedule,
}: {
    items: ContentSummary[];
    excludeChildrenIds?: ContentId[];
    excludedDependantIds?: ContentId[];
    message?: string;
    schedule?: PublishSchedule;
}): Promise<void> => {
    const { open } = $publishDialog.get();
    const { submitting } = $publishDialogPending.get();
    if (open || submitting) return;

    resetPublishDialogContext();

    if (items.length === 0) {
        return;
    }

    cleanLoad = true;

    $publishDialog.set({
        open: false,
        failed: false,
        items,
        excludedItemsIds: [],
        excludedItemsWithChildrenIds: [...excludeChildrenIds],
        excludedDependantItemsIds: [...excludedDependantIds],
        message,
        schedule,
    });

    $draftPublishDialogSelection.set({
        excludedItemsIds: [],
        excludedItemsWithChildrenIds: [...excludeChildrenIds],
        excludedDependantItemsIds: [...excludedDependantIds],
    });

    await reloadPublishDialogData();
};

// OPEN & RESET

export const openPublishDialog = (
    items: ContentSummary[],
    includeChildItems = false,
    excludedIds: ContentId[] = [],
) => {
    const current = $publishDialog.value;

    if (current.open || items.length === 0) return;

    cleanLoad = true;

    const excludedItemsWithChildrenIds = !includeChildItems
        ? filterItemsWithChildren(items).map((item) => item.getContentId())
        : [];

    $publishDialog.set({
        open: true,
        failed: false,
        items,
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });

    // Reset dependants stores
    resetDependantsState();

    // TODO: Sync after updates to $publishDialog
    $draftPublishDialogSelection.set({
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });
};

export const openPublishDialogWithState = (items: ContentSummary[], excludedIds: ContentId[], message?: string) => {
    openPublishDialog(items, false, excludedIds);
    if (message) {
        $publishDialog.setKey('message', message);
    }
};

export const resetPublishDialogContext = () => {
    instanceId += 1;
    compareInstanceId += 1;
    cleanLoad = false;
    resetExclusions = false;
    const { taskId } = $publishDialogPending.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $publishDialog.set(structuredClone(initialPublishDialogState));
    $draftPublishDialogSelection.set(structuredClone(initialSelectionState));
    $publishChecks.set(structuredClone(initialChecksState));
    $showExcludedDependants.set(true);
    resetDependantsState();
    $publishDialogPending.set(initialPendingState);
    $hasUnpublishedChildrenIds.set(new Set());
    $compareStatuses.set(new Map());
    $compareStatusesLoading.set(false);
    $publishScheduleErrors.set({});
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
};

export const cancelDraftPublishDialogSelection = () => {
    const synced = $isPublishSelectionSynced.get();
    if (synced) return;

    const { excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds } = $publishDialog.get();

    $draftPublishDialogSelection.set({
        excludedItemsIds,
        excludedItemsWithChildrenIds,
        excludedDependantItemsIds,
    });
};

export const setPublishDialogItemSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialog.get().items);
    if (!hasItem) return;

    const { excludedItemsIds, ...rest } = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedItemsIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedItemsIds = selected ? excludedItemsIds.filter((i) => !i.equals(id)) : [...excludedItemsIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedItemsIds: newExcludedItemsIds,
    });
};

export const setPublishDialogItemWithChildrenSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialogItemsWithChildren.get());
    if (!hasItem) return;

    const { excludedItemsWithChildrenIds, ...rest } = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedItemsWithChildrenIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedItemsWithChildrenIds = selected
        ? excludedItemsWithChildrenIds.filter((i) => !i.equals(id))
        : [...excludedItemsWithChildrenIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedItemsWithChildrenIds: newExcludedItemsWithChildrenIds,
    });
};

export const setPublishDialogDependantItemSelected = (id: ContentId, selected: boolean) => {
    const hasItem = hasContentById(id, $publishDialogDependants.get());
    if (!hasItem) return;

    const { excludedDependantItemsIds, ...rest } = $draftPublishDialogSelection.get();

    const needsUpdate = hasContentIdInIds(id, excludedDependantItemsIds) !== !selected;
    if (!needsUpdate) return;

    const newExcludedDependantItemsIds = selected
        ? excludedDependantItemsIds.filter((i) => !i.equals(id))
        : [...excludedDependantItemsIds, id];

    $draftPublishDialogSelection.set({
        ...rest,
        excludedDependantItemsIds: newExcludedDependantItemsIds,
    });
};

export const togglePublishDialogDependantsSelection = () => {
    const selection = $publishDependantsSelection.get();
    if (selection.selectableIds.length === 0) return;

    const { excludedDependantItemsIds, ...rest } = $draftPublishDialogSelection.get();

    $draftPublishDialogSelection.set({
        ...rest,
        excludedDependantItemsIds: nextDependantExclusions(selection, excludedDependantItemsIds),
    });
};

export const togglePublishDialogShowExcluded = () => {
    $showExcludedDependants.set(!$showExcludedDependants.get());
};

export const setPublishDialogMessage = (message: string | undefined) => {
    $publishDialog.setKey('message', message);
};

// SCHEDULE

export const setPublishSchedule = (schedule: PublishSchedule | undefined) => {
    $publishDialog.setKey('schedule', schedule);
};

export const setPublishScheduleFrom = (from: Date | undefined) => {
    const current = $publishDialog.get().schedule ?? {};
    $publishDialog.setKey('schedule', { ...current, from });
    $publishScheduleErrors.setKey('from', undefined);
    updateScheduleRangeError();
};

export const setPublishScheduleTo = (to: Date | undefined) => {
    const current = $publishDialog.get().schedule ?? {};
    $publishDialog.setKey('schedule', { ...current, to });
    $publishScheduleErrors.setKey('to', undefined);
    updateScheduleRangeError();
};

export const setPublishScheduleFromError = (error: string | undefined) => {
    $publishScheduleErrors.setKey('from', error);
};

export const setPublishScheduleToError = (error: string | undefined) => {
    $publishScheduleErrors.setKey('to', error);
};

export const clearPublishSchedule = () => {
    $publishDialog.setKey('schedule', undefined);
    $publishScheduleErrors.set({});
};

const updateScheduleRangeError = () => {
    const { schedule } = $publishDialog.get();
    const { toError, rangeError } = validateSchedule(schedule);
    $publishScheduleErrors.setKey('to', toError);
    $publishScheduleErrors.setKey('range', rangeError);
};

export const removePublishDialogItem = (id: ContentId): void => {
    const { items } = $publishDialog.get();
    const newItems = items.filter((item) => !item.getContentId().equals(id));

    if (newItems.length === 0) {
        resetPublishDialogContext();
        return;
    }

    // Remove from draft exclusions if present
    const draft = $draftPublishDialogSelection.get();
    $draftPublishDialogSelection.set({
        ...draft,
        excludedItemsIds: draft.excludedItemsIds.filter((i) => !i.equals(id)),
        excludedItemsWithChildrenIds: draft.excludedItemsWithChildrenIds.filter((i) => !i.equals(id)),
    });

    // Remove from applied exclusions and items
    const current = $publishDialog.get();
    $publishDialog.set({
        ...current,
        items: newItems,
        excludedItemsIds: current.excludedItemsIds.filter((i) => !i.equals(id)),
        excludedItemsWithChildrenIds: current.excludedItemsWithChildrenIds.filter((i) => !i.equals(id)),
    });

    resetExclusions = true;
    reloadPublishDialogDataDebounced();
};

// DATA

let loadingMore = false;

const orderSummariesByIds = (summaries: ContentSummary[], orderIds: ContentId[]): ContentSummary[] => {
    const indexById = new Map<string, number>();
    orderIds.forEach((id, index) => indexById.set(id.toString(), index));
    const indexOf = (item: ContentSummary): number => indexById.get(item.getContentId().toString()) ?? orderIds.length;
    return [...summaries].sort((a, b) => indexOf(a) - indexOf(b));
};

// Loads the next slice into the window, preserving server order. Returns null if a
// newer reload superseded this one (guardId no longer matches the current instanceId).
async function loadDependantWindow(
    allIds: ContentId[],
    start: number,
    guardId: number,
): Promise<ContentSummary[] | null> {
    const sliceIds = allIds.slice(start, start + DEPENDANT_LOAD_SIZE);
    const summaries = sliceIds.length > 0 ? await fetchContentSummaries(sliceIds) : [];

    if (guardId !== instanceId) return null;

    if (sliceIds.length > 0 && summaries.length === 0) {
        return $publishDialogDependants.get();
    }

    const base = start === 0 ? [] : $publishDialogDependants.get();
    const merged = orderSummariesByIds([...base, ...summaries], allIds);

    $publishDialogDependants.set(merged);
    $dependantWindow.set(Math.min(start + DEPENDANT_LOAD_SIZE, allIds.length));

    return merged;
}

/** Lazy-load the next window of dependant summaries (triggered by list scroll). */
export const loadMoreDependants = async (): Promise<void> => {
    if (loadingMore) return;

    const allIds = $dependantIds.get();
    const loaded = $dependantWindow.get();
    if (loaded >= allIds.length) return;

    loadingMore = true;
    const guardId = instanceId;
    try {
        await loadDependantWindow(allIds, loaded, guardId);
    } finally {
        loadingMore = false;
    }
};

export async function reloadPublishDialogData(): Promise<void> {
    $compareStatuses.set(new Map());
    $compareStatusesLoading.set(false);

    try {
        $publishChecks.setKey('loading', true);

        const result = await resolvePublishDependencies();
        if (!result) return;

        const { publishableContentIds, visibleDependantIds, excludedItemsIds, excludedDependantItemsIds, ...checks } =
            result;

        // Dependant summaries are managed (windowed) inside resolvePublishDependencies
        $publishableContentIds.set(publishableContentIds);
        $visibleDependantIds.set(visibleDependantIds);

        // Only update exclusion IDs in $publishDialog
        $publishDialog.set({
            ...$publishDialog.get(),
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

        // Fetch unpublished children status
        const { items } = $publishDialog.get();
        await fetchHasUnpublishedChildren(items);

        // Verify compare status for online+modified items (non-blocking)
        void fetchCompareStatuses([...items, ...$publishDialogDependants.get()]);
    } catch (error) {
        $publishDialog.setKey('failed', true);
        // TODO: Notify error
    } finally {
        // ! Do not bump instanceId here: resolvePublishDependencies owns the guard
        // token. Incrementing it after a stale reload bails would also invalidate a
        // concurrently running reload, leaving both to skip their writes (0 publishable,
        // no banner, disabled button).
        $publishChecks.setKey('loading', false);
    }
}

/** Debounced reload to batch rapid server events (100ms delay like PublishProcessor) */
export const reloadPublishDialogDataDebounced = createDebounce(() => {
    reloadPublishDialogData();
}, 100);

// CHECKS

export const markAllAsReadyInProgressPublishItems = async (): Promise<void> => {
    const { loading } = $publishChecks.get();
    if (loading) return;

    const { inProgressIds } = $publishChecks.get();
    if (inProgressIds.length === 0) return;

    const ids = await markIdsReady(inProgressIds);
    if (ids.length === 0) return;

    const newInProgressIds = inProgressIds.filter((id) => !hasContentIdInIds(id, ids));
    $publishChecks.setKey('inProgressIds', newInProgressIds);
};

export const excludeInProgressPublishItems = (): ContentId[] => {
    const { excludedDependantItemsIds } = $publishDialog.get();
    const dependantItemsIds = $dependantIds.get();
    const inProgressDependantIds = $publishChecks
        .get()
        .inProgressIds.filter((id) => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...inProgressDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);

    return newExcludedDependantItemsIds;
};

export const excludeInvalidPublishItems = (): ContentId[] => {
    const { excludedDependantItemsIds } = $publishDialog.get();
    const dependantItemsIds = $dependantIds.get();
    const invalidDependantIds = $publishChecks
        .get()
        .invalidIds.filter((id) => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...invalidDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);

    return newExcludedDependantItemsIds;
};

export const excludeNotPublishablePublishItems = (): ContentId[] => {
    const { excludedDependantItemsIds } = $publishDialog.get();
    const dependantItemsIds = $dependantIds.get();
    const notPublishableDependantIds = $publishChecks
        .get()
        .notPublishableIds.filter((id) => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...notPublishableDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);

    return newExcludedDependantItemsIds;
};

// PUBLISH

export const publishItems = async (
    onComplete?: (state: TaskResultState, message: string) => void,
): Promise<boolean> => {
    const ready = $isPublishReady.get();
    if (!ready) return false;

    const publishableIds = $publishableIds.get();
    const { items } = $publishDialog.get();
    const pendingIds = publishableIds.map((id) => id.toString());
    const pendingPrimaryName = items[0]?.getDisplayName() || items[0]?.getPath()?.toString();
    const pendingTotal = publishableIds.length;

    try {
        const taskId = await sendPublishRequest();
        if (!taskId) {
            return false;
        }

        $publishDialogPending.set({
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
                            ? i18n('dialog.publish.success.multiple', total)
                            : i18n('dialog.publish.success.single', pendingPrimaryName ?? '');
                    showSuccess(successMessage);
                } else {
                    showError(message);
                }
                resetPublishDialogContext();
                onComplete?.(resultState, message);
            },
        });

        return true;
    } catch (error) {
        $publishDialogPending.set(initialPendingState);
        return false;
    }
};

//
// * Utilities
//

/** Clears all dependant-related state (full IDs, loaded window, publishable set). */
function resetDependantsState(): void {
    $publishDialogDependants.set([]);
    $dependantIds.set([]);
    $dependantWindow.set(0);
    $visibleDependantIds.set([]);
    $publishableContentIds.set([]);
}

//
// * Dependency Resolution
//

// TODO: Use AbortController to cancel the request if the instanceId changes

type ResolvePublishDependenciesResult = {
    publishableContentIds: ContentId[];
    schedulable: boolean;
    visibleDependantIds: ContentId[];
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

    const { items, excludedItemsIds, excludedDependantItemsIds, excludedItemsWithChildrenIds } = $publishDialog.get();

    const isCleanResolve = cleanLoad || resetExclusions;
    const baseExcludedDependantIds = resetExclusions ? [] : excludedDependantItemsIds;
    const initialExcludedIds = uniqueIds([...excludedItemsIds, ...baseExcludedDependantIds]);
    const allExcludedItemsWithChildrenIds = uniqueIds([...excludedItemsWithChildrenIds, ...excludedItemsIds]);

    const itemsIds = items.map((item) => item.getContentId());
    const itemsWithChildrenIds = $publishDialogItemsWithChildren
        .get()
        .filter((item) => {
            return !hasContentIdInIds(item.getContentId(), allExcludedItemsWithChildrenIds);
        })
        .map((item) => item.getContentId());

    const childrenIds = itemsWithChildrenIds.length > 0 ? await findIdsByParents(itemsWithChildrenIds) : [];
    const maxResult = await resolvePublishDeps({
        ids: itemsIds,
        excludedIds: excludedItemsIds,
        excludeChildrenIds: allExcludedItemsWithChildrenIds,
    });

    const excludeNonRequired = $config.get().excludeDependencies && isCleanResolve;
    const minExcludedIds = excludeNonRequired
        ? uniqueIds([
              ...initialExcludedIds,
              ...maxResult
                  .getDependants()
                  .filter((id) => !hasContentIdInIds(id, childrenIds) && !hasContentIdInIds(id, itemsIds)),
          ])
        : initialExcludedIds;

    // Skip the second request when its parameters match the first: maxResult
    // and minResult only differ when non-required dependencies are excluded.
    const minResult = isIdsEqual(minExcludedIds, excludedItemsIds)
        ? maxResult
        : await resolvePublishDeps({
              ids: itemsIds,
              excludedIds: minExcludedIds,
              excludeChildrenIds: allExcludedItemsWithChildrenIds,
          });

    if (currentInstanceId !== instanceId) return;

    cleanLoad = false;
    resetExclusions = false;

    const allDependantIds = maxResult.getDependants();
    const dependantIds = minResult.getDependants();

    const excludedIds = allDependantIds.filter((id) => {
        return (
            !hasContentIdInIds(id, childrenIds) &&
            !hasContentIdInIds(id, dependantIds) &&
            !hasContentIdInIds(id, itemsIds)
        );
    });

    // TODO: notifyIfOutboundContentsNotFound(maxResult);

    const invalidIds = minResult.getInvalid();
    const inProgressIds = minResult.getInProgress();
    const requiredIds = minResult.getRequired();
    const notPublishableIds = minResult.getNotPublishable();
    // const somePublishable = minResult.isSomePublishable();

    const nextDependantIds = minResult.getNextDependants();

    const visibleDependantIds = allDependantIds.filter(
        (id) =>
            hasContentIdInIds(id, dependantIds) ||
            hasContentIdInIds(id, nextDependantIds) ||
            hasContentIdInIds(id, childrenIds),
    );

    const inProgressIdsWithoutInvalid = inProgressIds.filter((id) => !hasContentIdInIds(id, invalidIds));
    const isNotAllExcluded = [...inProgressIdsWithoutInvalid, ...invalidIds].some((id) =>
        hasContentIdInIds(id, excludedIds),
    );
    if (isNotAllExcluded) {
        // TODO: notify 'dialog.publish.notAllExcluded'
    }

    // Store all ids; load only the first window of summaries (rest load on scroll).
    $dependantIds.set(allDependantIds);
    const loaded = await loadDependantWindow(allDependantIds, 0, currentInstanceId);
    if (loaded == null) return;

    const newExcludedItemsIds = items
        .filter(
            (item) =>
                hasContentIdInIds(item.getContentId(), excludedIds) ||
                hasContentIdInIds(item.getContentId(), excludedItemsIds),
        )
        .map((item) => item.getContentId());

    // Exclusions are computed from IDs (the full set), not from loaded summaries.
    const newExcludedDependantItemsIds = allDependantIds.filter(
        (id) => hasContentIdInIds(id, excludedIds) || hasContentIdInIds(id, baseExcludedDependantIds),
    );

    const isExcludableFromIds = (id: ContentId): boolean => {
        return (
            !hasContentIdInIds(id, newExcludedItemsIds) &&
            !hasContentIdInIds(id, requiredIds) &&
            hasContentIdInIds(id, dependantIds)
        );
    };

    const excludableInProgressIds = inProgressIdsWithoutInvalid.filter(isExcludableFromIds);
    const inProgressExcludable =
        excludableInProgressIds.length === inProgressIdsWithoutInvalid.length && inProgressIdsWithoutInvalid.length > 0;

    const excludableInvalidIds = invalidIds.filter(isExcludableFromIds);
    const invalidExcludable = excludableInvalidIds.length === invalidIds.length && invalidIds.length > 0;

    const excludableNotPublishableIds = notPublishableIds.filter(isExcludableFromIds);
    const notPublishableExcludable =
        excludableNotPublishableIds.length === notPublishableIds.length && notPublishableIds.length > 0;

    return {
        publishableContentIds: maxResult.getPublishable(),
        schedulable: maxResult.isSchedulable(),
        visibleDependantIds,
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

//
// * Requests
//

// TODO: Add mechanism to prevent conflicting requests for reload, mark as ready, and server updates
// Right now we just lock the dialog and pray. Amen
async function markIdsReady(ids: ContentId[]): Promise<ContentId[]> {
    try {
        await markAsReady(ids);
        const count = ids.length;
        const msg =
            count > 1
                ? i18n('notify.item.markedAsReady.multiple', count)
                : i18n('notify.item.markedAsReady', ids[0].toString());
        showFeedback(msg);
        return ids;
    } catch (e) {
        showError(i18n('notify.item.markedAsReady.error', ids.length));
        return [];
    }
}

type PublishRequestData = {
    ids: ContentId[];
    excludedIds: ContentId[];
    excludeChildrenIds: ContentId[];
};

/**
 * Build publish request data to match legacy publish semantics:
 * - ids: included main items only
 * - excludedIds: excluded dependant items only
 * - excludeChildrenIds: included main items where descendants should be excluded
 */
function buildPublishRequestData(): PublishRequestData {
    const { items, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds } = $publishDialog.get();

    const includedMainItems = items.filter((item) => !hasContentIdInIds(item.getContentId(), excludedItemsIds));

    const excludeChildrenIds = includedMainItems
        .filter((item) => !item.hasChildren() || hasContentIdInIds(item.getContentId(), excludedItemsWithChildrenIds))
        .map((item) => item.getContentId());

    return {
        ids: includedMainItems.map((item) => item.getContentId()),
        excludedIds: uniqueIds(excludedDependantItemsIds),
        excludeChildrenIds: uniqueIds(excludeChildrenIds),
    };
}

async function sendPublishRequest(): Promise<TaskId | undefined> {
    const { message, schedule } = $publishDialog.get();
    const publishRequestData = buildPublishRequestData();

    const hasScheduleValues = schedule?.from || schedule?.to;
    const resolvedSchedule = hasScheduleValues
        ? {
              from: schedule.from ?? new Date(),
              to: schedule.to,
          }
        : undefined;

    try {
        return await publishContent({
            ids: publishRequestData.ids,
            excludedIds: publishRequestData.excludedIds,
            excludeChildrenIds: publishRequestData.excludeChildrenIds,
            message: message || undefined,
            schedule: resolvedSchedule,
        });
    } catch (e) {
        showError(i18n('dialog.publish.publishing.error'));
        return undefined;
    }
}

async function fetchHasUnpublishedChildren(items: ContentSummary[]): Promise<void> {
    const itemsWithChildren = items.filter((item) => item.hasChildren());
    if (itemsWithChildren.length === 0) {
        $hasUnpublishedChildrenIds.set(new Set());
        return;
    }

    const ids = itemsWithChildren.map((item) => item.getContentId());
    const result = await hasUnpublishedChildren(ids);

    const set = new Set<string>();
    for (const [id, hasChildren] of result) {
        if (hasChildren) {
            set.add(id);
        }
    }
    $hasUnpublishedChildrenIds.set(set);
}

async function fetchCompareStatuses(allItems: ContentSummary[]): Promise<void> {
    const idsToCompare = allItems
        .filter((item) => {
            const publishStatus = calcTreePublishStatus(item);
            return calcSecondaryStatus(publishStatus, item) === 'modified';
        })
        .map((item) => item.getId());

    if (idsToCompare.length === 0) {
        $compareStatuses.set(new Map());
        $compareStatusesLoading.set(false);
        return;
    }

    const callId = ++compareInstanceId;
    $compareStatusesLoading.set(true);

    try {
        const result = await compareContent(idsToCompare);
        if (callId !== compareInstanceId) return;
        $compareStatuses.set(result);
    } catch (error) {
        if (callId !== compareInstanceId) return;
        console.error(error);
        $compareStatuses.set(new Map());
    } finally {
        if (callId === compareInstanceId) {
            $compareStatusesLoading.set(false);
        }
    }
}
