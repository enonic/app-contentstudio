import { AuthContext } from '@enonic/lib-admin-ui/auth/AuthContext';
import { showError, showFeedback } from '@enonic/lib-admin-ui/notify/MessageBus';
import { PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { atom, computed, map } from 'nanostores';
import { i18n } from '../../../shared/i18n';
import { type ContentId } from '../../../../app/content/ContentId';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { IssueStatus } from '../../../../app/issue/IssueStatus';
import { IssueType } from '../../../../app/issue/IssueType';
import { PublishRequest } from '../../../../app/issue/PublishRequest';
import { PublishRequestItem } from '../../../../app/issue/PublishRequestItem';
import { fetchContentSummaries } from '../../../entities/content';
import { resolvePrincipalsByKeys } from '../../../entities/principal/api/principals.api';
import {
    createIssueComment,
    deleteIssueComment,
    fetchIssue,
    listIssueComments,
    updateIssue,
    updateIssueComment,
} from '../../../entities/issue/api/issues.api';
import {
    DEPENDANT_LOAD_SIZE,
    createDependantWindowLoader,
    fetchDependantWindowSlice,
    orderSummariesByIds,
} from '../../../entities/content/lib/dependantWindow';
import { resolveAppliedPublishDependencies } from '../../../entities/content/lib/publishDependencies';
import { buildItemsFromIds } from '../../../shared/lib/cms/content/buildItems';
import {
    calcDependantsSelection,
    filterShownDependantIds,
    hasHideableExcludedDependants,
    nextDependantExclusions,
    pruneExcludedDependantIds,
} from '../../../shared/lib/cms/content/dependantsSelection';
import {
    commitDraftSelection,
    isDraftSelectionSynced,
    revertDraftSelection,
    withIdExcluded,
} from '../../../shared/lib/cms/content/draftSelection';
import { hasContentIdInIds, isIdsEqual, uniqueIds } from '../../../shared/lib/cms/content/ids';
import { $issueDialog, loadIssueDialogList } from './issueDialog.store';

import type { Issue } from '../../../../app/issue/Issue';
import type { IssueComment } from '../../../../app/issue/IssueComment';
import { IssueWithAssignees } from '../../../../app/issue/IssueWithAssignees';
import type { IssueDialogDetailsTab } from '../ui/issue/issueDialog.types';

//
// * Store state
//

type IssueDialogDetailsStore = {
    issueId?: string;
    issue?: Issue;
    issueLoading: boolean;
    issueError: boolean;
    detailsTab: IssueDialogDetailsTab;
    commentsLoading: boolean;
    commentsError: boolean;
    commentsIssueId?: string;
    comments: IssueComment[];
    commentText: string;
    commentSubmitting: boolean;
    titleUpdating: boolean;
    statusUpdating: boolean;
    assigneesUpdating: boolean;
    scheduleUpdating: boolean;
    itemsUpdating: boolean;
    itemsLoading: boolean;
    itemsError: boolean;
    items: ContentSummary[];
    excludeChildrenIds: ContentId[];
    dependants: ContentSummary[];
    dependantIds: ContentId[];
    dependantWindow: number;
    excludedDependantIds: ContentId[];
    requiredDependantIds: ContentId[];
    // The last selection committed to the server; the baseline a reload compares against.
    appliedExcludeChildrenIds: ContentId[];
    appliedExcludedDependantIds: ContentId[];
    // Keep the full server selection separately: the visible applied exclusions are pruned to
    // the resolved tree, but hidden saved exclusions must survive a child toggle.
    serverExcludeChildrenIds: ContentId[];
    serverExcludedDependantIds: ContentId[];
};

type DeleteCommentConfirmation = {
    open: boolean;
    commentId: string | undefined;
};

type ContentIdProvider = {
    getContentId(): ContentId;
};

const initialState: IssueDialogDetailsStore = {
    issueId: undefined,
    issue: undefined,
    issueLoading: false,
    issueError: false,
    detailsTab: 'comments',
    commentsLoading: false,
    commentsError: false,
    commentsIssueId: undefined,
    comments: [],
    commentText: '',
    commentSubmitting: false,
    titleUpdating: false,
    statusUpdating: false,
    assigneesUpdating: false,
    scheduleUpdating: false,
    itemsUpdating: false,
    itemsLoading: false,
    itemsError: false,
    items: [],
    excludeChildrenIds: [],
    dependants: [],
    dependantIds: [],
    dependantWindow: 0,
    excludedDependantIds: [],
    requiredDependantIds: [],
    appliedExcludeChildrenIds: [],
    appliedExcludedDependantIds: [],
    serverExcludeChildrenIds: [],
    serverExcludedDependantIds: [],
};

export const $issueDialogDetails = map<IssueDialogDetailsStore>(structuredClone(initialState));

// Whether applied dependant exclusions are shown in the list ("Show/Hide excluded" toggle).
export const $showIssueDialogDetailsExcludedDependants = atom<boolean>(true);

export const $deleteCommentConfirmation = map<DeleteCommentConfirmation>({
    open: false,
    commentId: undefined,
});

//
// * Derived state
//

export const $issueDialogDetailsIssue = computed(
    [$issueDialog, $issueDialogDetails],
    ({ issueId, issues }, { issue }) => {
        if (issue) {
            return issue;
        }
        return issues.find((item) => item.getIssue().getId() === issueId)?.getIssue();
    },
);

export const $isIssueDialogDetailsPublishRequest = computed($issueDialogDetailsIssue, (issue) => {
    return issue?.getType() === IssueType.PUBLISH_REQUEST;
});

export const $isIssueDialogDetailsClosed = computed($issueDialogDetailsIssue, (issue) => {
    return issue?.getIssueStatus() === IssueStatus.CLOSED;
});

export const $canIssueDialogDetailsShowSelectionStatusBar = computed(
    [$isIssueDialogDetailsPublishRequest, $isIssueDialogDetailsClosed],
    (isPublishRequest, isClosed) => isPublishRequest && !isClosed,
);

export const $canIssueDialogDetailsPublish = computed(
    [$isIssueDialogDetailsPublishRequest, $isIssueDialogDetailsClosed],
    (isPublishRequest, isClosed) => isPublishRequest && !isClosed,
);

// The items tab is editable for standard issues too, which have no publish status bar. Gate the
// bar itself on this, and keep the publish-specific entries on the computed above.
export const $canIssueDialogDetailsEditSelection = computed(
    [$issueDialogDetailsIssue, $isIssueDialogDetailsClosed],
    (issue, isClosed) => !!issue && !isClosed,
);

export const $isIssueDialogDetailsSelectionSynced = computed($issueDialogDetails, isDraftSelectionSynced);

export const $issueDialogDetailsHasMoreDependants = computed(
    $issueDialogDetails,
    ({ dependantIds, dependantWindow }) => dependantWindow < dependantIds.length,
);

export const $issueDialogDetailsHasExcludedDependants = computed(
    $issueDialogDetails,
    ({ dependantIds, appliedExcludedDependantIds }) =>
        hasHideableExcludedDependants(dependantIds, appliedExcludedDependantIds),
);

// From the full id set, not the loaded window, and filtered by the "show excluded" toggle.
export const $issueDialogDetailsDependantsSelection = computed(
    [$issueDialogDetails, $showIssueDialogDetailsExcludedDependants],
    ({ dependantIds, requiredDependantIds, excludedDependantIds, appliedExcludedDependantIds }, showExcluded) =>
        calcDependantsSelection(
            filterShownDependantIds(dependantIds, appliedExcludedDependantIds, showExcluded),
            requiredDependantIds,
            excludedDependantIds,
        ),
);

//
// * Public API
//

/**
 * Snap back to "show excluded" once nothing is excluded, so the toggle never lingers hidden.
 * Written here, not subscribed in the service: a listener would pin `$issueDialogDetails` mounted.
 */
const syncShowExcludedDependants = (): void => {
    const { dependantIds, appliedExcludedDependantIds } = $issueDialogDetails.get();

    if (!hasHideableExcludedDependants(dependantIds, appliedExcludedDependantIds)) {
        $showIssueDialogDetailsExcludedDependants.set(true);
    }
};

export const setIssueDialogDetailsTab = (detailsTab: IssueDialogDetailsTab): void => {
    $issueDialogDetails.setKey('detailsTab', detailsTab);
};

export const setIssueDialogCommentText = (commentText: string): void => {
    $issueDialogDetails.setKey('commentText', commentText);
};

type IssueDialogItemsOptions = {
    forceReload?: boolean;
    allowWhileUpdating?: boolean;
    expectedPublishRequest?: PublishRequest;
};

const mergePersistedDependantExclusions = (
    persistedIds: ContentId[],
    appliedIds: ContentId[],
    draftIds: ContentId[],
): ContentId[] => {
    const added = draftIds.filter((id) => !hasContentIdInIds(id, appliedIds));
    const removed = appliedIds.filter((id) => !hasContentIdInIds(id, draftIds));

    return uniqueIds([...added, ...persistedIds.filter((id) => !hasContentIdInIds(id, removed))]);
};

export const loadIssueDialogItems = async (issue?: Issue, options: IssueDialogItemsOptions = {}): Promise<void> => {
    const { forceReload = false, allowWhileUpdating = false } = options;
    const state = $issueDialogDetails.get();
    const targetIssue = issue ?? state.issue;

    if (!targetIssue) {
        return;
    }

    if (state.itemsUpdating && !allowWhileUpdating) {
        if (state.issueId === targetIssue.getId()) {
            queuedIssueDialogItemsReloadIssueId = state.issueId;
        }
        return;
    }

    const publishRequest = targetIssue.getPublishRequest();
    const itemIds = publishRequest?.getItemsIds() ?? [];
    const serverExcludeChildrenIds = publishRequest?.getExcludeChildrenIds() ?? [];
    const serverExcludedDependantIds = publishRequest?.getExcludeIds() ?? [];

    if (itemIds.length === 0) {
        $issueDialogDetails.set({
            ...$issueDialogDetails.get(),
            itemsLoading: false,
            itemsError: false,
            items: [],
            excludeChildrenIds: [],
            dependants: [],
            dependantIds: [],
            dependantWindow: 0,
            excludedDependantIds: [],
            requiredDependantIds: [],
            appliedExcludeChildrenIds: [],
            appliedExcludedDependantIds: [],
            serverExcludeChildrenIds: [],
            serverExcludedDependantIds: [],
        });
        syncShowExcludedDependants();
        return;
    }

    const requestId = ++dependenciesRequestId;
    const currentState = $issueDialogDetails.get();
    const isSameIssue = !!currentState.issue && currentState.issue.getId() === targetIssue.getId();
    const existingItemIds = isSameIssue ? currentState.items.map((item) => item.getContentId()) : [];
    const canReuseItems = isSameIssue && existingItemIds.length > 0 && isIdsEqual(existingItemIds, itemIds);
    const shouldFetchItems = !canReuseItems || forceReload;

    // Compared on issueId rather than `isSameIssue`: the latter needs `currentState.issue`, which
    // is undefined on the list-backed path.
    const hasStagedSelection = currentState.issueId === targetIssue.getId() && !isDraftSelectionSynced(currentState);
    // Compare full server selections. The visible applied list may have lost exclusions while
    // children were off, so it cannot identify whether this reload came from another editor.
    const baselineRequest = options.expectedPublishRequest;
    const baselineExcludeChildrenIds =
        baselineRequest?.getExcludeChildrenIds() ?? currentState.serverExcludeChildrenIds;
    const baselineExcludedDependantIds = baselineRequest?.getExcludeIds() ?? currentState.serverExcludedDependantIds;
    const keepDraft =
        hasStagedSelection &&
        isIdsEqual(baselineExcludeChildrenIds, serverExcludeChildrenIds) &&
        isIdsEqual(baselineExcludedDependantIds, serverExcludedDependantIds);
    // Rebase the user's visible edits onto the full saved selection. An exclusion hidden by a
    // child toggle must return to the draft when that child is included again.
    const rebasedDraftIds = mergePersistedDependantExclusions(
        serverExcludedDependantIds,
        currentState.appliedExcludedDependantIds,
        currentState.excludedDependantIds,
    );

    $issueDialogDetails.set({
        ...currentState,
        itemsLoading: true,
        itemsError: false,
        items: canReuseItems ? currentState.items : [],
        dependants: isSameIssue ? currentState.dependants : [],
        dependantIds: isSameIssue ? currentState.dependantIds : [],
        dependantWindow: isSameIssue ? currentState.dependantWindow : 0,
        requiredDependantIds: isSameIssue ? currentState.requiredDependantIds : [],
        excludeChildrenIds: keepDraft ? currentState.excludeChildrenIds : serverExcludeChildrenIds,
        excludedDependantIds: keepDraft ? rebasedDraftIds : serverExcludedDependantIds,
        appliedExcludeChildrenIds: serverExcludeChildrenIds,
        appliedExcludedDependantIds: serverExcludedDependantIds,
        serverExcludeChildrenIds,
        serverExcludedDependantIds,
    });
    syncShowExcludedDependants();

    try {
        const items = shouldFetchItems ? await fetchContentSummaries(itemIds) : currentState.items;
        if (requestId !== dependenciesRequestId) {
            return;
        }

        const resolution = await resolveAppliedPublishDependencies({
            ids: itemIds,
            excludeChildrenIds: serverExcludeChildrenIds,
            excludedIds: serverExcludedDependantIds,
        });
        if (requestId !== dependenciesRequestId) {
            return;
        }

        if (resolution.isErr()) {
            console.error(resolution.error);
            $issueDialogDetails.set({
                ...$issueDialogDetails.get(),
                itemsLoading: false,
                itemsError: true,
            });
            showError(resolution.error.message);
            return;
        }

        const { maxResult, minResult } = resolution.value;

        // maxResult (no dependant exclusions) keeps excluded rows visible and re-includable.
        const allDependantIds = maxResult.getDependants().filter((id) => !hasContentIdInIds(id, itemIds));

        const firstWindow = await fetchDependantWindowSlice(allDependantIds, 0);
        if (requestId !== dependenciesRequestId) {
            return;
        }

        if (firstWindow.failed) {
            $issueDialogDetails.set({
                ...$issueDialogDetails.get(),
                itemsLoading: false,
                itemsError: true,
            });
            return;
        }

        const sortedItems = canReuseItems ? items : sortByIdOrder(items, itemIds);
        const sortedDependants = orderSummariesByIds(firstWindow.summaries, allDependantIds);
        const requiredDependantIds = minResult.getRequired().filter((id) => hasContentIdInIds(id, allDependantIds));

        // Prune from the latest state rather than the captured server values: an Apply that
        // advanced `applied*` while this reload was in flight must not be overwritten here.
        const latestState = $issueDialogDetails.get();
        $issueDialogDetails.set({
            ...latestState,
            items: sortedItems,
            dependants: sortedDependants,
            dependantIds: allDependantIds,
            dependantWindow: Math.min(DEPENDANT_LOAD_SIZE, allDependantIds.length),
            requiredDependantIds,
            excludeChildrenIds: latestState.excludeChildrenIds.filter((id) => hasContentIdInIds(id, itemIds)),
            appliedExcludeChildrenIds: latestState.appliedExcludeChildrenIds.filter((id) =>
                hasContentIdInIds(id, itemIds),
            ),
            excludedDependantIds: pruneExcludedDependantIds(
                latestState.excludedDependantIds,
                allDependantIds,
                requiredDependantIds,
            ),
            appliedExcludedDependantIds: pruneExcludedDependantIds(
                latestState.appliedExcludedDependantIds,
                allDependantIds,
                requiredDependantIds,
            ),
            itemsLoading: false,
            itemsError: false,
        });
        syncShowExcludedDependants();
    } catch (error) {
        if (requestId !== dependenciesRequestId) {
            return;
        }
        console.error(error);
        $issueDialogDetails.set({
            ...$issueDialogDetails.get(),
            itemsLoading: false,
            itemsError: true,
        });
        showError(error?.message ?? String(error));
    }
};

export const loadMoreIssueDialogDependants = createDependantWindowLoader(
    $issueDialogDetails,
    () => dependenciesRequestId,
);

export const loadIssueDialogIssue = async (nextIssueId?: string): Promise<void> => {
    const state = $issueDialogDetails.get();
    const issueId = nextIssueId ?? state.issueId;

    if (!issueId || state.issueLoading) {
        return;
    }

    if (state.issue && state.issue.getId() === issueId) {
        return;
    }

    $issueDialogDetails.set({
        ...state,
        issueLoading: true,
        issueError: false,
    });

    try {
        const issueResult = await fetchIssue(issueId);

        if (issueResult.isErr()) {
            handleIssueLoadError(issueResult.error, issueId);
            return;
        }

        const issue = issueResult.value;
        const latestState = $issueDialogDetails.get();

        if (latestState.issueId !== issueId) {
            return;
        }

        const defaultTab = resolveDefaultDetailsTab(issueId, issue);
        const nextTab = latestState.detailsTab === initialState.detailsTab ? defaultTab : latestState.detailsTab;

        $issueDialogDetails.set({
            ...latestState,
            issue,
            issueLoading: false,
            issueError: false,
            detailsTab: nextTab,
        });
    } catch (error) {
        // Throws escaping the Result contract (e.g. Issue.fromJson on a
        // malformed payload) must not leave the details panel loading forever.
        handleIssueLoadError(error, issueId);
    }
};

const handleIssueLoadError = (error: unknown, issueId: string): void => {
    console.error(error);
    const latestState = $issueDialogDetails.get();

    if (latestState.issueId !== issueId) {
        return;
    }

    $issueDialogDetails.set({
        ...latestState,
        issueLoading: false,
        issueError: true,
    });
};

export const loadIssueDialogComments = async (
    nextIssueId?: string,
    options: LoadIssueDialogCommentsOptions = {},
): Promise<void> => {
    const state = $issueDialogDetails.get();
    const issueId = nextIssueId ?? state.issueId;

    if (!issueId || (state.commentsLoading && !options.forceReload)) {
        return;
    }

    const requestId = ++commentsRequestId;

    $issueDialogDetails.set({
        ...state,
        commentsLoading: true,
        commentsError: false,
    });

    const result = await listIssueComments(issueId);

    if (result.isErr()) {
        console.error(result.error);
        const latestState = $issueDialogDetails.get();

        if (latestState.issueId !== issueId || requestId !== commentsRequestId) {
            return;
        }
        $issueDialogDetails.set({
            ...latestState,
            commentsLoading: false,
            commentsError: true,
        });
        return;
    }

    const latestState = $issueDialogDetails.get();

    if (latestState.issueId !== issueId || requestId !== commentsRequestId) {
        return;
    }

    $issueDialogDetails.set({
        ...latestState,
        comments: result.value,
        commentsIssueId: issueId,
        commentsLoading: false,
        commentsError: false,
    });
};

export const submitIssueDialogComment = async (): Promise<boolean> => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId) {
        return false;
    }

    const trimmedComment = state.commentText.trim();

    if (!trimmedComment || state.commentSubmitting) {
        return false;
    }

    $issueDialogDetails.setKey('commentSubmitting', true);

    const dialogState = $issueDialog.get();
    const issueType = resolveIssueType(issueId, dialogState.issues, state.issue);

    const result = await createIssueComment({
        issueId,
        text: trimmedComment,
        creator: AuthContext.get().getUser().getKey(),
    });

    if (result.isErr()) {
        console.error(result.error);
        $issueDialogDetails.setKey('commentSubmitting', false);
        const baseMessage = i18n(getCommentErrorMessageKey(issueType));
        const errorMessage = result.error.message;
        const fallbackMessage =
            errorMessage && errorMessage !== baseMessage ? `${baseMessage} ${errorMessage}` : baseMessage;
        showError(fallbackMessage);
        return false;
    }

    const comment = result.value;
    const latestState = $issueDialogDetails.get();
    const existingComments = latestState.commentsIssueId === issueId ? latestState.comments : [];

    $issueDialogDetails.set({
        ...latestState,
        comments: [...existingComments, comment],
        commentsIssueId: issueId,
        commentText: '',
        commentSubmitting: false,
    });
    showFeedback(i18n(getCommentMessageKey(issueType)));
    return true;
};

export const updateIssueDialogComment = async (commentId: string, text: string): Promise<boolean> => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId || !commentId) {
        return false;
    }

    const trimmedText = text.trim();

    if (!trimmedText) {
        return false;
    }

    const dialogState = $issueDialog.get();
    const issueType = resolveIssueType(issueId, dialogState.issues, state.issue);

    const result = await updateIssueComment({ commentId, text: trimmedText });

    if (result.isErr()) {
        console.error(result.error);
        showError(result.error.message);
        return false;
    }

    const updatedComment = result.value;
    const latestState = $issueDialogDetails.get();

    if (latestState.issueId !== issueId) {
        return true;
    }

    $issueDialogDetails.set({
        ...latestState,
        comments: latestState.comments.map((comment) => {
            if (comment.getId() !== commentId) {
                return comment;
            }
            return updatedComment;
        }),
    });
    showFeedback(i18n(getCommentUpdatedMessageKey(issueType)));
    return true;
};

export const deleteIssueDialogComment = async (commentId: string): Promise<boolean> => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId || !commentId) {
        return false;
    }

    const dialogState = $issueDialog.get();
    const issueType = resolveIssueType(issueId, dialogState.issues, state.issue);

    const result = await deleteIssueComment(commentId);

    if (result.isErr()) {
        console.error(result.error);
        showError(result.error.message);
        return false;
    }

    const deleted = result.value;
    const latestState = $issueDialogDetails.get();

    if (!deleted || latestState.issueId !== issueId) {
        return deleted;
    }

    $issueDialogDetails.set({
        ...latestState,
        comments: latestState.comments.filter((comment) => comment.getId() !== commentId),
    });
    showFeedback(i18n(getCommentDeletedMessageKey(issueType)));
    return true;
};

export const updateIssueDialogStatus = (nextStatus: IssueStatus): Promise<boolean> =>
    serializeIssueMutation(false, () => updateIssueDialogStatusNow(nextStatus));

const updateIssueDialogStatusNow = async (nextStatus: IssueStatus): Promise<boolean> => {
    const context = getIssueContext('statusUpdating');
    if (!context) {
        return false;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;
    const generation = issueMutationGeneration;

    if (issue.getIssueStatus() === nextStatus) {
        return true;
    }

    $issueDialogDetails.setKey('statusUpdating', true);

    const result = await updateIssue({
        id: issueId,
        title: issue.getTitle(),
        description: issue.getDescription(),
        status: nextStatus,
        publishFrom: issue.getPublishFrom(),
        publishTo: issue.getPublishTo(),
    });

    if (!isCurrentIssueMutation(issueId, generation)) {
        return false;
    }

    if (result.isErr()) {
        console.error(result.error);
        $issueDialogDetails.setKey('statusUpdating', false);
        showError(result.error.message);
        return false;
    }

    const updatedIssue = result.value;

    applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, { statusUpdating: false });

    void loadIssueDialogList();
    showFeedback(i18n(getStatusMessageKey(updatedIssue.getType(), nextStatus)));
    return true;
};

export const updateIssueDialogTitle = (nextTitle: string): Promise<void> =>
    serializeIssueMutation(undefined, () => updateIssueDialogTitleNow(nextTitle));

const updateIssueDialogTitleNow = async (nextTitle: string): Promise<void> => {
    const context = getIssueContext('titleUpdating');
    if (!context) {
        return;
    }

    const { issueId, dialogState, issueWithAssignees, issue } = context;
    const generation = issueMutationGeneration;
    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle || issue.getTitle() === trimmedTitle) {
        return;
    }

    $issueDialogDetails.setKey('titleUpdating', true);

    const result = await updateIssue({
        id: issueId,
        title: trimmedTitle,
        description: issue.getDescription(),
        status: issue.getIssueStatus(),
        approvers: issue.getApprovers(),
        publishFrom: issue.getPublishFrom(),
        publishTo: issue.getPublishTo(),
    });

    if (!isCurrentIssueMutation(issueId, generation)) {
        return;
    }

    if (result.isErr()) {
        console.error(result.error);
        $issueDialogDetails.setKey('titleUpdating', false);
        showError(result.error.message);
        return;
    }

    const updatedIssue = result.value;

    applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, { titleUpdating: false });

    const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    showFeedback(i18n(`${prefix}updated`));
    void loadIssueDialogList();
};

export const updateIssueDialogAssignees = (nextAssigneeIds: readonly string[]): Promise<void> =>
    serializeIssueMutation(undefined, () => updateIssueDialogAssigneesNow(nextAssigneeIds));

const updateIssueDialogAssigneesNow = async (nextAssigneeIds: readonly string[]): Promise<void> => {
    const context = getIssueContext('assigneesUpdating');
    if (!context) {
        return;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;
    const generation = issueMutationGeneration;

    const currentAssigneeIds = issue.getApprovers().map((approver) => approver.toString());
    const nextIds = [...nextAssigneeIds].sort();
    const currentIds = [...currentAssigneeIds].sort();

    if (nextIds.length === currentIds.length && nextIds.every((id, index) => id === currentIds[index])) {
        return;
    }

    $issueDialogDetails.setKey('assigneesUpdating', true);

    const approvers = nextAssigneeIds.map((id) => PrincipalKey.fromString(id));
    const updateResult = await updateIssue({
        id: issueId,
        title: issue.getTitle(),
        description: issue.getDescription(),
        status: issue.getIssueStatus(),
        approvers,
        publishFrom: issue.getPublishFrom(),
        publishTo: issue.getPublishTo(),
    });

    if (!isCurrentIssueMutation(issueId, generation)) {
        return;
    }

    if (updateResult.isErr()) {
        console.error(updateResult.error);
        $issueDialogDetails.setKey('assigneesUpdating', false);
        showError(updateResult.error.message);
        return;
    }

    const updatedIssue = updateResult.value;

    let assignees = issueWithAssignees?.getAssignees() ?? [];
    if (approvers.length > 0) {
        const result = await resolvePrincipalsByKeys(approvers);
        if (!isCurrentIssueMutation(issueId, generation)) {
            return;
        }
        result.match(
            (principals) => {
                assignees = principals;
            },
            (error) => {
                console.error(error);
            },
        );
    } else {
        assignees = [];
    }

    applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, { assigneesUpdating: false }, assignees);

    const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    showFeedback(i18n(`${prefix}updated`));
    void loadIssueDialogList();
};

export const updateIssueDialogSchedule = (publishFrom: Date | undefined, publishTo: Date | undefined): Promise<void> =>
    serializeIssueMutation(undefined, () => updateIssueDialogScheduleNow(publishFrom, publishTo));

const updateIssueDialogScheduleNow = async (
    publishFrom: Date | undefined,
    publishTo: Date | undefined,
): Promise<void> => {
    const context = getIssueContext('scheduleUpdating');
    if (!context) {
        return;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;
    const generation = issueMutationGeneration;

    $issueDialogDetails.setKey('scheduleUpdating', true);

    const result = await updateIssue({
        id: issueId,
        title: issue.getTitle(),
        description: issue.getDescription(),
        status: issue.getIssueStatus(),
        approvers: issue.getApprovers(),
        publishRequest: issue.getPublishRequest() ?? undefined,
        publishFrom,
        publishTo,
    });

    if (!isCurrentIssueMutation(issueId, generation)) {
        return;
    }

    if (result.isErr()) {
        console.error(result.error);
        $issueDialogDetails.setKey('scheduleUpdating', false);
        showError(result.error.message);
        return;
    }

    const updatedIssue = result.value;
    applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, { scheduleUpdating: false });

    void loadIssueDialogList();
    const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    showFeedback(i18n(`${prefix}updated`));
};

export const updateIssueDialogItems = (nextItemIds: ContentId[]): Promise<void> =>
    serializeIssueMutation(undefined, () => updateIssueDialogItemsNow(nextItemIds));

const updateIssueDialogItemsNow = async (nextItemIds: ContentId[]): Promise<void> => {
    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;

    const nextUniqueIds = uniqueIds(nextItemIds);
    const publishRequest = issue.getPublishRequest();
    const currentItemIds = publishRequest?.getItemsIds() ?? [];
    if (isIdsEqual(currentItemIds, nextUniqueIds)) {
        return;
    }

    const nextIdStrings = new Set(nextUniqueIds.map((id) => id.toString()));
    const state = $issueDialogDetails.get();

    $issueDialogDetails.set({
        ...state,
        itemsUpdating: true,
        excludeChildrenIds: state.excludeChildrenIds.filter((id) => nextIdStrings.has(id.toString())),
        appliedExcludeChildrenIds: state.appliedExcludeChildrenIds.filter((id) => nextIdStrings.has(id.toString())),
    });

    // Sourced from the server request, not the draft: adding or removing an item must not
    // silently commit a staged children toggle on the others.
    const includeChildrenById = new Map(
        (publishRequest?.getItems() ?? []).map((item) => [item.getId().toString(), item.isIncludeChildren()]),
    );
    const nextItems = nextUniqueIds.map((id) =>
        PublishRequestItem.create()
            .setId(id)
            .setIncludeChildren(includeChildrenById.get(id.toString()) ?? true)
            .build(),
    );
    const nextPublishRequest = PublishRequest.create(publishRequest ?? undefined)
        .setPublishRequestItems(nextItems)
        .build();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
        forceReloadItems: true,
        onFailure: () => {
            if ($issueDialogDetails.get().issueId !== issueId) {
                return;
            }
            $issueDialogDetails.set({
                ...$issueDialogDetails.get(),
                excludeChildrenIds: state.excludeChildrenIds,
                appliedExcludeChildrenIds: state.appliedExcludeChildrenIds,
            });
        },
    });
};

export const setIssueDialogDetailsItemIncludeChildren = (id: ContentId, includeChildren: boolean): Promise<void> =>
    serializeIssueMutation(undefined, () => setIssueDialogDetailsItemIncludeChildrenNow(id, includeChildren));

const setIssueDialogDetailsItemIncludeChildrenNow = async (id: ContentId, includeChildren: boolean): Promise<void> => {
    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;
    const publishRequest = issue.getPublishRequest();
    if (!publishRequest) {
        return;
    }

    const state = $issueDialogDetails.get();
    const serverChildren = publishRequest.getExcludeChildrenIds();
    const nextChildren = withIdExcluded(serverChildren, id, !includeChildren);
    if (nextChildren === serverChildren) {
        return;
    }

    // Invalidate any older resolve before the save begins, so it cannot clear loading or
    // replace the dependant tree for the selection that was just changed.
    dependenciesRequestId += 1;
    $issueDialogDetails.set({
        ...state,
        excludeChildrenIds: nextChildren,
        appliedExcludeChildrenIds: nextChildren,
        itemsUpdating: true,
        itemsLoading: true,
        itemsError: false,
    });

    // Keep server exclusions hidden by the current dependency tree.
    const nextPublishRequest = PublishRequest.create(publishRequest)
        .setPublishRequestItems(buildItemsFromIds(publishRequest.getItemsIds(), nextChildren))
        .build();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
        onFailure: () => {
            if ($issueDialogDetails.get().issueId !== issueId) {
                return;
            }
            // This toggle invalidated a resolve already in flight. Replay it after rollback,
            // even when no new reload arrived during the save.
            if (state.itemsLoading || state.itemsError) {
                queuedIssueDialogItemsReloadIssueId = issueId;
            }
            $issueDialogDetails.set({
                ...$issueDialogDetails.get(),
                excludeChildrenIds: state.excludeChildrenIds,
                appliedExcludeChildrenIds: state.appliedExcludeChildrenIds,
                itemsLoading: state.itemsLoading,
                itemsError: state.itemsError,
            });
        },
    });
};

export const setIssueDialogDetailsDependantIncluded = (id: ContentId, included: boolean): void => {
    const state = $issueDialogDetails.get();
    if (hasContentIdInIds(id, state.requiredDependantIds)) {
        return;
    }

    const next = withIdExcluded(state.excludedDependantIds, id, !included);

    if (next !== state.excludedDependantIds) {
        $issueDialogDetails.setKey('excludedDependantIds', next);
    }
};

export const applyDraftIssueDialogDetailsSelection = (): Promise<void> =>
    serializeIssueMutation(undefined, applyDraftIssueDialogDetailsSelectionNow);

const applyDraftIssueDialogDetailsSelectionNow = async (): Promise<void> => {
    if ($isIssueDialogDetailsSelectionSynced.get()) {
        return;
    }

    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;

    const publishRequest = issue.getPublishRequest();
    if (!publishRequest) {
        return;
    }

    const state = $issueDialogDetails.get();
    const { excludeChildrenIds, excludedDependantIds, appliedExcludeChildrenIds, appliedExcludedDependantIds } = state;

    // `includeChildren` is a per-item flag rather than a persisted list, so the draft exclusions
    // are folded back into the request items on the way out. Ids come from the request, not from
    // `state.items`: Apply changes flags, never membership.
    const nextPublishRequest = PublishRequest.create(publishRequest)
        .setPublishRequestItems(buildItemsFromIds(publishRequest.getItemsIds(), excludeChildrenIds))
        .setExcludeIds(
            mergePersistedDependantExclusions(
                publishRequest.getExcludeIds(),
                appliedExcludedDependantIds,
                excludedDependantIds,
            ),
        )
        .build();

    // Applied advances before the PUT so the reload it triggers - and the debounced issue server
    // event behind it - see an unchanged server baseline instead of a third-party conflict.
    $issueDialogDetails.set({
        ...state,
        itemsUpdating: true,
        ...commitDraftSelection(state),
    });
    syncShowExcludedDependants();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
        onFailure: () => {
            if ($issueDialogDetails.get().issueId !== issueId) {
                return;
            }
            $issueDialogDetails.set({
                ...$issueDialogDetails.get(),
                appliedExcludeChildrenIds,
                appliedExcludedDependantIds,
            });
        },
    });
};

export const cancelDraftIssueDialogDetailsSelection = (): void => {
    if ($isIssueDialogDetailsSelectionSynced.get()) {
        return;
    }

    const state = $issueDialogDetails.get();
    $issueDialogDetails.set({ ...state, ...revertDraftSelection(state) });
};

export const updateIssueDialogExcludedDependants = (nextExcludedIds: ContentId[]): Promise<void> =>
    serializeIssueMutation(undefined, () => updateIssueDialogExcludedDependantsNow(nextExcludedIds));

const updateIssueDialogExcludedDependantsNow = async (nextExcludedIds: ContentId[]): Promise<void> => {
    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const { issueId, dialogState, issueWithAssignees, issue } = context;

    const publishRequest = issue.getPublishRequest();
    if (!publishRequest) {
        return;
    }

    const state = $issueDialogDetails.get();
    const nextApplied = uniqueIds(nextExcludedIds);
    // The error-bar exclusions apply immediately, so the banner never appears for them; anything
    // the user has staged separately stays staged.
    const nextDraft = uniqueIds([...state.excludedDependantIds, ...nextApplied]);

    if (
        isIdsEqual(state.appliedExcludedDependantIds, nextApplied) &&
        isIdsEqual(state.excludedDependantIds, nextDraft)
    ) {
        return;
    }

    $issueDialogDetails.set({
        ...state,
        itemsUpdating: true,
        excludedDependantIds: nextDraft,
        appliedExcludedDependantIds: nextApplied,
    });

    const nextPublishRequest = PublishRequest.create(publishRequest)
        .setExcludeIds(
            mergePersistedDependantExclusions(
                publishRequest.getExcludeIds(),
                state.appliedExcludedDependantIds,
                nextApplied,
            ),
        )
        .build();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
        onFailure: () => {
            if ($issueDialogDetails.get().issueId !== issueId) {
                return;
            }
            $issueDialogDetails.set({
                ...$issueDialogDetails.get(),
                excludedDependantIds: state.excludedDependantIds,
                appliedExcludedDependantIds: state.appliedExcludedDependantIds,
            });
        },
    });
};

export const toggleIssueDialogDetailsShowExcludedDependants = (): void => {
    $showIssueDialogDetailsExcludedDependants.set(!$showIssueDialogDetailsExcludedDependants.get());
};

export const toggleIssueDialogDetailsDependantsSelection = (): void => {
    // Read the computed: it defines the rows on screen, so a batch toggle skips hidden ones.
    const selection = $issueDialogDetailsDependantsSelection.get();
    if (selection.selectableIds.length === 0) {
        return;
    }

    const { excludedDependantIds } = $issueDialogDetails.get();
    $issueDialogDetails.setKey('excludedDependantIds', nextDependantExclusions(selection, excludedDependantIds));
};

export const openDeleteCommentConfirmation = (commentId: string): void => {
    $deleteCommentConfirmation.set({ open: true, commentId });
};

export const closeDeleteCommentConfirmation = (): void => {
    $deleteCommentConfirmation.set({ open: false, commentId: undefined });
};

export const isDeleteCommentConfirmationOpen = (): boolean => {
    return $deleteCommentConfirmation.get().open;
};

//
// * Internal
//

type IssueDetailsUpdatingKey =
    | 'statusUpdating'
    | 'assigneesUpdating'
    | 'itemsUpdating'
    | 'titleUpdating'
    | 'scheduleUpdating';

type IssueDialogState = ReturnType<typeof $issueDialog.get>;

type IssueContext = {
    issueId: string;
    dialogState: IssueDialogState;
    issueWithAssignees?: IssueWithAssignees;
    issue: Issue;
};

export type IssueAssignees = ReturnType<IssueWithAssignees['getAssignees']>;

type LoadIssueDialogCommentsOptions = {
    forceReload?: boolean;
};

let dependenciesRequestId = 0;
let queuedIssueDialogItemsReloadIssueId: string | undefined;

let commentsRequestId = 0;

const resolveDefaultDetailsTab = (issueId?: string, issue?: Issue): IssueDialogDetailsTab => {
    if (!issueId) {
        return initialState.detailsTab;
    }

    const dialogState = $issueDialog.get();
    const issueType = resolveIssueType(issueId, dialogState.issues, issue);
    return issueType === IssueType.PUBLISH_REQUEST ? 'items' : 'comments';
};

function sortByIdOrder<T extends ContentIdProvider>(items: T[], order: ContentId[]): T[] {
    if (items.length === 0 || order.length === 0) {
        return items;
    }

    const orderMap = new Map(order.map((id, index) => [id.toString(), index]));
    return items
        .map((item, index) => ({
            item,
            index,
            orderIndex: orderMap.get(item.getContentId().toString()),
        }))
        .sort((a, b) => {
            const aOrder = a.orderIndex;
            const bOrder = b.orderIndex;
            if (aOrder == null && bOrder == null) {
                return a.index - b.index;
            }
            if (aOrder == null) {
                return 1;
            }
            if (bOrder == null) {
                return -1;
            }
            return aOrder - bOrder;
        })
        .map((entry) => entry.item);
}

const getIssueContext = (updatingKey?: IssueDetailsUpdatingKey): IssueContext | null => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId || (updatingKey && state[updatingKey])) {
        return null;
    }

    const dialogState = $issueDialog.get();
    const issueWithAssignees = dialogState.issues.find((item) => item.getIssue().getId() === issueId);
    const issue = state.issue ?? issueWithAssignees?.getIssue();

    if (!issue) {
        return null;
    }

    return {
        issueId,
        dialogState,
        issueWithAssignees,
        issue,
    };
};

// Issue updates send title, status, schedule, and often publish request together. Run each
// mutation after the previous one has applied its response, so it reads current issue fields.
const pendingIssueMutations = new Map<string, Promise<void>>();
let issueMutationGeneration = 0;

const isCurrentIssueMutation = (issueId: string, generation: number): boolean =>
    generation === issueMutationGeneration && $issueDialogDetails.get().issueId === issueId;

const serializeIssueMutation = <T>(skipped: T, mutation: () => Promise<T>): Promise<T> => {
    const issueId = $issueDialogDetails.get().issueId;
    if (!issueId) {
        return Promise.resolve(skipped);
    }
    const generation = issueMutationGeneration;

    const previous = pendingIssueMutations.get(issueId);
    let release: () => void;
    const current = new Promise<void>((resolve) => {
        release = resolve;
    });
    pendingIssueMutations.set(issueId, current);

    const run = async (): Promise<T> => {
        if (previous) {
            await previous;
        }
        try {
            if (generation !== issueMutationGeneration || $issueDialogDetails.get().issueId !== issueId) {
                return skipped;
            }
            return await mutation();
        } finally {
            release();
            if (pendingIssueMutations.get(issueId) === current) {
                pendingIssueMutations.delete(issueId);
            }
        }
    };

    return run();
};

const flushQueuedIssueDialogItemsReload = async (issueId: string): Promise<void> => {
    if (queuedIssueDialogItemsReloadIssueId !== issueId) {
        return;
    }
    queuedIssueDialogItemsReloadIssueId = undefined;

    const context = getIssueContext();
    if (context?.issueId === issueId) {
        await loadIssueDialogItems(context.issue, { forceReload: true });
    }
};

// Shared with the service wiring, which applies server-event reload results.
export const applyUpdatedIssue = (
    updatedIssue: Issue,
    dialogState: IssueDialogState,
    issueWithAssignees: IssueWithAssignees | undefined,
    detailsUpdates: Partial<IssueDialogDetailsStore>,
    assigneesOverride?: IssueAssignees,
): void => {
    if (issueWithAssignees) {
        const assignees = assigneesOverride ?? issueWithAssignees.getAssignees();
        const updatedIssues = dialogState.issues.map((item) => {
            if (item.getIssue().getId() !== updatedIssue.getId()) {
                return item;
            }
            return new IssueWithAssignees(updatedIssue, assignees);
        });

        $issueDialog.set({
            ...dialogState,
            issues: updatedIssues,
        });
    }

    const latestState = $issueDialogDetails.get();
    // A staged draft has no Apply button once the issue closes; drop it rather than strand it.
    const isClosing = updatedIssue.getIssueStatus() === IssueStatus.CLOSED;

    $issueDialogDetails.set({
        ...latestState,
        issue: updatedIssue,
        ...(isClosing && revertDraftSelection(latestState)),
        ...detailsUpdates,
    });
};

const updateIssueWithPublishRequest = async ({
    issueId,
    issue,
    dialogState,
    issueWithAssignees,
    nextPublishRequest,
    forceReloadItems = false,
    onFailure,
}: {
    issueId: string;
    issue: Issue;
    dialogState: IssueDialogState;
    issueWithAssignees?: IssueWithAssignees;
    nextPublishRequest: PublishRequest;
    forceReloadItems?: boolean;
    onFailure?: () => void;
}): Promise<boolean> => {
    const generation = issueMutationGeneration;
    const result = await updateIssue({
        id: issueId,
        title: issue.getTitle(),
        description: issue.getDescription(),
        status: issue.getIssueStatus(),
        approvers: issue.getApprovers(),
        publishRequest: nextPublishRequest,
        publishFrom: issue.getPublishFrom(),
        publishTo: issue.getPublishTo(),
    });

    if (!isCurrentIssueMutation(issueId, generation)) {
        return false;
    }

    if (result.isErr()) {
        console.error(result.error);
        onFailure?.();
        $issueDialogDetails.setKey('itemsUpdating', false);
        showError(result.error.message);
        await flushQueuedIssueDialogItemsReload(issueId);
        return false;
    }

    const updatedIssue = result.value;

    applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, {});
    await loadIssueDialogItems(updatedIssue, {
        forceReload: forceReloadItems,
        allowWhileUpdating: true,
        expectedPublishRequest: nextPublishRequest,
    });
    if (!isCurrentIssueMutation(issueId, generation)) {
        return false;
    }
    $issueDialogDetails.setKey('itemsUpdating', false);
    await flushQueuedIssueDialogItemsReload(issueId);

    const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    showFeedback(i18n(`${prefix}updated`));
    void loadIssueDialogList();

    return true;
};

const getStatusMessageKey = (issueType: IssueType, status: IssueStatus): string => {
    const prefix = issueType === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    const suffix = status === IssueStatus.CLOSED ? 'closed' : 'open';
    return `${prefix}${suffix}`;
};

const getCommentMessageKey = (issueType: IssueType): string => {
    const prefix = issueType === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    return `${prefix}commentAdded`;
};

const getCommentErrorMessageKey = (issueType: IssueType): string => {
    const prefix = issueType === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    return `${prefix}commentError`;
};

const getCommentUpdatedMessageKey = (issueType: IssueType): string => {
    const prefix = issueType === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    return `${prefix}commentUpdated`;
};

const getCommentDeletedMessageKey = (issueType: IssueType): string => {
    const prefix = issueType === IssueType.PUBLISH_REQUEST ? 'notify.publishRequest.' : 'notify.issue.';
    return `${prefix}commentDeleted`;
};

const resolveIssueType = (issueId: string, issues: IssueWithAssignees[], issue?: Issue): IssueType => {
    if (issue && issue.getId() === issueId) {
        return issue.getType();
    }

    return (
        issues
            .find((item) => item.getIssue().getId() === issueId)
            ?.getIssue()
            .getType() ?? IssueType.STANDARD
    );
};

// Shared with the service wiring, which resets details on issue dialog view changes.
export const resetIssueDialogDetails = (issueId?: string): void => {
    const baseState = structuredClone(initialState);
    issueMutationGeneration += 1;
    dependenciesRequestId += 1;
    queuedIssueDialogItemsReloadIssueId = undefined;
    commentsRequestId += 1;
    $issueDialogDetails.set({
        ...baseState,
        issueId,
        detailsTab: resolveDefaultDetailsTab(issueId),
    });
    $showIssueDialogDetailsExcludedDependants.set(true);
    $deleteCommentConfirmation.set({ open: false, commentId: undefined });
};
