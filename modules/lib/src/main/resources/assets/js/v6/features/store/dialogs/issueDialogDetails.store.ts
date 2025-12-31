import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {showError, showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {map} from 'nanostores';
import {IssueStatus} from '../../../../app/issue/IssueStatus';
import {IssueType} from '../../../../app/issue/IssueType';
import {CreateIssueCommentRequest} from '../../../../app/issue/resource/CreateIssueCommentRequest';
import {ListIssueCommentsRequest} from '../../../../app/issue/resource/ListIssueCommentsRequest';
import {UpdateIssueRequest} from '../../../../app/issue/resource/UpdateIssueRequest';
import {$issueDialog, loadIssueDialogList} from './issueDialog.store';

import {IssueWithAssignees} from '../../../../app/issue/IssueWithAssignees';
import type {IssueComment} from '../../../../app/issue/IssueComment';
import type {IssueDialogDetailsTab} from '../../shared/dialogs/issue/issueDialog.types';

//
// * Store state
//

type IssueDialogDetailsStore = {
    issueId?: string;
    detailsTab: IssueDialogDetailsTab;
    commentsLoading: boolean;
    commentsError: boolean;
    commentsIssueId?: string;
    comments: IssueComment[];
    commentText: string;
    commentSubmitting: boolean;
    statusUpdating: boolean;
};

const initialState: IssueDialogDetailsStore = {
    issueId: undefined,
    detailsTab: 'comments',
    commentsLoading: false,
    commentsError: false,
    commentsIssueId: undefined,
    comments: [],
    commentText: '',
    commentSubmitting: false,
    statusUpdating: false,
};

export const $issueDialogDetails = map<IssueDialogDetailsStore>(structuredClone(initialState));

//
// * Public API
//

export const setIssueDialogDetailsTab = (detailsTab: IssueDialogDetailsTab): void => {
    $issueDialogDetails.setKey('detailsTab', detailsTab);
};

export const setIssueDialogCommentText = (commentText: string): void => {
    $issueDialogDetails.setKey('commentText', commentText);
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
    const issueType = resolveIssueType(issueId, dialogState.issues);

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

export const updateIssueDialogStatus = async (nextStatus: IssueStatus): Promise<void> => {
    const state = $issueDialogDetails.get();
    const issueId = state.issueId;

    if (!issueId || state.statusUpdating) {
        return;
    }

    const dialogState = $issueDialog.get();
    const issueWithAssignees = dialogState.issues.find(item => item.getIssue().getId() === issueId);
    const issue = issueWithAssignees?.getIssue();

    if (!issue) {
        return;
    }

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

        const updatedIssues = dialogState.issues.map((item) => {
            if (item.getIssue().getId() !== updatedIssue.getId()) {
                return item;
            }
            return new IssueWithAssignees(updatedIssue, item.getAssignees());
        });

        $issueDialog.set({
            ...dialogState,
            issues: updatedIssues,
        });
        $issueDialogDetails.setKey('statusUpdating', false);

        void loadIssueDialogList();
        showFeedback(i18n(getStatusMessageKey(issue.getType(), nextStatus)));
    } catch (error) {
        console.error(error);
        $issueDialogDetails.setKey('statusUpdating', false);
        showError(error?.message ?? String(error));
    }
};

//
// * Internal
//

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

const resolveIssueType = (issueId: string, issues: IssueWithAssignees[]): IssueType => {
    return issues.find(item => item.getIssue().getId() === issueId)?.getIssue().getType()
        ?? IssueType.STANDARD;
};

const resetIssueDialogDetails = (issueId?: string): void => {
    $issueDialogDetails.set({
        ...structuredClone(initialState),
        issueId,
    });
};

$issueDialog.subscribe(({open, view, issueId}) => {
    if (!open || view !== 'details') {
        const state = $issueDialogDetails.get();
        if (state.issueId || state.commentText || state.comments.length > 0) {
            resetIssueDialogDetails();
        }
        return;
    }

    const detailsState = $issueDialogDetails.get();
    if (issueId && issueId !== detailsState.issueId) {
        resetIssueDialogDetails(issueId);
    }
});
