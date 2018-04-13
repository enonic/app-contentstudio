import DivEl = api.dom.DivEl;
import User = api.security.User;
import SpanEl = api.dom.SpanEl;
import {Issue} from '../Issue';
import {IssueStatusSelector} from './IssueStatusSelector';
import {IssueStatusInfoGenerator} from './IssueStatusInfoGenerator';
import {IssueStatus} from '../IssueStatus';

export class DetailsDialogSubTitle
    extends DivEl {

    private issue: Issue;
    private currentUser: User;
    private issueStatusChangedListeners: { (event: api.ValueChangedEvent): void }[] = [];
    private issueStatusSelector: IssueStatusSelector;
    private statusSpan: api.dom.SpanEl;

    constructor(issue: Issue, currentUser: User) {
        super('issue-details-sub-title');
        this.issue = issue;
        this.currentUser = currentUser;
    }

    setIssue(issue: Issue, silent?: boolean) {
        if (this.issueStatusSelector) {
            this.setStatus(issue.getIssueStatus(), silent);
        }
        if (this.statusSpan) {
            this.statusSpan.setHtml(this.makeStatusInfo(issue), false);
        }
        this.issue = issue;
    }

    setStatus(status: IssueStatus, silent?: boolean) {
        this.issueStatusSelector.setValue(status, silent);
    }

    doRender(): wemQ.Promise<boolean> {

        return super.doRender().then(() => {
            this.issueStatusSelector = new IssueStatusSelector();
            this.issueStatusSelector.onValueChanged((event) => {
                this.notifyIssueStatusChanged(event);
            });
            this.statusSpan = new SpanEl('status-info');
            this.appendChildren<api.dom.Element>(this.issueStatusSelector, this.statusSpan);
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

    private makeStatusInfo(issue: Issue): string {
        return issue ? IssueStatusInfoGenerator.create().setIssue(issue).setIssueStatus(issue.getIssueStatus()).setCurrentUser(
            this.currentUser).generate() : '';
    }
}
