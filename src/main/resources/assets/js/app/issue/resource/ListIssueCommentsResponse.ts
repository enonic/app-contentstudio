import {IssueMetadata} from '../IssueMetadata';
import {IssueComment} from '../IssueComment';

export class ListIssueCommentsResponse {

    private issueComments: IssueComment[];

    private metadata: IssueMetadata;

    constructor(issues: IssueComment[], metadata: IssueMetadata) {
        this.issueComments = issues;
        this.metadata = metadata;
    }

    getIssueComments(): IssueComment[] {
        return this.issueComments;
    }

    getMetadata(): IssueMetadata {
        return this.metadata;
    }
}
