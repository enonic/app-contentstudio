import { type ResultAsync } from 'neverthrow';
import { type PrincipalKey } from '@enonic/lib-admin-ui/security/PrincipalKey';
import { Issue } from '../../../../app/issue/Issue';
import { IssueComment } from '../../../../app/issue/IssueComment';
import { IssueStatus } from '../../../../app/issue/IssueStatus';
import { IssueType } from '../../../../app/issue/IssueType';
import { IssueWithAssignees } from '../../../../app/issue/IssueWithAssignees';
import { type PublishRequest } from '../../../../app/issue/PublishRequest';
import { type IssueCommentJson } from '../../../../app/issue/json/IssueCommentJson';
import { type IssueJson } from '../../../../app/issue/json/IssueJson';
import { type IssueWithAssigneesJson } from '../../../../app/issue/json/IssueWithAssigneesJson';
import { type ResultMetadataJson } from '../../../../app/resource/json/ResultMetadataJson';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsProjectUrl } from '../../../shared/lib/url/cms';

export type ListIssuesParams = {
    from: number;
    size: number;
};

export type ListIssuesResult = {
    issues: IssueWithAssignees[];
    totalHits: number;
};

export type CreateIssueParams = {
    title: string;
    description: string;
    approvers?: PrincipalKey[];
    publishRequest: PublishRequest;
    type?: IssueType;
};

export type UpdateIssueParams = {
    id: string;
    title: string;
    description: string;
    status: IssueStatus;
    approvers?: PrincipalKey[];
    publishRequest?: PublishRequest;
    publishFrom?: Date;
    publishTo?: Date;
};

export type CreateIssueCommentParams = {
    issueId: string;
    text: string;
    creator: PrincipalKey;
};

export type UpdateIssueCommentParams = {
    commentId: string;
    text: string;
};

type ListIssuesResponseJson = {
    issues: IssueWithAssigneesJson[];
    metadata: ResultMetadataJson;
};

type ListIssueCommentsResponseJson = {
    issueComments: IssueCommentJson[];
    metadata: ResultMetadataJson;
};

type DeleteIssueCommentResponseJson = {
    ids: string[];
};

/**
 * List issues with assignees for a page window (project-scoped, non-content endpoint).
 * Used by: features/issues/model/issueDialog.store.
 */
export function listIssues({ from, size }: ListIssuesParams): ResultAsync<ListIssuesResult, AppError> {
    const body = {
        type: null,
        from,
        size,
        assignedToMe: false,
        createdByMe: false,
        resolveAssignees: true,
    };

    return requestJson<ListIssuesResponseJson>(getCmsProjectUrl('issue/list'), { method: 'POST', body }).map(
        (json) => ({
            issues: json.issues.map((issue) => IssueWithAssignees.fromJson(issue)),
            totalHits: json.metadata.totalHits,
        }),
    );
}

/**
 * Create an issue (project-scoped, non-content endpoint).
 * Used by: features/issues/model/newIssueDialog.store.
 */
export function createIssue({
    title,
    description,
    approvers,
    publishRequest,
    type,
}: CreateIssueParams): ResultAsync<Issue, AppError> {
    const body = {
        title,
        description,
        ...(approvers != null && { approvers: approvers.map((key) => key.toString()) }),
        publishRequest: publishRequest.toJson(),
        ...(type != null && { type: IssueType[type] }),
        schedule: null,
    };

    return requestJson<IssueJson>(getCmsProjectUrl('issue/create'), { method: 'POST', body }).map(Issue.fromJson);
}

/**
 * Fetch a single issue by id (project-scoped, non-content endpoint).
 * Used by: features/issues/model/issueDialogDetails.store, issueDialogDetails.service.
 */
export function fetchIssue(issueId: string, projectName?: string): ResultAsync<Issue, AppError> {
    const url = `${getCmsProjectUrl('issue/id', projectName)}?id=${encodeURIComponent(issueId)}`;
    return requestJson<IssueJson>(url).map(Issue.fromJson);
}

/**
 * Update an issue (project-scoped, non-content endpoint).
 * Used by: features/issues/model/issueDialogDetails.store.
 */
export function updateIssue({
    id,
    title,
    description,
    status,
    approvers,
    publishRequest,
    publishFrom,
    publishTo,
}: UpdateIssueParams): ResultAsync<Issue, AppError> {
    const body = {
        id,
        title,
        description,
        status: IssueStatus[status],
        publishSchedule: {
            from: publishFrom?.toISOString() ?? null,
            to: publishTo?.toISOString() ?? null,
        },
        isPublish: false,
        autoSave: false,
        ...(approvers != null && { approvers: approvers.map((key) => key.toString()) }),
        ...(publishRequest != null && { publishRequest: publishRequest.toJson() }),
    };

    return requestJson<IssueJson>(getCmsProjectUrl('issue/update'), { method: 'POST', body }).map(Issue.fromJson);
}

/**
 * List all comments of an issue, sorted by created time ascending.
 * Used by: features/issues/model/issueDialogDetails.store.
 */
export function listIssueComments(issueId: string): ResultAsync<IssueComment[], AppError> {
    const body = { issue: issueId, from: 0, size: 150 };

    return requestJson<ListIssueCommentsResponseJson>(getCmsProjectUrl('issue/comment/list'), {
        method: 'POST',
        body,
    }).map((json) =>
        json.issueComments
            .map(IssueComment.fromJson)
            .sort((a, b) => a.getCreatedTime().getTime() - b.getCreatedTime().getTime()),
    );
}

/**
 * Create a comment on an issue (project-scoped, non-content endpoint).
 * Used by: features/issues/model/issueDialogDetails.store.
 */
export function createIssueComment({
    issueId,
    text,
    creator,
}: CreateIssueCommentParams): ResultAsync<IssueComment, AppError> {
    const body = { issue: issueId, text, creator: creator.toString() };

    return requestJson<IssueCommentJson>(getCmsProjectUrl('issue/comment'), { method: 'POST', body }).map(
        IssueComment.fromJson,
    );
}

/**
 * Update an existing issue comment (project-scoped, non-content endpoint).
 * Used by: features/issues/model/issueDialogDetails.store.
 */
export function updateIssueComment({ commentId, text }: UpdateIssueCommentParams): ResultAsync<IssueComment, AppError> {
    const body = { comment: commentId, text };

    return requestJson<IssueCommentJson>(getCmsProjectUrl('issue/comment/update'), { method: 'POST', body }).map(
        IssueComment.fromJson,
    );
}

/**
 * Delete an issue comment; resolves to whether anything was deleted.
 * Used by: features/issues/model/issueDialogDetails.store.
 */
export function deleteIssueComment(commentId: string): ResultAsync<boolean, AppError> {
    const body = { comment: commentId };

    return requestJson<DeleteIssueCommentResponseJson>(getCmsProjectUrl('issue/comment/delete'), {
        method: 'POST',
        body,
    }).map((json) => json.ids.length > 0);
}
