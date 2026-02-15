import {Issue} from './Issue';
import {type IssueWithAssigneesJson} from './json/IssueWithAssigneesJson';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';

export class IssueWithAssignees {

    private issue: Issue;

    private assignees: Principal[];

    constructor(issue: Issue, assignees?: Principal[]) {
        this.issue = issue;
        this.assignees = assignees;
    }

    getIssue(): Issue {
        return this.issue;
    }

    getAssignees(): Principal[] {
        return this.assignees;
    }

    static fromJson(json: IssueWithAssigneesJson): IssueWithAssignees {
        const issue: Issue = Issue.fromJson(json.issue);
        const assignees: Principal[] = json.assignees ? json.assignees.map(assignee => Principal.fromJson(assignee)) : null;

        return new IssueWithAssignees(issue, assignees);
    }
}
