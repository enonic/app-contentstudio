import {PublishRequestJson} from './PublishRequestJson';
import {IssueSummaryJson} from './IssueSummaryJson';
import {IssueCommentJson} from './IssueCommentJson';

export interface IssueJson
    extends IssueSummaryJson {

    approverIds: string[];

    publishRequest: PublishRequestJson;

    comments: IssueCommentJson[];

    publishSchedule: {
        from: string,
        to: string
    };
}
