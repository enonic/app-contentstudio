import {IssueComment} from '../IssueComment';
import {ResultMetadata} from '../../resource/ResultMetadata';

export class ListIssueCommentsResponse {

    private readonly issueComments: IssueComment[];

    private readonly metadata: ResultMetadata;

    constructor(issues: IssueComment[], metadata: ResultMetadata) {
        this.issueComments = issues;
        this.metadata = metadata;
    }

    getIssueComments(): IssueComment[] {
        return this.issueComments;
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }
}
