import {type Issue} from '../Issue';
import {IssueStatus} from '../IssueStatus';
import {DateHelper} from '@enonic/lib-admin-ui/util/DateHelper';
import {type Principal} from '@enonic/lib-admin-ui/security/Principal';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class IssueStatusInfoGenerator {

    private issue: Issue;

    private issueStatus: IssueStatus;

    private currentUser: Principal;

    private constructor() { /* empty */
    }

    public static create(): IssueStatusInfoGenerator {
        return new IssueStatusInfoGenerator();
    }

    public setIssue(issue: Issue): IssueStatusInfoGenerator {
        this.issue = issue;
        return this;
    }

    public setIssueStatus(issueStatus: IssueStatus): IssueStatusInfoGenerator {
        this.issueStatus = issueStatus;
        return this;
    }

    public setCurrentUser(currentUser: Principal): IssueStatusInfoGenerator {
        this.currentUser = currentUser;
        return this;
    }

    public generate(): string {
        let textKey;
        if (this.issueStatus === IssueStatus.CLOSED) {
            textKey = 'field.issue.closed';
        } else if (this.issue.getModifier()) {
            textKey = 'field.issue.updated';
        } else {
            textKey = 'field.issue.opened';
        }

        return i18n(textKey, this.getModifiedBy(), this.getModifiedDate());
    }

    private getModifiedDate(): string {
        return DateHelper.getModifiedString(this.issue.getModifiedTime());
    }

    private getModifiedBy(): string {
        const lastModifiedBy: string = this.issue.getModifier() ? this.issue.getModifier() : this.issue.getCreator();

        if (this.currentUser && (lastModifiedBy === this.currentUser.getKey().toString())) {
            return i18n('field.me');
        }

        return lastModifiedBy;
    }

}
