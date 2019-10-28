import DivEl = api.dom.DivEl;
import Principal = api.security.Principal;
import {Issue} from '../Issue';
import {IssueStatusSelector} from './IssueStatusSelector';
import {IssueStatusInfoGenerator} from './IssueStatusInfoGenerator';
import {IssueStatus} from '../IssueStatus';
import {IssueTypeFormatter} from '../IssueType';

export class IssueDetailsDialogSubTitle
    extends DivEl {

    private issue: Issue;

    private currentUser: Principal;

    private issueStatusSelector: IssueStatusSelector;

    private issueStatusChangedListeners: { (event: api.ValueChangedEvent): void }[] = [];

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

    doRender(): wemQ.Promise<boolean> {

        return super.doRender().then(() => {
            this.issueStatusSelector.onValueChanged((event) => {
                this.notifyIssueStatusChanged(event);
            });
            this.appendChild<api.dom.Element>(this.issueStatusSelector);
            if (this.issue) {
                this.setIssue(this.issue, true);
            }
            return wemQ(true);
        });
    }

    onIssueStatusChanged(listener: (event: api.ValueChangedEvent) => void) {
        this.issueStatusChangedListeners.push(listener);
    }

    unIssueStatusChanged(listener: (event: api.ValueChangedEvent) => void) {
        this.issueStatusChangedListeners = this.issueStatusChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyIssueStatusChanged(event: api.ValueChangedEvent) {
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
