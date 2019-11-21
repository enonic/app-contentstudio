import ActionButton = api.ui.button.ActionButton;
import i18n = api.util.i18n;
import {ShowIssuesDialogAction} from '../../browse/action/ShowIssuesDialogAction';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueResponse} from '../resource/IssueResponse';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueStatus} from '../IssueStatus';

export class ShowIssuesDialogButton extends ActionButton {

    private countSpan: api.dom.SpanEl;

    constructor() {
        super(new ShowIssuesDialogAction());

        this.addClass('show-issues-dialog-button');

        this.fetchIssuesAndCreateLink();

        this.initEventsListeners();
    }

    getAction(): ShowIssuesDialogAction {
        return <ShowIssuesDialogAction>super.getAction();
    }

    private initEventsListeners() {
        IssueServerEventsHandler.getInstance().onIssueCreated(() => {
            this.fetchIssuesAndCreateLink();
        });

        IssueServerEventsHandler.getInstance().onIssueUpdated(() => {
            this.fetchIssuesAndCreateLink();
        });
    }

    private setIssueCount(count: number) {

        if (!this.countSpan) {
            this.countSpan = new api.dom.SpanEl('issue-count');
            this.appendChild(this.countSpan);
        }

        this.countSpan.setHtml('' + count);
    }

    private resetIssueRequest(): ListIssuesRequest {
        return new ListIssuesRequest().setIssueStatus(IssueStatus.OPEN).setSize(0);
    }

    private resetButton() {
        this.getEl().setTitle(i18n('text.publishingissues'));
        this.removeClass('has-assigned-issues has-issues');
        this.setLabel('');
        this.getAction().setAssignedToMe(false).setCreatedByMe(false);
    }

    private fetchIssuesAndCreateLink() {
        this.resetButton();

        this.fetchNumberOfOpenIssuesAssignedToMe().then((totalAssignedToMe: number) => {
            if (totalAssignedToMe > 0) {
                this.showAssignedToMeIssues(totalAssignedToMe);
            } else {
                this.fetchNumberOfOpenIssues().then((totalOpenIssues: number) => {
                    if (totalOpenIssues > 0) {
                        this.setLabel(i18n('field.openIssues') + ` (${totalOpenIssues})`);
                    } else {
                        this.setLabel(i18n('field.noOpenIssues'));
                    }
                }).catch(api.DefaultErrorHandler.handle);
            }

        }).catch(api.DefaultErrorHandler.handle);
    }

    private fetchNumberOfOpenIssuesAssignedToMe(): wemQ.Promise<number> {
        return this.fetchIssueList(this.resetIssueRequest().setAssignedToMe(true));
    }

    private fetchIssueList(listIssueRequest: ListIssuesRequest): wemQ.Promise<number> {
        return listIssueRequest.sendAndParse().then((response: IssueResponse) => response.getMetadata().getTotalHits());
    }

    private fetchNumberOfOpenIssues(): wemQ.Promise<number> {
        return this.fetchIssueList(this.resetIssueRequest());
    }

    private showAssignedToMeIssues(issuesCount: number) {
        this.setLabel(i18n('field.assignedToMe'));
        this.addClass('has-assigned-issues');
        this.getEl().setTitle(i18n('text.youhaveissues'));
        this.setIssueCount(issuesCount);
        this.getAction().setAssignedToMe(true);
    }
}
