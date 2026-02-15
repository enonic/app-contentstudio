import {type PublishRequestJson} from './PublishRequestJson';
import {type IssueSummaryJson} from './IssueSummaryJson';
import {type IssueCommentJson} from './IssueCommentJson';

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
