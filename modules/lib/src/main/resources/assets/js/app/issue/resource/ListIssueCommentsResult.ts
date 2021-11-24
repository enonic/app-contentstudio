import {ResultMetadataJson} from '../../resource/json/ResultMetadataJson';
import {IssueCommentJson} from '../json/IssueCommentJson';

export interface ListIssueCommentsResult {

    issueComments: IssueCommentJson[];

    metadata: ResultMetadataJson;
}
