import { type PublishRequestJson } from './PublishRequestJson';
import { type IssueSummaryJson } from './IssueSummaryJson';
import { type IssueCommentJson } from '../../../v6/entities/issue/api/IssueCommentJson';

export interface IssueJson extends IssueSummaryJson {
    approverIds: string[];

    publishRequest: PublishRequestJson;

    comments: IssueCommentJson[];

    publishSchedule: {
        from: string;
        to: string;
    };
}
