import { showError, showSuccess, showWarning } from '@enonic/lib-admin-ui/notify/MessageBus';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { i18n } from '@enonic/lib-admin-ui/util/Messages';
import { computed, map } from 'nanostores';
import { ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { PublishRequest } from '../../../../app/issue/PublishRequest';
import { CreateIssueRequest } from '../../../../app/issue/resource/CreateIssueRequest';
import { fetchContentSummaries } from '../../../entities/content';
import { resolvePublishDependencies } from '../../../entities/content/api/publish.api';
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
import { findContentIdsWithCreatedDescendants } from '../../../shared/lib/cms/content/paths';
import {
    createContentIdSet,
    patchTrackedContentItems,
    refreshTrackedMainContentItems,
    removeTrackedContentItems,
} from '../../../shared/lib/cms/content/trackedItems';
import { createGuardedSocketHandler } from '../../../shared/lib/store/createGuardedSocketHandler';
import { createDebounce } from '../../../shared/lib/timing/createDebounce';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentPublished,
    $contentRenamed,
    $contentUpdated,
} from '../../../shared/socket/socket.store';
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
    loading: false,
    failed: false,
    submitting: false,
};

export const $newIssueDialog = map<NewIssueDialogStore>(structuredClone(initialState));

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

const reloadDependenciesDebounced = createDebounce(() => {
    void reloadNewIssueDependencies();
}, DEPENDENCY_RELOAD_DELAY_MS);

const resetDependenciesState = (state: NewIssueDialogStore): NewIssueDialogStore => {
    return {
        ...state,
        dependants: [],
        dependantIds: [],
        dependantWindow: 0,
        excludedDependantIds: [],
        requiredDependantIds: [],
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
            }),
        );
        return;
    }

    $newIssueDialog.set({
        ...$newIssueDialog.get(),
        items: nextItems,
        excludeChildrenIds: getItemIds(nextItems),
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
    const nextItems = dedupeItems([...state.items, ...newItems]);
    const nextExcludeChildrenIds = uniqueIds([
        ...state.excludeChildrenIds,
        ...newItems.map((item) => item.getContentId()),
    ]);

    $newIssueDialog.set({
        ...state,
        items: nextItems,
        excludeChildrenIds: nextExcludeChildrenIds,
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
    const nextExcludeChildrenIds = state.excludeChildrenIds.filter((id) => !idsToRemove.has(id.toString()));

    if (nextItems.length === 0) {
        $newIssueDialog.set(
            resetDependenciesState({
                ...state,
                items: [],
                excludeChildrenIds: [],
            }),
        );
        return;
    }

    $newIssueDialog.set({
        ...state,
        items: nextItems,
        excludeChildrenIds: nextExcludeChildrenIds,
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
        reloadDependenciesDebounced();
        return;
    }

    if (!includeChildren && !alreadyExcluded) {
        $newIssueDialog.setKey('excludeChildrenIds', [...state.excludeChildrenIds, id]);
        reloadDependenciesDebounced();
    }
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

    if (!title || state.submitting) {
        return;
    }

    $newIssueDialog.setKey('submitting', true);

    const approvers = state.assigneeIds.map((id) => PrincipalKey.fromString(id));
    const publishRequest = PublishRequest.create()
        .addExcludeIds(state.excludedDependantIds)
        .addPublishRequestItems(buildItems(state.items, state.excludeChildrenIds))
        .build();

    try {
        const issue = await new CreateIssueRequest()
            .setApprovers(approvers)
            .setPublishRequest(publishRequest)
            .setDescription(state.description.trim())
            .setTitle(title)
            .sendAndParse();

        showSuccess(i18n('notify.issue.created'));
        if (approvers.length > issue.getApprovers().length) {
            showWarning(i18n('notify.issue.assignees.norights'));
        }

        resetNewIssueDialogContext();
        openIssueDialogDetails(issue.getId());
    } catch (error) {
        console.error(error);
        const message = error?.message ?? String(error);
        showError(message);
    } finally {
        $newIssueDialog.setKey('submitting', false);
    }
};

//
// * Socket Event Handlers
//

const isNewIssueDialogActive = (): boolean => {
    const { open, items } = $newIssueDialog.get();
    return open && items.length > 0;
};

const onNewIssueSocketEvent = createGuardedSocketHandler(isNewIssueDialogActive);

const patchTrackedNewIssueItems = (updates: ContentSummary[]): { updatedMain: boolean; updatedDependants: boolean } => {
    const change = patchTrackedContentItems($newIssueDialog.get(), updates);

    if (change.changed) {
        $newIssueDialog.set(change.state);
    }

    return {
        updatedMain: change.changedMain,
        updatedDependants: change.changedDependants,
    };
};

const removeTrackedNewIssueItems = (idsToRemove: Set<string>): { removedMain: boolean; removedDependants: boolean } => {
    const change = removeTrackedContentItems($newIssueDialog.get(), idsToRemove);
    const pruned = pruneDependantWindow(change.changed ? change.state : $newIssueDialog.get(), idsToRemove);

    if (change.changed || pruned.changed) {
        $newIssueDialog.set(pruned.state);
    }

    return {
        removedMain: change.changedMain,
        // An id-only prune (dependant beyond the loaded window) must also count:
        // callers rely on this flag to reschedule the dependency reload.
        removedDependants: change.changedDependants || pruned.changed,
    };
};

const handleRemovedNewIssueItems = (idsToRemove: Set<string>): void => {
    const { removedMain, removedDependants } = removeTrackedNewIssueItems(idsToRemove);

    if ($newIssueDialog.get().items.length === 0) {
        $newIssueDialog.set(
            resetDependenciesState({
                ...$newIssueDialog.get(),
                items: [],
                excludeChildrenIds: [],
            }),
        );
        return;
    }

    if (removedMain || removedDependants) {
        reloadDependenciesDebounced();
    }
};

const refreshNewIssueMainItems = async (ids: ContentId[]): Promise<void> => {
    try {
        const change = await refreshTrackedMainContentItems($newIssueDialog.get(), ids, fetchContentSummaries);

        if (change.changed && isNewIssueDialogActive()) {
            $newIssueDialog.set(change.state);
        }
    } catch (error) {
        console.error(error);
    }
};

$contentCreated.subscribe(
    onNewIssueSocketEvent((event) => {
        const matched = findContentIdsWithCreatedDescendants($newIssueDialog.get().items, event.data);
        if (matched.length === 0) {
            return;
        }

        void refreshNewIssueMainItems(matched).finally(() => {
            reloadDependenciesDebounced();
        });
    }),
);

$contentUpdated.subscribe(
    onNewIssueSocketEvent((event) => {
        const { updatedMain, updatedDependants } = patchTrackedNewIssueItems(event.data);
        if (updatedMain || updatedDependants) {
            reloadDependenciesDebounced();
        }
    }),
);

$contentRenamed.subscribe(
    onNewIssueSocketEvent((event) => {
        patchTrackedNewIssueItems(event.data.items);
    }),
);

$contentDeleted.subscribe(
    onNewIssueSocketEvent((event) => {
        handleRemovedNewIssueItems(createContentIdSet(event.data));
    }),
);

$contentArchived.subscribe(
    onNewIssueSocketEvent((event) => {
        handleRemovedNewIssueItems(createContentIdSet(event.data));
    }),
);

$contentPublished.subscribe(
    onNewIssueSocketEvent((event) => {
        const { updatedMain, updatedDependants } = patchTrackedNewIssueItems(event.data);
        if (updatedMain || updatedDependants) {
            reloadDependenciesDebounced();
        }
    }),
);

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
        const result = await resolvePublishDependencies({
            ids: itemIds,
            excludeChildrenIds: state.excludeChildrenIds,
        });

        if (currentInstance !== instanceId) {
            return;
        }

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
        const nextExcludedDependantIds = latestState.excludedDependantIds
            .filter((id) => hasContentIdInIds(id, allDependantIds))
            .filter((id) => !hasContentIdInIds(id, requiredDependantIds));

        $newIssueDialog.set({
            ...latestState,
            dependants,
            dependantIds: allDependantIds,
            dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, allDependantIds.length),
            requiredDependantIds,
            excludedDependantIds: nextExcludedDependantIds,
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
