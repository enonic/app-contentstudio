import {type IssueWithAssignees} from '../IssueWithAssignees';
import {type ResultMetadata} from '../../resource/ResultMetadata';

export class IssueResponse {

    private readonly issues: IssueWithAssignees[];

    private readonly metadata: ResultMetadata;

    constructor(issues: IssueWithAssignees[], metadata: ResultMetadata) {
        this.issues = issues;
        this.metadata = metadata;
    }

    getIssues(): IssueWithAssignees[] {
        return this.issues;
    }

    getMetadata(): ResultMetadata {
        return this.metadata;
    }
}
