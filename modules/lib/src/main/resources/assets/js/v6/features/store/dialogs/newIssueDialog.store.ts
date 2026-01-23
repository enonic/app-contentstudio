import {showError, showSuccess, showWarning} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {computed, map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {PublishRequest} from '../../../../app/issue/PublishRequest';
import {PublishRequestItem} from '../../../../app/issue/PublishRequestItem';
import {CreateIssueRequest} from '../../../../app/issue/resource/CreateIssueRequest';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {resolvePublishDependencies} from '../../api/publish';
import {hasContentIdInIds, uniqueIds} from '../../utils/cms/content/ids';
import {createDebounce} from '../../utils/timing/createDebounce';
import {openIssueDialog, openIssueDialogDetails, setIssueDialogView, $issueDialog} from './issueDialog.store';

const DEPENDENCY_RELOAD_DELAY_MS = 150;

type NewIssueDialogStore = {
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

const initialState: NewIssueDialogStore = {
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

export const $newIssueDialog = map<NewIssueDialogStore>(structuredClone(initialState));

export const $newIssueDialogCreateCount = computed(
    $newIssueDialog,
    ({items, dependants, excludedDependantIds}) => {
        const includedDependants = dependants.filter(item =>
            !hasContentIdInIds(item.getContentId(), excludedDependantIds));
        return items.length + includedDependants.length;
    },
);

let instanceId = 0;

const reloadDependenciesDebounced = createDebounce(() => {
    void reloadNewIssueDependencies();
}, DEPENDENCY_RELOAD_DELAY_MS);

const getItemIds = (items: ContentSummaryAndCompareStatus[]): ContentId[] => {
    return items.map(item => item.getContentId());
};

const dedupeItems = (items: ContentSummaryAndCompareStatus[]): ContentSummaryAndCompareStatus[] => {
    const deduped = new Map<string, ContentSummaryAndCompareStatus>();
    items.forEach(item => deduped.set(item.getContentId().toString(), item));
    return Array.from(deduped.values());
};

const buildPublishRequestItems = (
    items: ContentSummaryAndCompareStatus[],
    excludedChildrenIds: ContentId[],
): PublishRequestItem[] => {
    return items.map(item =>
        PublishRequestItem
            .create()
            .setId(item.getContentId())
            .setIncludeChildren(!hasContentIdInIds(item.getContentId(), excludedChildrenIds))
            .build()
    );
};

const resetDependenciesState = (state: NewIssueDialogStore): NewIssueDialogStore => {
    return {
        ...state,
        dependants: [],
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

export const openNewIssueDialog = (items?: ContentSummaryAndCompareStatus[]): void => {
    resetNewIssueDialogContext();
    if (items && items.length > 0) {
        setNewIssueItems(items);
    }

    const dialogState = $issueDialog.get();
    if (!dialogState.open) {
        openIssueDialog();
    }
    setIssueDialogView('new-issue');
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

export const setNewIssueItems = (items: ContentSummaryAndCompareStatus[]): void => {
    const nextItems = dedupeItems(items);

    if (nextItems.length === 0) {
        $newIssueDialog.set(resetDependenciesState({
            ...$newIssueDialog.get(),
            items: [],
            excludedChildrenIds: [],
        }));
        return;
    }

    $newIssueDialog.set({
        ...$newIssueDialog.get(),
        items: nextItems,
        excludedChildrenIds: getItemIds(nextItems),
    });

    reloadDependenciesDebounced();
};

export const addNewIssueItems = (items: ContentSummaryAndCompareStatus[]): void => {
    if (items.length === 0) {
        return;
    }

    const state = $newIssueDialog.get();
    const existingIds = new Set(state.items.map(item => item.getContentId().toString()));
    const newItems = items.filter(item => !existingIds.has(item.getContentId().toString()));
    const nextItems = dedupeItems([...state.items, ...newItems]);
    const nextExcludedChildrenIds = uniqueIds([
        ...state.excludedChildrenIds,
        ...newItems.map(item => item.getContentId()),
    ]);

    $newIssueDialog.set({
        ...state,
        items: nextItems,
        excludedChildrenIds: nextExcludedChildrenIds,
    });

    reloadDependenciesDebounced();
};

export const removeNewIssueItemsByIds = (ids: ContentId[]): void => {
    if (ids.length === 0) {
        return;
    }

    const idsToRemove = new Set(ids.map(id => id.toString()));
    const state = $newIssueDialog.get();
    const nextItems = state.items.filter(item => !idsToRemove.has(item.getContentId().toString()));
    const nextExcludedChildrenIds = state.excludedChildrenIds
        .filter(id => !idsToRemove.has(id.toString()));

    if (nextItems.length === 0) {
        $newIssueDialog.set(resetDependenciesState({
            ...state,
            items: [],
            excludedChildrenIds: [],
        }));
        return;
    }

    $newIssueDialog.set({
        ...state,
        items: nextItems,
        excludedChildrenIds: nextExcludedChildrenIds,
    });

    reloadDependenciesDebounced();
};

export const setNewIssueItemIncludeChildren = (id: ContentId, includeChildren: boolean): void => {
    const state = $newIssueDialog.get();
    const alreadyExcluded = hasContentIdInIds(id, state.excludedChildrenIds);

    if (includeChildren && alreadyExcluded) {
        $newIssueDialog.setKey(
            'excludedChildrenIds',
            state.excludedChildrenIds.filter(item => !item.equals(id)),
        );
        reloadDependenciesDebounced();
        return;
    }

    if (!includeChildren && !alreadyExcluded) {
        $newIssueDialog.setKey('excludedChildrenIds', [...state.excludedChildrenIds, id]);
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
            state.excludedDependantIds.filter(item => !item.equals(id)),
        );
        return;
    }

    if (!included && !isExcluded) {
        $newIssueDialog.setKey('excludedDependantIds', [...state.excludedDependantIds, id]);
    }
};

export const submitNewIssueDialog = async (): Promise<void> => {
    const state = $newIssueDialog.get();
    const title = state.title.trim();

    if (!title || state.submitting) {
        return;
    }

    $newIssueDialog.setKey('submitting', true);

    const approvers = state.assigneeIds.map(id => PrincipalKey.fromString(id));
    const publishRequest = PublishRequest
        .create()
        .addExcludeIds(state.excludedDependantIds)
        .addPublishRequestItems(buildPublishRequestItems(state.items, state.excludedChildrenIds))
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

        const latestState = $newIssueDialog.get();
        const requiredDependantIds = result.getRequired()
            .filter(id => hasContentIdInIds(id, dependantIds));
        const nextExcludedDependantIds = latestState.excludedDependantIds
            .filter(id => hasContentIdInIds(id, dependantIds))
            .filter(id => !hasContentIdInIds(id, requiredDependantIds));

        $newIssueDialog.set({
            ...latestState,
            dependants,
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
