import { showError, showSuccess, showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { PublishRequest } from '../../../../app/issue/PublishRequest';
import { fetchContentSummaries } from '../../../entities/content';
import { resolvePublishDependencies } from '../../../entities/content/api/publish.api';
import { buildItems, dedupeItems, getItemIds } from '../../../shared/lib/cms/content/buildItems';
import {
    DEPENDANT_LOAD_SIZE,
    createDependantWindowLoader,
    fetchDependantWindowSlice,
    orderSummariesByIds,
} from '../../../entities/content/lib/dependantWindow';
import { calcDependantsSelection, nextDependantExclusions } from '../../../shared/lib/cms/content/dependantsSelection';
import { hasContentIdInIds, isIdsEqual, uniqueIds } from '../../../shared/lib/cms/content/ids';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import { createIssue } from '../../../entities/issue/api/issues.api';
import { closeIssueDialog, openIssueDialogDetails } from './issueDialog.store';

const DEPENDENCY_RELOAD_DELAY_MS = 150;

type NewIssueDialogStore = {
    open: boolean;
    title: string;
    description: string;
    assigneeIds: string[];
    items: ContentSummary[];
    excludeChildrenIds: ContentId[];
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;
    excludedDependantIds: ContentId[];
    requiredDependantIds: ContentId[];
    appliedExcludeChildrenIds: ContentId[];
    appliedExcludedDependantIds: ContentId[];
    loading: boolean;
    failed: boolean;
    submitting: boolean;
};

const initialState: NewIssueDialogStore = {
    open: false,
    title: '',
    description: '',
    assigneeIds: [],
    items: [],
    excludeChildrenIds: [],
    dependants: [],
    dependantIds: [],
    dependantWindow: 0,
    excludedDependantIds: [],
    requiredDependantIds: [],
    appliedExcludeChildrenIds: [],
    appliedExcludedDependantIds: [],
    loading: false,
    failed: false,
    submitting: false,
};

export const $newIssueDialog = map<NewIssueDialogStore>(structuredClone(initialState));

export const $isNewIssueSelectionSynced = computed(
    $newIssueDialog,
    ({ excludeChildrenIds, excludedDependantIds, appliedExcludeChildrenIds, appliedExcludedDependantIds }) =>
        isIdsEqual(excludeChildrenIds, appliedExcludeChildrenIds) &&
        isIdsEqual(excludedDependantIds, appliedExcludedDependantIds),
);

export const $newIssueDialogCreateCount = computed($newIssueDialog, ({ items, dependantIds, excludedDependantIds }) => {
    const includedDependants = dependantIds.filter((id) => !hasContentIdInIds(id, excludedDependantIds));
    return items.length + includedDependants.length;
});

export const $newIssueDialogHasMoreDependants = computed(
    $newIssueDialog,
    ({ dependantIds, dependantWindow }) => dependantWindow < dependantIds.length,
);

export const $newIssueDependantsSelection = computed(
    $newIssueDialog,
    ({ dependantIds, requiredDependantIds, excludedDependantIds }) =>
        calcDependantsSelection(dependantIds, requiredDependantIds, excludedDependantIds),
);

let instanceId = 0;

// Shared with the service wiring, which also schedules reloads on socket events.
export const reloadDependenciesDebounced = createDebounce(() => {
    void reloadNewIssueDependencies();
}, DEPENDENCY_RELOAD_DELAY_MS);

// Shared with the service wiring, which clears dependencies when items empty out.
export const resetDependenciesState = (state: NewIssueDialogStore): NewIssueDialogStore => {
    return {
        ...state,
        dependants: [],
        dependantIds: [],
        dependantWindow: 0,
        excludedDependantIds: [],
        requiredDependantIds: [],
        appliedExcludedDependantIds: [],
        loading: false,
        failed: false,
    };
};

export const resetNewIssueDialogContext = (): void => {
    instanceId += 1;
    reloadDependenciesDebounced.cancel();
    $newIssueDialog.set(structuredClone(initialState));
};

export const openNewIssueDialog = (items?: ContentSummary[]): void => {
    resetNewIssueDialogContext();
    if (items && items.length > 0) {
        setNewIssueItems(items);
    }
    closeIssueDialog();
    $newIssueDialog.setKey('open', true);
};

export const closeNewIssueDialog = (): void => {
    resetNewIssueDialogContext();
};

export const setNewIssueTitle = (title: string): void => {
    $newIssueDialog.setKey('title', title);
};

export const setNewIssueDescription = (description: string): void => {
    $newIssueDialog.setKey('description', description);
};

export const setNewIssueAssignees = (assigneeIds: string[]): void => {
    $newIssueDialog.setKey('assigneeIds', [...assigneeIds]);
};

export const setNewIssueItems = (items: ContentSummary[]): void => {
    const nextItems = dedupeItems(items);

    if (nextItems.length === 0) {
        $newIssueDialog.set(
            resetDependenciesState({
                ...$newIssueDialog.get(),
                items: [],
                excludeChildrenIds: [],
                appliedExcludeChildrenIds: [],
            }),
        );
        return;
    }

    const excludeChildrenIds = getItemIds(nextItems);

    $newIssueDialog.set({
        ...$newIssueDialog.get(),
        items: nextItems,
        excludeChildrenIds,
        appliedExcludeChildrenIds: excludeChildrenIds,
    });

    reloadDependenciesDebounced();
};

export const addNewIssueItems = (items: ContentSummary[]): void => {
    if (items.length === 0) {
        return;
    }

    const state = $newIssueDialog.get();
    const existingIds = new Set(state.items.map((item) => item.getContentId().toString()));
    const newItems = items.filter((item) => !existingIds.has(item.getContentId().toString()));
    const nextItems = dedupeItems([...newItems, ...state.items]);
    const newItemIds = newItems.map((item) => item.getContentId());

    // Extend the draft and the applied selection independently, so staged edits
    // on existing items stay staged.
    $newIssueDialog.set({
        ...state,
        items: nextItems,
        excludeChildrenIds: uniqueIds([...state.excludeChildrenIds, ...newItemIds]),
        appliedExcludeChildrenIds: uniqueIds([...state.appliedExcludeChildrenIds, ...newItemIds]),
    });

    reloadDependenciesDebounced();
};

export const addNewIssueItemsByIds = async (ids: string[]): Promise<void> => {
    if (ids.length === 0) {
        return;
    }

    const state = $newIssueDialog.get();
    const existingIds = new Set(state.items.map((item) => item.getContentId().toString()));
    const newIds = ids.filter((id) => !existingIds.has(id)).map((id) => new ContentId(id));

    if (newIds.length === 0) {
        return;
    }

    const items = await fetchContentSummaries(newIds);
    addNewIssueItems(items);
};

export const removeNewIssueItemsByIds = (ids: ContentId[]): void => {
    if (ids.length === 0) {
        return;
    }

    const idsToRemove = new Set(ids.map((id) => id.toString()));
    const state = $newIssueDialog.get();
    const nextItems = state.items.filter((item) => !idsToRemove.has(item.getContentId().toString()));

    if (nextItems.length === 0) {
        $newIssueDialog.set(
            resetDependenciesState({
                ...state,
                items: [],
                excludeChildrenIds: [],
                appliedExcludeChildrenIds: [],
            }),
        );
        return;
    }

    // Drop the removed ids from the draft and the applied selection independently,
    // so staged edits on the remaining items stay staged.
    $newIssueDialog.set({
        ...state,
        items: nextItems,
        excludeChildrenIds: state.excludeChildrenIds.filter((id) => !idsToRemove.has(id.toString())),
        appliedExcludeChildrenIds: state.appliedExcludeChildrenIds.filter((id) => !idsToRemove.has(id.toString())),
    });

    reloadDependenciesDebounced();
};

export const setNewIssueItemIncludeChildren = (id: ContentId, includeChildren: boolean): void => {
    const state = $newIssueDialog.get();
    const alreadyExcluded = hasContentIdInIds(id, state.excludeChildrenIds);

    if (includeChildren && alreadyExcluded) {
        $newIssueDialog.setKey(
            'excludeChildrenIds',
            state.excludeChildrenIds.filter((item) => !item.equals(id)),
        );
        return;
    }

    if (!includeChildren && !alreadyExcluded) {
        $newIssueDialog.setKey('excludeChildrenIds', [...state.excludeChildrenIds, id]);
    }
};

export const applyDraftNewIssueDialogSelection = (): void => {
    if ($isNewIssueSelectionSynced.get()) {
        return;
    }

    const state = $newIssueDialog.get();
    const childrenChanged = !isIdsEqual(state.excludeChildrenIds, state.appliedExcludeChildrenIds);

    $newIssueDialog.set({
        ...state,
        appliedExcludeChildrenIds: state.excludeChildrenIds,
        appliedExcludedDependantIds: state.excludedDependantIds,
    });

    if (childrenChanged) {
        reloadDependenciesDebounced();
    }
};

export const cancelDraftNewIssueDialogSelection = (): void => {
    if ($isNewIssueSelectionSynced.get()) {
        return;
    }

    const state = $newIssueDialog.get();
    $newIssueDialog.set({
        ...state,
        excludeChildrenIds: state.appliedExcludeChildrenIds,
        excludedDependantIds: state.appliedExcludedDependantIds,
    });
};

export const setNewIssueDependantIncluded = (id: ContentId, included: boolean): void => {
    const state = $newIssueDialog.get();
    if (hasContentIdInIds(id, state.requiredDependantIds)) {
        return;
    }

    const isExcluded = hasContentIdInIds(id, state.excludedDependantIds);
    if (included && isExcluded) {
        $newIssueDialog.setKey(
            'excludedDependantIds',
            state.excludedDependantIds.filter((item) => !item.equals(id)),
        );
        return;
    }

    if (!included && !isExcluded) {
        $newIssueDialog.setKey('excludedDependantIds', [...state.excludedDependantIds, id]);
    }
};

export const toggleNewIssueDependantsSelection = (): void => {
    const { dependantIds, requiredDependantIds, excludedDependantIds } = $newIssueDialog.get();
    const selection = calcDependantsSelection(dependantIds, requiredDependantIds, excludedDependantIds);
    if (selection.selectableIds.length === 0) {
        return;
    }

    $newIssueDialog.setKey('excludedDependantIds', nextDependantExclusions(selection, excludedDependantIds));
};

export const submitNewIssueDialog = async (): Promise<void> => {
    const state = $newIssueDialog.get();
    const title = state.title.trim();

    if (!title || state.submitting || !$isNewIssueSelectionSynced.get()) {
        return;
    }

    $newIssueDialog.setKey('submitting', true);

    const approvers = state.assigneeIds.map((id) => PrincipalKey.fromString(id));
    const publishRequest = PublishRequest.create()
        .addExcludeIds(state.excludedDependantIds)
        .addPublishRequestItems(buildItems(state.items, state.excludeChildrenIds))
        .build();

    const result = await createIssue({
        title,
        description: state.description.trim(),
        approvers,
        publishRequest,
    });

    if (result.isErr()) {
        console.error(result.error);
        showError(result.error.message);
        $newIssueDialog.setKey('submitting', false);
        return;
    }

    const issue = result.value;

    showSuccess(i18n('notify.issue.created'));
    if (approvers.length > issue.getApprovers().length) {
        showWarning(i18n('notify.issue.assignees.norights'));
    }

    resetNewIssueDialogContext();
    openIssueDialogDetails(issue.getId());
    $newIssueDialog.setKey('submitting', false);
};

export const loadMoreNewIssueDependants = createDependantWindowLoader($newIssueDialog, () => instanceId);

const reloadNewIssueDependencies = async (): Promise<void> => {
    const currentInstance = ++instanceId;
    const state = $newIssueDialog.get();
    const itemIds = getItemIds(state.items);

    if (itemIds.length === 0) {
        $newIssueDialog.set(resetDependenciesState(state));
        return;
    }

    $newIssueDialog.set({
        ...state,
        loading: true,
        failed: false,
    });

    try {
        // Resolve the applied selection: reloads can fire while an edit is staged
        // (socket events), and must neither consume nor commit the draft.
        const dependenciesResult = await resolvePublishDependencies({
            ids: itemIds,
            excludeChildrenIds: state.appliedExcludeChildrenIds,
        });

        if (currentInstance !== instanceId) {
            return;
        }

        if (dependenciesResult.isErr()) {
            console.error(dependenciesResult.error);
            $newIssueDialog.set({
                ...$newIssueDialog.get(),
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
            $newIssueDialog.set({
                ...$newIssueDialog.get(),
                loading: false,
                failed: true,
            });
            return;
        }

        const dependants = orderSummariesByIds(firstWindow.summaries, allDependantIds);

        const latestState = $newIssueDialog.get();
        const requiredDependantIds = result.getRequired().filter((id) => hasContentIdInIds(id, allDependantIds));
        const pruneExcludedIds = (ids: ContentId[]): ContentId[] =>
            ids
                .filter((id) => hasContentIdInIds(id, allDependantIds))
                .filter((id) => !hasContentIdInIds(id, requiredDependantIds));

        $newIssueDialog.set({
            ...latestState,
            dependants,
            dependantIds: allDependantIds,
            dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, allDependantIds.length),
            requiredDependantIds,
            excludedDependantIds: pruneExcludedIds(latestState.excludedDependantIds),
            appliedExcludedDependantIds: pruneExcludedIds(latestState.appliedExcludedDependantIds),
            loading: false,
            failed: false,
        });
    } catch (error) {
        if (currentInstance !== instanceId) {
            return;
        }
        console.error(error);
        $newIssueDialog.set({
            ...$newIssueDialog.get(),
            loading: false,
            failed: true,
        });
        showError(error?.message ?? String(error));
    }
};
