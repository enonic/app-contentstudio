import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {PrincipalKey} from '@enonic/lib-admin-ui/security/PrincipalKey';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {ContentId} from '../../../../app/content/ContentId';
import type {ContentSummaryAndCompareStatus} from '../../../../app/content/ContentSummaryAndCompareStatus';
import {IssueStatus} from '../../../../app/issue/IssueStatus';
import {IssueType} from '../../../../app/issue/IssueType';
import {PublishRequest} from '../../../../app/issue/PublishRequest';
import {PublishRequestItem} from '../../../../app/issue/PublishRequestItem';
import {CreateIssueCommentRequest} from '../../../../app/issue/resource/CreateIssueCommentRequest';
import {DeleteIssueCommentRequest} from '../../../../app/issue/resource/DeleteIssueCommentRequest';
import {GetIssueRequest} from '../../../../app/issue/resource/GetIssueRequest';
import {ListIssueCommentsRequest} from '../../../../app/issue/resource/ListIssueCommentsRequest';
import {UpdateIssueCommentRequest} from '../../../../app/issue/resource/UpdateIssueCommentRequest';
import {UpdateIssueRequest} from '../../../../app/issue/resource/UpdateIssueRequest';
import {GetPrincipalsByKeysRequest} from '../../../../app/security/GetPrincipalsByKeysRequest';
import {fetchContentSummariesWithStatus} from '../../api/content';
import {resolvePublishDependencies} from '../../api/publish';
import {hasContentIdInIds, isIdsEqual, uniqueIds} from '../../utils/cms/content/ids';
import {$issueDialog, loadIssueDialogList} from './issueDialog.store';

import type {Issue} from '../../../../app/issue/Issue';
import type {IssueComment} from '../../../../app/issue/IssueComment';
import {IssueWithAssignees} from '../../../../app/issue/IssueWithAssignees';
import type {IssueDialogDetailsTab} from '../../shared/dialogs/issue/issueDialog.types';

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
    itemsUpdating: boolean;
    itemsLoading: boolean;
    itemsError: boolean;
    items: ContentSummaryAndCompareStatus[];
    excludedChildrenIds: ContentId[];
    dependants: ContentSummaryAndCompareStatus[];
    excludedDependantIds: ContentId[];
    requiredDependantIds: ContentId[];
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
    itemsUpdating: false,
    itemsLoading: false,
    itemsError: false,
    items: [],
    excludedChildrenIds: [],
    dependants: [],
    excludedDependantIds: [],
    requiredDependantIds: [],
};

export const $issueDialogDetails = map<IssueDialogDetailsStore>(structuredClone(initialState));

export const $deleteCommentConfirmation = map<DeleteCommentConfirmation>({
    open: false,
    commentId: undefined,
});

//
// * Public API
//

export const setIssueDialogDetailsTab = (detailsTab: IssueDialogDetailsTab): void => {
    $issueDialogDetails.setKey('detailsTab', detailsTab);
};

export const setIssueDialogCommentText = (commentText: string): void => {
    $issueDialogDetails.setKey('commentText', commentText);
};

export const loadIssueDialogItems = async (issue?: Issue): Promise<void> => {
    const state = $issueDialogDetails.get();
    const targetIssue = issue ?? state.issue;

    if (!targetIssue) {
        return;
    }

    const publishRequest = targetIssue.getPublishRequest();
    const itemIds = publishRequest?.getItemsIds() ?? [];
    const excludedChildrenIds = publishRequest?.getExcludeChildrenIds() ?? [];
    const excludedDependantIds = publishRequest?.getExcludeIds() ?? [];

    if (itemIds.length === 0) {
        $issueDialogDetails.set({
            ...$issueDialogDetails.get(),
            itemsLoading: false,
            itemsError: false,
            items: [],
            excludedChildrenIds: [],
            dependants: [],
            excludedDependantIds: [],
            requiredDependantIds: [],
        });
        return;
    }

    const requestId = ++dependenciesRequestId;
    const currentState = $issueDialogDetails.get();
    const isSameIssue = !!currentState.issue && currentState.issue.getId() === targetIssue.getId();
    const existingItemIds = isSameIssue ? currentState.items.map(item => item.getContentId()) : [];
    const canReuseItems = isSameIssue
                          && existingItemIds.length > 0
                          && isIdsEqual(existingItemIds, itemIds);

    $issueDialogDetails.set({
        ...currentState,
        itemsLoading: true,
        itemsError: false,
        items: canReuseItems ? currentState.items : [],
        dependants: isSameIssue ? currentState.dependants : [],
        requiredDependantIds: isSameIssue ? currentState.requiredDependantIds : [],
        excludedChildrenIds,
        excludedDependantIds,
    });

    try {
        const items = canReuseItems
                      ? currentState.items
                      : await fetchContentSummariesWithStatus(itemIds);
        if (requestId !== dependenciesRequestId) {
            return;
        }

        const result = await resolvePublishDependencies({
            ids: itemIds,
            excludeChildrenIds: excludedChildrenIds,
        });
        if (requestId !== dependenciesRequestId) {
            return;
        }

        const dependantIds = result.getDependants()
            .filter(id => !hasContentIdInIds(id, itemIds));
        const dependants = await fetchContentSummariesWithStatus(dependantIds);
        if (requestId !== dependenciesRequestId) {
            return;
        }

        const sortedItems = canReuseItems ? items : sortByIdOrder(items, itemIds);
        const sortedDependants = sortByIdOrder(dependants, dependantIds);
        const requiredDependantIds = result.getRequired()
            .filter(id => hasContentIdInIds(id, dependantIds));
        const nextExcludedDependantIds = excludedDependantIds
            .filter(id => hasContentIdInIds(id, dependantIds))
            .filter(id => !hasContentIdInIds(id, requiredDependantIds));

        const latestState = $issueDialogDetails.get();
        $issueDialogDetails.set({
            ...latestState,
            items: sortedItems,
            excludedChildrenIds,
            dependants: sortedDependants,
            requiredDependantIds,
            excludedDependantIds: nextExcludedDependantIds,
            itemsLoading: false,
            itemsError: false,
        });
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
        const issue = await new GetIssueRequest(issueId).sendAndParse();
        const latestState = $issueDialogDetails.get();

        if (latestState.issueId !== issueId) {
            return;
        }

        const defaultTab = resolveDefaultDetailsTab(issueId, issue);
        const nextTab = latestState.detailsTab === initialState.detailsTab
            ? defaultTab
            : latestState.detailsTab;

        $issueDialogDetails.set({
            ...latestState,
            issue,
            issueLoading: false,
            issueError: false,
            detailsTab: nextTab,
        });
    } catch (error) {
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
    }
};

export const loadIssueDialogComments = async (nextIssueId?: string): Promise<void> => {
    const state = $issueDialogDetails.get();
    const issueId = nextIssueId ?? state.issueId;

    if (!issueId || state.commentsLoading) {
        return;
    }

    $issueDialogDetails.set({
        ...state,
        commentsLoading: true,
        commentsError: false,
    });

    try {
        const response = await new ListIssueCommentsRequest(issueId).sendAndParse();
        const latestState = $issueDialogDetails.get();

        if (latestState.issueId !== issueId) {
            return;
        }

        $issueDialogDetails.set({
            ...latestState,
            comments: response.getIssueComments(),
            commentsIssueId: issueId,
            commentsLoading: false,
            commentsError: false,
        });
    } catch (error) {
        console.error(error);
        const latestState = $issueDialogDetails.get();

        if (latestState.issueId !== issueId) {
            return;
        }
        $issueDialogDetails.set({
            ...latestState,
            commentsLoading: false,
            commentsError: true,
        });
    }
};

export const submitIssueDialogComment = async (): Promise<void> => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId) {
        return;
    }

    const trimmedComment = state.commentText.trim();

    if (!trimmedComment || state.commentSubmitting) {
        return;
    }

    $issueDialogDetails.setKey('commentSubmitting', true);

    const dialogState = $issueDialog.get();
    const issueType = resolveIssueType(issueId, dialogState.issues, state.issue);

    try {
        const comment = await new CreateIssueCommentRequest(issueId)
            .setCreator(AuthContext.get().getUser().getKey())
            .setText(trimmedComment)
            .sendAndParse();
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
    } catch (error) {
        console.error(error);
        $issueDialogDetails.setKey('commentSubmitting', false);
        const baseMessage = i18n(getCommentErrorMessageKey(issueType));
        const errorMessage = error?.message ?? String(error);
        const fallbackMessage = errorMessage && errorMessage !== baseMessage ? `${baseMessage} ${errorMessage}` : baseMessage;
        showError(fallbackMessage);
    }
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

    try {
        const updatedComment = await new UpdateIssueCommentRequest(commentId)
            .setText(trimmedText)
            .sendAndParse();
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
    } catch (error) {
        console.error(error);
        showError(error?.message ?? String(error));
        return false;
    }
};

export const deleteIssueDialogComment = async (commentId: string): Promise<boolean> => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId || !commentId) {
        return false;
    }

    const dialogState = $issueDialog.get();
    const issueType = resolveIssueType(issueId, dialogState.issues, state.issue);

    try {
        const result = await new DeleteIssueCommentRequest(commentId).sendAndParse();
        const latestState = $issueDialogDetails.get();

        if (!result || latestState.issueId !== issueId) {
            return result;
        }

        $issueDialogDetails.set({
            ...latestState,
            comments: latestState.comments.filter((comment) => comment.getId() !== commentId),
        });
        showFeedback(i18n(getCommentDeletedMessageKey(issueType)));
        return true;
    } catch (error) {
        console.error(error);
        showError(error?.message ?? String(error));
        return false;
    }
};

export const updateIssueDialogStatus = async (nextStatus: IssueStatus): Promise<void> => {
    const context = getIssueContext('statusUpdating');
    if (!context) {
        return;
    }
    const {issueId, dialogState, issueWithAssignees, issue} = context;

    if (issue.getIssueStatus() === nextStatus) {
        return;
    }

    $issueDialogDetails.setKey('statusUpdating', true);

    try {
        const updatedIssue = await new UpdateIssueRequest(issueId)
            .setTitle(issue.getTitle())
            .setDescription(issue.getDescription())
            .setIssueStatus(nextStatus)
            .sendAndParse();

        applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, {statusUpdating: false});

        void loadIssueDialogList();
        showFeedback(i18n(getStatusMessageKey(updatedIssue.getType(), nextStatus)));
    } catch (error) {
        console.error(error);
        $issueDialogDetails.setKey('statusUpdating', false);
        showError(error?.message ?? String(error));
    }
};

export const updateIssueDialogTitle = async (nextTitle: string): Promise<void> => {
    const context = getIssueContext('titleUpdating');
    if (!context) {
        return;
    }

    const {issueId, dialogState, issueWithAssignees, issue} = context;
    const trimmedTitle = nextTitle.trim();

    if (!trimmedTitle || issue.getTitle() === trimmedTitle) {
        return;
    }

    $issueDialogDetails.setKey('titleUpdating', true);

    try {
        const updatedIssue = await new UpdateIssueRequest(issueId)
            .setTitle(trimmedTitle)
            .setDescription(issue.getDescription())
            .setIssueStatus(issue.getIssueStatus())
            .setApprovers(issue.getApprovers())
            .sendAndParse();

        applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, {titleUpdating: false});

        const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST
                       ? 'notify.publishRequest.'
                       : 'notify.issue.';
        showFeedback(i18n(`${prefix}updated`));
        void loadIssueDialogList();
    } catch (error) {
        console.error(error);
        $issueDialogDetails.setKey('titleUpdating', false);
        showError(error?.message ?? String(error));
    }
};

export const updateIssueDialogAssignees = async (nextAssigneeIds: readonly string[]): Promise<void> => {
    const context = getIssueContext('assigneesUpdating');
    if (!context) {
        return;
    }
    const {issueId, dialogState, issueWithAssignees, issue} = context;

    const currentAssigneeIds = issue.getApprovers().map(approver => approver.toString());
    const nextIds = [...nextAssigneeIds].sort();
    const currentIds = [...currentAssigneeIds].sort();

    if (nextIds.length === currentIds.length && nextIds.every((id, index) => id === currentIds[index])) {
        return;
    }

    $issueDialogDetails.setKey('assigneesUpdating', true);

    try {
        const approvers = nextAssigneeIds.map(id => PrincipalKey.fromString(id));
        const updatedIssue = await new UpdateIssueRequest(issueId)
            .setTitle(issue.getTitle())
            .setDescription(issue.getDescription())
            .setIssueStatus(issue.getIssueStatus())
            .setApprovers(approvers)
            .sendAndParse();

        let assignees = issueWithAssignees?.getAssignees() ?? [];
        if (approvers.length > 0) {
            try {
                assignees = await new GetPrincipalsByKeysRequest(approvers).sendAndParse();
            } catch (error) {
                console.error(error);
            }
        } else {
            assignees = [];
        }

        applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, {assigneesUpdating: false}, assignees);

        const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST
                       ? 'notify.publishRequest.'
                       : 'notify.issue.';
        showFeedback(i18n(`${prefix}updated`));
        void loadIssueDialogList();
    } catch (error) {
        console.error(error);
        $issueDialogDetails.setKey('assigneesUpdating', false);
        showError(error?.message ?? String(error));
    }
};

export const updateIssueDialogItems = async (nextItemIds: ContentId[]): Promise<void> => {
    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const {issueId, dialogState, issueWithAssignees, issue} = context;

    const nextUniqueIds = uniqueIds(nextItemIds);
    const publishRequest = issue.getPublishRequest();
    const currentItemIds = publishRequest?.getItemsIds() ?? [];
    if (isIdsEqual(currentItemIds, nextUniqueIds)) {
        return;
    }

    $issueDialogDetails.setKey('itemsUpdating', true);

    const includeChildrenById = new Map(
        (publishRequest?.getItems() ?? []).map(item => [item.getId().toString(), item.isIncludeChildren()]),
    );
    const nextItems = nextUniqueIds.map(id =>
        PublishRequestItem
            .create()
            .setId(id)
            .setIncludeChildren(includeChildrenById.get(id.toString()) ?? true)
            .build(),
    );
    const nextPublishRequest = PublishRequest
        .create(publishRequest ?? undefined)
        .setPublishRequestItems(nextItems)
        .build();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
    });
};

export const updateIssueDialogItemIncludeChildren = async (
    id: ContentId,
    includeChildren: boolean,
): Promise<void> => {
    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const {issueId, dialogState, issueWithAssignees, issue} = context;

    const publishRequest = issue.getPublishRequest();
    if (!publishRequest) {
        return;
    }

    const nextItems = publishRequest.getItems().map(item => {
        if (!item.getId().equals(id)) {
            return item;
        }
        return PublishRequestItem
            .create()
            .setId(item.getId())
            .setIncludeChildren(includeChildren)
            .build();
    });

    const sameValue = publishRequest.getItems().every(item =>
        item.getId().equals(id) ? item.isIncludeChildren() === includeChildren : true);
    if (sameValue) {
        return;
    }

    $issueDialogDetails.setKey('itemsUpdating', true);

    const nextPublishRequest = PublishRequest
        .create(publishRequest)
        .setPublishRequestItems(nextItems)
        .build();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
    });
};

export const updateIssueDialogDependencyIncluded = async (
    id: ContentId,
    included: boolean,
): Promise<void> => {
    const context = getIssueContext('itemsUpdating');
    if (!context) {
        return;
    }
    const {issueId, dialogState, issueWithAssignees, issue} = context;

    const publishRequest = issue.getPublishRequest();
    if (!publishRequest) {
        return;
    }

    const currentExcludeIds = publishRequest.getExcludeIds();
    const isExcluded = hasContentIdInIds(id, currentExcludeIds);
    if (included && !isExcluded) {
        return;
    }
    if (!included && isExcluded) {
        return;
    }

    const nextExcludeIds = included
                           ? currentExcludeIds.filter(item => !item.equals(id))
                           : uniqueIds([...currentExcludeIds, id]);

    $issueDialogDetails.setKey('itemsUpdating', true);

    const nextPublishRequest = PublishRequest
        .create(publishRequest)
        .setExcludeIds(nextExcludeIds)
        .build();

    await updateIssueWithPublishRequest({
        issueId,
        issue,
        dialogState,
        issueWithAssignees,
        nextPublishRequest,
    });
};

export const openDeleteCommentConfirmation = (commentId: string): void => {
    $deleteCommentConfirmation.set({open: true, commentId});
};

export const closeDeleteCommentConfirmation = (): void => {
    $deleteCommentConfirmation.set({open: false, commentId: undefined});
};

export const isDeleteCommentConfirmationOpen = (): boolean => {
    return $deleteCommentConfirmation.get().open;
};

//
// * Internal
//

type IssueDetailsUpdatingKey = 'statusUpdating' | 'assigneesUpdating' | 'itemsUpdating' | 'titleUpdating';

type IssueDialogState = ReturnType<typeof $issueDialog.get>;

type IssueContext = {
    issueId: string;
    dialogState: IssueDialogState;
    issueWithAssignees?: IssueWithAssignees;
    issue: Issue;
};

type IssueAssignees = ReturnType<IssueWithAssignees['getAssignees']>;

let dependenciesRequestId = 0;

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
        .map(entry => entry.item);
}

const getIssueContext = (updatingKey?: IssueDetailsUpdatingKey): IssueContext | null => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId || (updatingKey && state[updatingKey])) {
        return null;
    }

    const dialogState = $issueDialog.get();
    const issueWithAssignees = dialogState.issues.find(item => item.getIssue().getId() === issueId);
    const issue = issueWithAssignees?.getIssue() ?? state.issue;

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

const applyUpdatedIssue = (
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
    $issueDialogDetails.set({
        ...latestState,
        issue: updatedIssue,
        ...detailsUpdates,
    });
};

const updateIssueWithPublishRequest = async ({
    issueId,
    issue,
    dialogState,
    issueWithAssignees,
    nextPublishRequest,
}: {
    issueId: string;
    issue: Issue;
    dialogState: IssueDialogState;
    issueWithAssignees?: IssueWithAssignees;
    nextPublishRequest: PublishRequest;
}): Promise<void> => {
    try {
        const updatedIssue = await new UpdateIssueRequest(issueId)
            .setTitle(issue.getTitle())
            .setDescription(issue.getDescription())
            .setIssueStatus(issue.getIssueStatus())
            .setApprovers(issue.getApprovers())
            .setPublishRequest(nextPublishRequest)
            .sendAndParse();

        applyUpdatedIssue(updatedIssue, dialogState, issueWithAssignees, {itemsUpdating: false});

        const prefix = updatedIssue.getType() === IssueType.PUBLISH_REQUEST
                       ? 'notify.publishRequest.'
                       : 'notify.issue.';
        showFeedback(i18n(`${prefix}updated`));
        void loadIssueDialogList();
    } catch (error) {
        console.error(error);
        $issueDialogDetails.setKey('itemsUpdating', false);
        showError(error?.message ?? String(error));
    }
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

const resolveIssueType = (
    issueId: string,
    issues: IssueWithAssignees[],
    issue?: Issue,
): IssueType => {
    if (issue && issue.getId() === issueId) {
        return issue.getType();
    }

    return issues.find(item => item.getIssue().getId() === issueId)?.getIssue().getType()
           ?? IssueType.STANDARD;
};

const resetIssueDialogDetails = (issueId?: string): void => {
    const baseState = structuredClone(initialState);
    dependenciesRequestId += 1;
    $issueDialogDetails.set({
        ...baseState,
        issueId,
        detailsTab: resolveDefaultDetailsTab(issueId),
    });
    $deleteCommentConfirmation.set({open: false, commentId: undefined});
};

$issueDialog.subscribe(({open, view, issueId}) => {
    if (!open || view !== 'details') {
        const state = $issueDialogDetails.get();
        if (
            state.issueId ||
            state.issue ||
            state.issueLoading ||
            state.issueError ||
            state.commentText ||
            state.comments.length > 0
        ) {
            resetIssueDialogDetails();
        }
        return;
    }

    const detailsState = $issueDialogDetails.get();
    if (issueId && issueId !== detailsState.issueId) {
        resetIssueDialogDetails(issueId);
    }
});
