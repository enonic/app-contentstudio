import {showError, showFeedback, showSuccess} from '@enonic/lib-admin-ui/notify/MessageBus';
import type {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {atom, computed, map} from 'nanostores';
import {type ContentId} from '../../../../app/content/ContentId';
import type {ContentSummary} from '../../../../app/content/ContentSummary';
import {fetchContentSummaries} from '../../api/content';
import {type CompareResult, compareContent} from '../../api/compare';
import {PublishStatus} from '../../../../app/publish/PublishStatus';
import {calcSecondaryStatus, calcTreePublishStatus} from '../../utils/cms/content/status';
import {hasUnpublishedChildren} from '../../api/hasUnpublishedChildren';
import {findIdsByParents, markAsReady, publishContent, resolvePublishDependencies as resolvePublishDeps} from '../../api/publish';
import {cleanupTask, trackTask} from '../../services/task.service';
import {hasContentById, hasContentIdInIds, isIdsEqual, uniqueIds} from '../../utils/cms/content/ids';
import {findContentIdsWithCreatedDescendants} from '../../utils/cms/content/paths';
import {
    createContentIdSet,
    patchContentItemsByContentId,
    removeContentItemsById,
} from '../../utils/cms/content/trackedItems';
import {createGuardedSocketHandler} from '../../utils/store/createGuardedSocketHandler';
import {createDebounce} from '../../utils/timing/createDebounce';
import {$config} from '../config.store';
import {$contentArchived, $contentCreated, $contentDeleted, $contentPublished, $contentRenamed, $contentUpdated} from '../socket.store';
import type {TaskResultState} from '../task.store';

//
// * Types
//

type MainItem = {
    id: string;
    content: ContentSummary;
    included: boolean;
    childrenIncluded: boolean;
    required: boolean;
    hasUnpublishedChildren: boolean;
};

type DependantItem = {
    id: string;
    content: ContentSummary;
    included: boolean;
    required: boolean;
    excludedByDefault: boolean;
    hidden: boolean;
};

type PublishDialogSelectionStore = {
    excludedItemsIds: ContentId[];
    excludedItemsWithChildrenIds: ContentId[];
    excludedDependantItemsIds: ContentId[];
}

export type PublishSchedule = {
    from?: Date;
    to?: Date;
};

type PublishScheduleErrors = {
    from?: string;
    to?: string;
    range?: string;
};

type ScheduleValidationResult = {
    valid: boolean;
    fromError?: string;
    toError?: string;
    rangeError?: string;
};

type PublishDialogStore = {
    // State
    open: boolean;
    failed: boolean;
    // Content
    items: ContentSummary[];
    // dependantItems moved to $publishDialogDependants
    message?: string;
    schedule?: PublishSchedule;
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

type PublishDialogPendingStore = {
    submitting: boolean;
    pendingIds: string[];
    pendingTotal: number;
    pendingPrimaryName?: string;
    taskId?: TaskId;
};

//
// * Store State
//

const initialPublishDialogState: PublishDialogStore = {
    open: false,
    failed: false,
    items: [],
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
};

const initialSelectionState: PublishDialogSelectionStore = {
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
};

const initialChecksState: PublishChecksStore = {
    loading: false,
    requiredIds: [],
    invalidIds: [],
    invalidExcludable: false,
    inProgressIds: [],
    inProgressExcludable: false,
    notPublishableIds: [],
    notPublishableExcludable: false,
};

const initialPendingState: PublishDialogPendingStore = {
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    pendingPrimaryName: undefined,
    taskId: undefined,
};

export const $publishDialog = map<PublishDialogStore>(structuredClone(initialPublishDialogState));

export const $draftPublishDialogSelection = map<PublishDialogSelectionStore>(structuredClone(initialSelectionState));

const $publishChecks = map<PublishChecksStore>(structuredClone(initialChecksState));

// Store for resolved dependencies (output of reloadPublishDialogData)
const $publishDialogDependants = atom<ContentSummary[]>([]);

// Dependant ids visible in the dialog (legacy `calcVisibleIds`): min dependants, direct excluded deps, included children
const $visibleDependantIds = atom<ContentId[]>([]);

export const $publishDialogPending = map<PublishDialogPendingStore>(initialPendingState);

// Store for IDs of items that have unpublished children
const $hasUnpublishedChildrenIds = atom<Set<string>>(new Set());

// Store for verified compare statuses of online+modified items
const $compareStatuses = atom<Map<string, CompareResult>>(new Map());
const $compareStatusesLoading = atom<boolean>(false);
let compareInstanceId = 0;

// Store for schedule field errors
const $publishScheduleErrors = map<PublishScheduleErrors>({});

//
// * Derived State
//

const $publishDialogItemsWithChildren = computed($publishDialog, (state) => {
    return filterItemsWithChildren(state.items);
});

// Computed store: Set of main item IDs that have at least one unpublished child
const $itemsWithUnpublishedChildren = computed(
    [$publishDialog, $hasUnpublishedChildrenIds],
    ({items}, hasUnpublishedIds): Set<string> => {
        const result = new Set<string>();
        for (const item of items) {
            if (item.hasChildren() && hasUnpublishedIds.has(item.getId())) {
                result.add(item.getId());
            }
        }
        return result;
    }
);

export const $isPublishSelectionSynced = computed([$draftPublishDialogSelection, $publishDialog], (draft, current): boolean => {
    const {excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = current;
    return isIdsEqual(excludedItemsIds, draft.excludedItemsIds) &&
        isIdsEqual(excludedItemsWithChildrenIds, draft.excludedItemsWithChildrenIds) &&
        isIdsEqual(excludedDependantItemsIds, draft.excludedDependantItemsIds);
});

export const $mainPublishItems = computed([$publishDialog, $draftPublishDialogSelection, $publishChecks, $itemsWithUnpublishedChildren], ({items}, {excludedItemsIds, excludedItemsWithChildrenIds}, {requiredIds}, itemsWithUnpublished): MainItem[] => {
    return items.map(item => ({
        id: item.getId(),
        content: item,
        included: !hasContentIdInIds(item.getContentId(), excludedItemsIds),
        childrenIncluded: !hasContentIdInIds(item.getContentId(), excludedItemsWithChildrenIds),
        required: hasContentIdInIds(item.getContentId(), requiredIds),
        hasUnpublishedChildren: itemsWithUnpublished.has(item.getId()),
    }));
});

export const $dependantPublishItems = computed(
    [$publishDialogDependants, $publishDialog, $draftPublishDialogSelection, $publishChecks, $visibleDependantIds],
    (dependantItems, {excludedDependantItemsIds}, {excludedDependantItemsIds: draftExcludedIds}, {requiredIds}, visibleIds): DependantItem[] => {
        return dependantItems.map(item => ({
            id: item.getId(),
            content: item,
            included: !hasContentIdInIds(item.getContentId(), draftExcludedIds),
            required: hasContentIdInIds(item.getContentId(), requiredIds),
            excludedByDefault: hasContentIdInIds(item.getContentId(), excludedDependantItemsIds),
            hidden: !hasContentIdInIds(item.getContentId(), visibleIds),
        }));
    }
);

// Excluded dependants that can be toggled via "Show/Hide excluded" (legacy `hasExcluded`)
export const $hasExcludedDependantItems = computed($dependantPublishItems, (items): boolean => {
    return items.some(item => item.excludedByDefault && !item.hidden && !item.required);
});

export const $publishableIds = computed([$mainPublishItems, $dependantPublishItems], (mainItems, dependantItems): ContentId[] => {
    return [...mainItems, ...dependantItems].filter(item => {
        return item.included && calcSecondaryStatus(calcTreePublishStatus(item.content), item.content) != null;
    }).map(item => item.content.getContentId());
});

export const $totalPublishableItems = computed($publishableIds, (publishableIds): number => {
    return publishableIds.length;
});

// Scheduling only makes sense when at least one item is not currently online.
// Mirrors legacy `hasSchedulable`: hide when all items are Published, Modified, or Scheduled.
export const $hasSchedulableItems = computed(
    [$publishDialog, $publishDialogDependants],
    ({items}, dependants): boolean => {
        return [...items, ...dependants].some(item => {
            const status = calcTreePublishStatus(item);
            return status === PublishStatus.OFFLINE || status === PublishStatus.EXPIRED;
        });
    },
);

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

export const $publishCompareStatuses = computed($compareStatuses, (map) => map);

export const $isCompareStatusesLoading = computed($compareStatusesLoading, (loading) => loading);

export const $isScheduleValid = computed([$publishDialog, $publishScheduleErrors], ({schedule}, errors): boolean => {
    if (errors.from || errors.to || errors.range) {
        return false;
    }
    return validateSchedule(schedule).valid;
});

export const $scheduleFromError = computed([$publishDialog, $publishScheduleErrors], ({schedule}, {from, range}): string | undefined => {
    return from ?? validateSchedule(schedule).fromError ?? range;
});

export const $scheduleToError = computed($publishScheduleErrors, ({to}): string | undefined => {
    return to;
});

export const $isPublishReady = computed([$publishChecks, $isPublishSelectionSynced, $totalPublishableItems, $isScheduleValid], ({loading, invalidIds, inProgressIds, notPublishableIds}, synced, totalPublishableItems, scheduleValid): boolean => {
    return synced && !loading && invalidIds.length === 0 && inProgressIds.length === 0 && notPublishableIds.length === 0 && totalPublishableItems > 0 && scheduleValid;
});

export const $publishTaskId = computed($publishDialogPending, ({taskId}) => taskId);

// ! ID of the current fetch operation
// Used to cancel old ongoing fetch operations if the instanceId changes
let instanceId = 0;

let cleanLoad = false;

// Drops dependant exclusions and re-runs the auto-exclude pass on the next resolve (legacy `resetExclusions`)
let resetExclusions = false;

//
// * Public API
//

export const setPublishDialogState = (state: Partial<Omit<PublishDialogStore, 'open' | 'failed' | 'items'>>) => {
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
    const {open} = $publishDialog.get();
    const {submitting} = $publishDialogPending.get();
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

export const openPublishDialog = (items: ContentSummary[], includeChildItems = false, excludedIds: ContentId[] = []) => {
    const current = $publishDialog.value;

    if (current.open || items.length === 0) return;

    cleanLoad = true;

    const excludedItemsWithChildrenIds = !includeChildItems ? filterItemsWithChildren(items).map(item => item.getContentId()) : [];

    $publishDialog.set({
        open: true,
        failed: false,
        items,
        excludedItemsIds: [...excludedIds],
        excludedItemsWithChildrenIds: [...excludedItemsWithChildrenIds],
        excludedDependantItemsIds: [...excludedIds],
    });

    // Reset dependants store
    $publishDialogDependants.set([]);
    $visibleDependantIds.set([]);

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
}

export const resetPublishDialogContext = () => {
    instanceId += 1;
    compareInstanceId += 1;
    cleanLoad = false;
    resetExclusions = false;
    const {taskId} = $publishDialogPending.get();
    if (taskId) {
        cleanupTask(taskId);
    }
    $publishDialog.set(structuredClone(initialPublishDialogState));
    $draftPublishDialogSelection.set(structuredClone(initialSelectionState));
    $publishChecks.set(structuredClone(initialChecksState));
    $publishDialogDependants.set([]);
    $visibleDependantIds.set([]);
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
    const hasItem = hasContentById(id, $publishDialogDependants.get());
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

export const setPublishDialogMessage = (message: string | undefined) => {
    $publishDialog.setKey('message', message);
}

// SCHEDULE

export const setPublishSchedule = (schedule: PublishSchedule | undefined) => {
    $publishDialog.setKey('schedule', schedule);
};

export const setPublishScheduleFrom = (from: Date | undefined) => {
    const current = $publishDialog.get().schedule ?? {};
    $publishDialog.setKey('schedule', {...current, from});
    $publishScheduleErrors.setKey('from', undefined);
    updateScheduleRangeError();
};

export const setPublishScheduleTo = (to: Date | undefined) => {
    const current = $publishDialog.get().schedule ?? {};
    $publishDialog.setKey('schedule', {...current, to});
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
    const {schedule} = $publishDialog.get();
    const {toError, rangeError} = validateSchedule(schedule);
    $publishScheduleErrors.setKey('to', toError);
    $publishScheduleErrors.setKey('range', rangeError);
};

const validateSchedule = (schedule: PublishSchedule | undefined): ScheduleValidationResult => {
    if (!schedule) {
        return {valid: true};
    }
    // The `publishingWizard.requiredPublishFrom` config makes "Online from" mandatory
    // whenever scheduling is active.
    if ($config.get().requiredPublishFrom && !schedule.from) {
        return {valid: false, fromError: i18n('field.value.required')};
    }
    if (!schedule.from && !schedule.to) {
        return {valid: true};
    }
    if (!schedule.to) {
        return {valid: true};
    }
    const now = new Date();
    if (schedule.to <= now) {
        return {valid: false, toError: i18n('field.schedule.invalid.past')};
    }
    const fromDate = schedule.from ?? now;
    if (schedule.to <= fromDate) {
        return {valid: false, rangeError: i18n('field.schedule.invalid')};
    }
    return {valid: true};
};

export const removePublishDialogItem = (id: ContentId): void => {
    const {items} = $publishDialog.get();
    const newItems = items.filter(item => !item.getContentId().equals(id));

    if (newItems.length === 0) {
        resetPublishDialogContext();
        return;
    }

    // Remove from draft exclusions if present
    const draft = $draftPublishDialogSelection.get();
    $draftPublishDialogSelection.set({
        ...draft,
        excludedItemsIds: draft.excludedItemsIds.filter(i => !i.equals(id)),
        excludedItemsWithChildrenIds: draft.excludedItemsWithChildrenIds.filter(i => !i.equals(id)),
    });

    // Remove from applied exclusions and items
    const current = $publishDialog.get();
    $publishDialog.set({
        ...current,
        items: newItems,
        excludedItemsIds: current.excludedItemsIds.filter(i => !i.equals(id)),
        excludedItemsWithChildrenIds: current.excludedItemsWithChildrenIds.filter(i => !i.equals(id)),
    });

    resetExclusions = true;
    reloadPublishDialogDataDebounced();
};

// DATA

async function reloadPublishDialogData(): Promise<void> {
    $compareStatuses.set(new Map());
    $compareStatusesLoading.set(false);

    try {
        $publishChecks.setKey('loading', true);

        const result = await resolvePublishDependencies();
        if (!result) return;

        const {dependantItems, visibleDependantIds, excludedItemsIds, excludedDependantItemsIds, ...checks} = result;

        // Write dependantItems to separate store
        $publishDialogDependants.set(dependantItems);
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
        const {items} = $publishDialog.get();
        await fetchHasUnpublishedChildren(items);

        // Verify compare status for online+modified items (non-blocking)
        void fetchCompareStatuses([...items, ...dependantItems]);
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

export const excludeInProgressPublishItems = (): ContentId[] => {
    const {excludedDependantItemsIds} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const inProgressDependantIds = $publishChecks.get().inProgressIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...inProgressDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);

    return newExcludedDependantItemsIds;
};

export const excludeInvalidPublishItems = (): ContentId[] => {
    const {excludedDependantItemsIds} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const invalidDependantIds = $publishChecks.get().invalidIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
    const newExcludedDependantItemsIds = uniqueIds([...excludedDependantItemsIds, ...invalidDependantIds]);

    $draftPublishDialogSelection.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);
    $publishDialog.setKey('excludedDependantItemsIds', newExcludedDependantItemsIds);

    return newExcludedDependantItemsIds;
};

export const excludeNotPublishablePublishItems = (): ContentId[] => {
    const {excludedDependantItemsIds} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const dependantItemsIds = dependantItems.map(item => item.getContentId());
    const notPublishableDependantIds = $publishChecks.get().notPublishableIds.filter(id => hasContentIdInIds(id, dependantItemsIds));
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
    const {items} = $publishDialog.get();
    const pendingIds = publishableIds.map(id => id.toString());
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
                    const successMessage = total > 1
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

const filterItemsWithChildren = (items: ContentSummary[]): ContentSummary[] => {
    return items.filter(item => item.hasChildren());
};

//
// * Internal Helpers
//

/** Debounced reload to batch rapid server events (100ms delay like PublishProcessor) */
const reloadPublishDialogDataDebounced = createDebounce(() => {
    reloadPublishDialogData();
}, 100);

/** Check if dialog is open and has items */
const isDialogActive = (): boolean => {
    const {open, items} = $publishDialog.get();
    return open && items.length > 0;
};

const onPublishSocketEvent = createGuardedSocketHandler(isDialogActive);
const onIdlePublishSocketEvent = createGuardedSocketHandler(() => {
    const {submitting} = $publishDialogPending.get();
    return !submitting && isDialogActive();
});

/** Remove items by IDs from both main items and dependant items */
const removeItemsByIds = (idsToRemove: Set<string>): {removedMain: boolean; removedDependant: boolean} => {
    const {items} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();

    const nextItems = removeContentItemsById(items, idsToRemove);
    const nextDependantItems = removeContentItemsById(dependantItems, idsToRemove);
    const removedMain = nextItems.changed;
    const removedDependant = nextDependantItems.changed;

    if (removedMain) {
        $publishDialog.setKey('items', nextItems.items);
    }
    if (removedDependant) {
        $publishDialogDependants.set(nextDependantItems.items);
    }

    return {removedMain, removedDependant};
};

const handleRemovedPublishItems = (idsToRemove: Set<string>): void => {
    const {removedMain, removedDependant} = removeItemsByIds(idsToRemove);

    if ($publishDialog.get().items.length === 0) {
        resetPublishDialogContext();
        return;
    }

    if (removedMain) {
        resetExclusions = true;
    }

    if (removedMain || removedDependant) {
        reloadPublishDialogDataDebounced();
    }
};

const patchTrackedPublishItems = (
    updates: ContentSummary[],
): {updatedMain: boolean; updatedDependants: boolean} => {
    if (updates.length === 0) {
        return {updatedMain: false, updatedDependants: false};
    }

    const {items} = $publishDialog.get();
    const dependantItems = $publishDialogDependants.get();
    const patchedItems = patchContentItemsByContentId(items, updates);
    const patchedDependants = patchContentItemsByContentId(dependantItems, updates);
    const updatedMain = patchedItems.changed;
    const updatedDependants = patchedDependants.changed;

    if (updatedMain) {
        $publishDialog.setKey('items', patchedItems.items);
    }

    if (updatedDependants) {
        $publishDialogDependants.set(patchedDependants.items);
    }

    return {updatedMain, updatedDependants};
};

const refreshPublishDialogMainItems = async (ids: ContentId[]): Promise<void> => {
    if (ids.length === 0) {
        return;
    }

    try {
        const updatedItems = await fetchContentSummaries(ids);
        if (updatedItems.length > 0) {
            const {items} = $publishDialog.get();
            const patchedItems = patchContentItemsByContentId(items, updatedItems);

            if (patchedItems.changed && isDialogActive()) {
                $publishDialog.setKey('items', patchedItems.items);
            }
        }
    } catch (error) {
        console.error(error);
    }
};

//
// * Internal Subscriptions
//

// Reload data when dialog opens OR exclusions change
$publishDialog.subscribe((state, oldState) => {
    const {open, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = state;
    const wasOpen = !!oldState?.open;
    const {loading} = $publishChecks.get();

    if (!open) {
        return;
    }

    // Initial open - always reload
    if (!wasOpen) {
        reloadPublishDialogData();
        return;
    }

    // Already loading - skip
    if (loading) return;

    // Check if exclusions changed since last resolve
    const childrenExclusionsChanged = !isIdsEqual(excludedItemsWithChildrenIds, oldState?.excludedItemsWithChildrenIds);
    const exclusionsChanged =
        childrenExclusionsChanged ||
        !isIdsEqual(excludedItemsIds, oldState?.excludedItemsIds) ||
        !isIdsEqual(excludedDependantItemsIds, oldState?.excludedDependantItemsIds);

    if (childrenExclusionsChanged) {
        resetExclusions = true;
    }

    if (exclusionsChanged) {
        reloadPublishDialogDataDebounced();
    }
});

//
// * Socket Event Handlers
//

// Handle content created: reload dependencies as new content might be a child or dependency
$contentCreated.subscribe(onPublishSocketEvent((event) => {
    const mainItemIds = findContentIdsWithCreatedDescendants($publishDialog.get().items, event.data);
    if (mainItemIds.length === 0) return;

    void refreshPublishDialogMainItems(mainItemIds).finally(() => {
        reloadPublishDialogDataDebounced();
    });
}));

// Handle content updates: patch visible items and reload checks if tracked content changed
$contentUpdated.subscribe(onPublishSocketEvent((event) => {
    const {updatedMain, updatedDependants} = patchTrackedPublishItems(event.data);

    // Reload when tracked items change so SelectionStatusBar stays in sync.
    if (updatedMain || updatedDependants) {
        reloadPublishDialogDataDebounced();
    }
}));

// Handle content renames: patch tracked rows without forcing dependency resolution
$contentRenamed.subscribe(onPublishSocketEvent((event) => {
    patchTrackedPublishItems(event.data.items);
}));

// Handle content deletion: remove from lists, close if no items left, reload if needed
$contentDeleted.subscribe(onPublishSocketEvent((event) => {
    handleRemovedPublishItems(createContentIdSet(event.data));
}));

// Handle content archived: same as delete
$contentArchived.subscribe(onPublishSocketEvent((event) => {
    handleRemovedPublishItems(createContentIdSet(event.data));
}));

//
// * Completion Handling
//

// Handle content published: close dialog if all main items were published
$contentPublished.subscribe(onIdlePublishSocketEvent((event) => {
    const {items} = $publishDialog.get();
    const publishedIds = new Set(event.data.map(item => item.getId()));

    // Check if all main items were published
    const allMainItemsPublished = items.every(item => publishedIds.has(item.getId()));
    if (allMainItemsPublished) {
        resetPublishDialogContext();
        return;
    }

    // Otherwise reload to update status
    reloadPublishDialogDataDebounced();
}));

// TODO: Use AbortController to cancel the request if the instanceId changes

type ResolvePublishDependenciesResult = {
    dependantItems: ContentSummary[];
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

    const {items, excludedItemsIds, excludedDependantItemsIds, excludedItemsWithChildrenIds} = $publishDialog.get();

    const isCleanResolve = cleanLoad || resetExclusions;
    const baseExcludedDependantIds = resetExclusions ? [] : excludedDependantItemsIds;
    const initialExcludedIds = uniqueIds([...excludedItemsIds, ...baseExcludedDependantIds]);
    const allExcludedItemsWithChildrenIds = uniqueIds([...excludedItemsWithChildrenIds, ...excludedItemsIds]);

    const itemsIds = items.map(item => item.getContentId());
    const itemsWithChildrenIds = $publishDialogItemsWithChildren.get().filter(item => {
        return !hasContentIdInIds(item.getContentId(), allExcludedItemsWithChildrenIds);
    }).map(item => item.getContentId());

    const childrenIds = itemsWithChildrenIds.length > 0 ? await findIdsByParents(itemsWithChildrenIds) : [];
    const maxResult = await resolvePublishDeps({ids: itemsIds, excludedIds: excludedItemsIds, excludeChildrenIds: allExcludedItemsWithChildrenIds});

    const excludeNonRequired = $config.get().excludeDependencies && isCleanResolve;
    const minExcludedIds = excludeNonRequired
        ? uniqueIds([
            ...initialExcludedIds,
            ...maxResult.getDependants().filter(id =>
                !hasContentIdInIds(id, childrenIds) && !hasContentIdInIds(id, itemsIds)),
        ])
        : initialExcludedIds;
    const minResult = await resolvePublishDeps({ids: itemsIds, excludedIds: minExcludedIds, excludeChildrenIds: allExcludedItemsWithChildrenIds});

    if (currentInstanceId !== instanceId) return;

    cleanLoad = false;
    resetExclusions = false;

    const allDependantIds = maxResult.getDependants();
    const dependantIds = minResult.getDependants();

    const excludedIds = allDependantIds.filter(id => {
        return !hasContentIdInIds(id, childrenIds) &&
            !hasContentIdInIds(id, dependantIds) &&
            !hasContentIdInIds(id, itemsIds);
    });

    // TODO: notifyIfOutboundContentsNotFound(maxResult);

    const invalidIds = minResult.getInvalid();
    const inProgressIds = minResult.getInProgress();
    const requiredIds = minResult.getRequired();
    const notPublishableIds = minResult.getNotPublishable();
    // const somePublishable = minResult.isSomePublishable();

    const nextDependantIds = minResult.getNextDependants();

    const visibleDependantIds = allDependantIds.filter(id =>
        hasContentIdInIds(id, dependantIds) ||
        hasContentIdInIds(id, nextDependantIds) ||
        hasContentIdInIds(id, childrenIds));

    const inProgressIdsWithoutInvalid = inProgressIds.filter(id => !hasContentIdInIds(id, invalidIds));
    const isNotAllExcluded = [...inProgressIdsWithoutInvalid, ...invalidIds].some(id => hasContentIdInIds(id, excludedIds));
    if (isNotAllExcluded) {
        // TODO: notify 'dialog.publish.notAllExcluded'
    }

    // TODO: Cache dependant items
    const dependantItems = await fetchContentSummaries(allDependantIds);

    if (currentInstanceId !== instanceId) return;

    const newExcludedItemsIds = items.filter(item =>
        hasContentIdInIds(item.getContentId(), excludedIds) ||
        hasContentIdInIds(item.getContentId(), excludedItemsIds)
    ).map(item => item.getContentId());

    const newExcludedDependantItemsIds = dependantItems.filter(item =>
        hasContentIdInIds(item.getContentId(), excludedIds) ||
        hasContentIdInIds(item.getContentId(), baseExcludedDependantIds)
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
        const msg = count > 1 ? i18n('notify.item.markedAsReady.multiple', count) : i18n('notify.item.markedAsReady', ids[0].toString());
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
    const {items, excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds} = $publishDialog.get();

    const includedMainItems = items.filter(item => !hasContentIdInIds(item.getContentId(), excludedItemsIds));

    const excludeChildrenIds = includedMainItems
        .filter(item => !item.hasChildren() || hasContentIdInIds(item.getContentId(), excludedItemsWithChildrenIds))
        .map(item => item.getContentId());

    return {
        ids: includedMainItems.map(item => item.getContentId()),
        excludedIds: uniqueIds(excludedDependantItemsIds),
        excludeChildrenIds: uniqueIds(excludeChildrenIds),
    };
}

async function sendPublishRequest(): Promise<TaskId | undefined> {
    const {message, schedule} = $publishDialog.get();
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
    const itemsWithChildren = items.filter(item => item.hasChildren());
    if (itemsWithChildren.length === 0) {
        $hasUnpublishedChildrenIds.set(new Set());
        return;
    }

    const ids = itemsWithChildren.map(item => item.getContentId());
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
        .filter(item => {
            const publishStatus = calcTreePublishStatus(item);
            return calcSecondaryStatus(publishStatus, item) === 'modified';
        })
        .map(item => item.getId());

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
