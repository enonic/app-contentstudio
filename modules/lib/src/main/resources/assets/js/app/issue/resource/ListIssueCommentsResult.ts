import { type ResultMetadataJson } from '../../../v6/shared/api/ResultMetadataJson';
import { type IssueCommentJson } from '../../../v6/entities/issue/api/IssueCommentJson';

export interface ListIssueCommentsResult {
    issueComments: IssueCommentJson[];

    metadata: ResultMetadataJson;
}
