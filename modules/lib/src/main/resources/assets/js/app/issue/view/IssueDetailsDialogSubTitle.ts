import Q from 'q';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {Issue} from '../Issue';
import {IssueStatusSelector} from './IssueStatusSelector';
import {IssueStatusInfoGenerator} from './IssueStatusInfoGenerator';
import {IssueStatus} from '../IssueStatus';
import {IssueTypeFormatter} from '../IssueType';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';

export class IssueDetailsDialogSubTitle
    extends DivEl {

    private issue: Issue;

    private currentUser: Principal;

    private issueStatusSelector: IssueStatusSelector;

    private issueStatusChangedListeners: ((event: ValueChangedEvent) => void)[] = [];

    constructor(issue: Issue) {
        super('issue-details-sub-title');
        this.issue = issue;
        this.issueStatusSelector = new IssueStatusSelector();
    }

    setIssue(issue: Issue, silent?: boolean) {
        this.issue = issue;

        this.setStatus(issue.getIssueStatus(), silent);
        this.updateStatusInfo();
        this.updateTypeClass();
    }

    private updateStatusInfo() {
        this.issueStatusSelector.getEl().setTitle(this.makeStatusInfo());
    }

    private updateTypeClass() {
        this.issueStatusSelector.removeClass('standard publish-request');
        this.issueStatusSelector.addClass(this.makeTypeClass());
    }

    setUser(user: Principal) {
        this.currentUser = user;
        this.updateStatusInfo();
    }

    setStatus(status: IssueStatus, silent?: boolean) {
        this.issueStatusSelector.setValue(status, silent);
    }

    getStatus(): IssueStatus {
        return this.issueStatusSelector.getValue();
    }

    doRender(): Q.Promise<boolean> {

        return super.doRender().then(() => {
            this.issueStatusSelector.onValueChanged((event) => {
                this.notifyIssueStatusChanged(event);
            });
            this.appendChild<Element>(this.issueStatusSelector);
            if (this.issue) {
                this.setIssue(this.issue, true);
            }
            return Q(true);
        });
    }

    onIssueStatusChanged(listener: (event: ValueChangedEvent) => void) {
        this.issueStatusChangedListeners.push(listener);
    }

    unIssueStatusChanged(listener: (event: ValueChangedEvent) => void) {
        this.issueStatusChangedListeners = this.issueStatusChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyIssueStatusChanged(event: ValueChangedEvent) {
        this.issueStatusChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

    private makeStatusInfo(): string {
        return this.issue ? IssueStatusInfoGenerator.create().setIssue(this.issue).setIssueStatus(
            this.issue.getIssueStatus()).setCurrentUser(this.currentUser).generate() : '';
    }

    private makeTypeClass(): string {
        return this.issue ? IssueTypeFormatter.parseTypeName(this.issue.getType()) : '';
    }
}
