import {type ResultMetadataJson} from '../../resource/json/ResultMetadataJson';
import {type IssueCommentJson} from '../json/IssueCommentJson';

export interface ListIssueCommentsResult {

    issueComments: IssueCommentJson[];

    metadata: ResultMetadataJson;
}
