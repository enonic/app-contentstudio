import type { TaskId } from '@enonic/lib-admin-ui/task/TaskId';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { atom, computed, map } from 'nanostores';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { CompareResult } from '../../../entities/content';
import { calcDependantsSelection, type DependantsSelection } from '../../../shared/lib/cms/content/dependantsSelection';
import { hasContentIdInIds, isIdsEqual, uniqueIds } from '../../../shared/lib/cms/content/ids';
import { $config } from '../../../shared/config/config.store';

//
// * Publish Dialog Store
//
// State, computed projections, and the pure helpers they rely on.
// Mutations go through publishDialog.commands; subscription wiring lives in
// publishDialog.service.
//

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
};

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

export type PublishDialogStore = {
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
    schedulable: boolean;
};

type PublishCheckError = {
    count: number;
    disabled: boolean;
};

type PublishCheckErrorsStore = {
    invalid: PublishCheckError;
    inProgress: PublishCheckError;
    noPermissions: PublishCheckError;
};

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

export const initialPublishDialogState: PublishDialogStore = {
    open: false,
    failed: false,
    items: [],
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
};

export const initialSelectionState: PublishDialogSelectionStore = {
    excludedItemsIds: [],
    excludedItemsWithChildrenIds: [],
    excludedDependantItemsIds: [],
};

export const initialChecksState: PublishChecksStore = {
    loading: false,
    requiredIds: [],
    invalidIds: [],
    invalidExcludable: false,
    inProgressIds: [],
    inProgressExcludable: false,
    notPublishableIds: [],
    notPublishableExcludable: false,
    schedulable: false,
};

export const initialPendingState: PublishDialogPendingStore = {
    submitting: false,
    pendingIds: [],
    pendingTotal: 0,
    pendingPrimaryName: undefined,
    taskId: undefined,
};

export const $publishDialog = map<PublishDialogStore>(structuredClone(initialPublishDialogState));

export const $draftPublishDialogSelection = map<PublishDialogSelectionStore>(structuredClone(initialSelectionState));

export const $publishChecks = map<PublishChecksStore>(structuredClone(initialChecksState));

export const DEPENDANT_LOAD_SIZE = 36;

// Full ordered dependant id list; summaries load lazily, a window at a time.
export const $dependantIds = atom<ContentId[]>([]);

export const $publishDialogDependants = atom<ContentSummary[]>([]);

// Dependant ids visible in the dialog (legacy `calcVisibleIds`): min dependants, direct excluded deps, included children
export const $visibleDependantIds = atom<ContentId[]>([]);

// Whether auto-excluded dependants are shown in the list (legacy "Hide/Show excluded" toggle).
export const $showExcludedDependants = atom<boolean>(true);

export const $dependantWindow = atom<number>(0);

// Publishable ids (status != EQUAL) resolved by the server, across the full set
export const $publishableContentIds = atom<ContentId[]>([]);

export const $publishDialogPending = map<PublishDialogPendingStore>(initialPendingState);

// Store for IDs of items that have unpublished children
export const $hasUnpublishedChildrenIds = atom<Set<string>>(new Set());

// Store for verified compare statuses of online+modified items
export const $compareStatuses = atom<Map<string, CompareResult>>(new Map());
export const $compareStatusesLoading = atom<boolean>(false);

// Store for schedule field errors
export const $publishScheduleErrors = map<PublishScheduleErrors>({});

//
// * Derived State
//

export const $publishDialogItemsWithChildren = computed($publishDialog, (state) => {
    return filterItemsWithChildren(state.items);
});

// Computed store: Set of main item IDs that have at least one unpublished child
const $itemsWithUnpublishedChildren = computed(
    [$publishDialog, $hasUnpublishedChildrenIds],
    ({ items }, hasUnpublishedIds): Set<string> => {
        const result = new Set<string>();
        for (const item of items) {
            if (item.hasChildren() && hasUnpublishedIds.has(item.getId())) {
                result.add(item.getId());
            }
        }
        return result;
    },
);

export const $isPublishSelectionSynced = computed(
    [$draftPublishDialogSelection, $publishDialog],
    (draft, current): boolean => {
        const { excludedItemsIds, excludedItemsWithChildrenIds, excludedDependantItemsIds } = current;
        return (
            isIdsEqual(excludedItemsIds, draft.excludedItemsIds) &&
            isIdsEqual(excludedItemsWithChildrenIds, draft.excludedItemsWithChildrenIds) &&
            isIdsEqual(excludedDependantItemsIds, draft.excludedDependantItemsIds)
        );
    },
);

export const $mainPublishItems = computed(
    [$publishDialog, $draftPublishDialogSelection, $publishChecks, $itemsWithUnpublishedChildren],
    (
        { items },
        { excludedItemsIds, excludedItemsWithChildrenIds },
        { requiredIds },
        itemsWithUnpublished,
    ): MainItem[] => {
        return items.map((item) => ({
            id: item.getId(),
            content: item,
            included: !hasContentIdInIds(item.getContentId(), excludedItemsIds),
            childrenIncluded: !hasContentIdInIds(item.getContentId(), excludedItemsWithChildrenIds),
            required: hasContentIdInIds(item.getContentId(), requiredIds),
            hasUnpublishedChildren: itemsWithUnpublished.has(item.getId()),
        }));
    },
);

export const $dependantPublishItems = computed(
    [$publishDialogDependants, $publishDialog, $draftPublishDialogSelection, $publishChecks, $visibleDependantIds],
    (
        dependantItems,
        { excludedDependantItemsIds },
        { excludedDependantItemsIds: draftExcludedIds },
        { requiredIds },
        visibleIds,
    ): DependantItem[] => {
        return dependantItems.map((item) => ({
            id: item.getId(),
            content: item,
            included: !hasContentIdInIds(item.getContentId(), draftExcludedIds),
            required: hasContentIdInIds(item.getContentId(), requiredIds),
            excludedByDefault: hasContentIdInIds(item.getContentId(), excludedDependantItemsIds),
            hidden: !hasContentIdInIds(item.getContentId(), visibleIds),
        }));
    },
);

// Excluded dependants that can be toggled via "Show/Hide excluded" (legacy `hasExcluded`)
export const $hasExcludedDependantItems = computed($dependantPublishItems, (items): boolean => {
    return items.some((item) => item.excludedByDefault && !item.hidden && !item.required);
});

export const $showPublishDependantsExcluded = computed($showExcludedDependants, (show): boolean => show);

export const $publishDependantsSelection = computed(
    [
        $dependantIds,
        $visibleDependantIds,
        $publishChecks,
        $publishDialog,
        $draftPublishDialogSelection,
        $showExcludedDependants,
    ],
    (
        allIds,
        visibleIds,
        { requiredIds },
        { excludedDependantItemsIds },
        { excludedDependantItemsIds: draftExcludedIds },
        showExcluded,
    ): DependantsSelection => {
        // From the full id set, not the loaded window, so the count is right before summaries
        // lazy-load; respects the "show excluded" toggle to match the visible rows.
        const shownIds = allIds.filter(
            (id) =>
                hasContentIdInIds(id, visibleIds) &&
                (showExcluded || !hasContentIdInIds(id, excludedDependantItemsIds)),
        );

        return calcDependantsSelection(shownIds, requiredIds, draftExcludedIds);
    },
);

// Filter the server's publishable set by the draft selection so the count stays live
// while the user toggles checkboxes, without re-resolving or loading summaries.
export const $publishableIds = computed(
    [$publishableContentIds, $draftPublishDialogSelection],
    (publishableIds, { excludedItemsIds, excludedDependantItemsIds }): ContentId[] => {
        const excludedIds = uniqueIds([...excludedItemsIds, ...excludedDependantItemsIds]);
        return publishableIds.filter((id) => !hasContentIdInIds(id, excludedIds));
    },
);

export const $totalPublishableItems = computed($publishableIds, (publishableIds): number => {
    return publishableIds.length;
});

export const $hasMoreDependants = computed([$dependantIds, $dependantWindow], (ids, loaded): boolean => {
    return loaded < ids.length;
});

// Scheduling makes sense only when something is offline or expired (resolved server-side).
export const $hasSchedulableItems = computed($publishChecks, ({ schedulable }): boolean => schedulable);

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

export const $isPublishChecking = computed([$publishChecks], ({ loading }): boolean => {
    return loading;
});

export const $publishCompareStatuses = computed($compareStatuses, (map) => map);

export const $isCompareStatusesLoading = computed($compareStatusesLoading, (loading) => loading);

export const $isScheduleValid = computed([$publishDialog, $publishScheduleErrors], ({ schedule }, errors): boolean => {
    if (errors.from || errors.to || errors.range) {
        return false;
    }
    return validateSchedule(schedule).valid;
});

export const $scheduleFromError = computed(
    [$publishDialog, $publishScheduleErrors],
    ({ schedule }, { from, range }): string | undefined => {
        return from ?? validateSchedule(schedule).fromError ?? range;
    },
);

export const $scheduleToError = computed($publishScheduleErrors, ({ to }): string | undefined => {
    return to;
});

export const $isPublishReady = computed(
    [$publishChecks, $isPublishSelectionSynced, $totalPublishableItems, $isScheduleValid],
    (
        { loading, invalidIds, inProgressIds, notPublishableIds },
        synced,
        totalPublishableItems,
        scheduleValid,
    ): boolean => {
        return (
            synced &&
            !loading &&
            invalidIds.length === 0 &&
            inProgressIds.length === 0 &&
            notPublishableIds.length === 0 &&
            totalPublishableItems > 0 &&
            scheduleValid
        );
    },
);

export const $publishTaskId = computed($publishDialogPending, ({ taskId }) => taskId);

//
// * Utilities
//

export const filterItemsWithChildren = (items: ContentSummary[]): ContentSummary[] => {
    return items.filter((item) => item.hasChildren());
};

export const validateSchedule = (schedule: PublishSchedule | undefined): ScheduleValidationResult => {
    if (!schedule) {
        return { valid: true };
    }
    // The `publishingWizard.requiredPublishFrom` config makes "Online from" mandatory
    // whenever scheduling is active.
    if ($config.get().requiredPublishFrom && !schedule.from) {
        return { valid: false, fromError: i18n('field.value.required') };
    }
    if (!schedule.from && !schedule.to) {
        return { valid: true };
    }
    if (!schedule.to) {
        return { valid: true };
    }
    const now = new Date();
    if (schedule.to <= now) {
        return { valid: false, toError: i18n('field.schedule.invalid.past') };
    }
    const fromDate = schedule.from ?? now;
    if (schedule.to <= fromDate) {
        return { valid: false, rangeError: i18n('field.schedule.invalid') };
    }
    return { valid: true };
};
