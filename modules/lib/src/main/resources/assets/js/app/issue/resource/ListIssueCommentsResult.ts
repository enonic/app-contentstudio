import {IssueMetadata} from '../IssueMetadata';
import {IssueCommentJson} from '../json/IssueCommentJson';

export interface ListIssueCommentsResult {

    issueComments: IssueCommentJson[];

    metadata: IssueMetadata;
}
