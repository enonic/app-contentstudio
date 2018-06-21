import ActionButton = api.ui.button.ActionButton;
import {ShowIssuesDialogAction} from '../../browse/action/ShowIssuesDialogAction';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueResponse} from '../resource/IssueResponse';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueStatus} from '../IssueStatus';
import i18n = api.util.i18n;

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

        this.fetchIssueList(this.resetIssueRequest().setAssignedToMe(true))
            .then(hits => {
                this.setLabel(i18n('field.assignedToMe'));
                this.addClass('has-assigned-issues');
                this.getEl().setTitle(i18n('text.youhaveissues'));
                this.setIssueCount(hits);
                this.getAction().setAssignedToMe(true);
            })
            .fail(() =>
                this.fetchIssueList(this.resetIssueRequest().setCreatedByMe(true))
                    .then(hits => {
                        this.setLabel(i18n('field.myIssues'));
                        this.addClass('has-issues');
                        this.setIssueCount(hits);
                        this.getAction().setCreatedByMe(true);
                    })
                    .fail(() =>
                        this.fetchIssueList(this.resetIssueRequest())
                            .then(hits => {
                                this.setLabel(i18n('field.openIssues') + ` (${hits})`);
                            })
                            .fail(() => {
                                this.setLabel(i18n('field.noOpenIssues'));
                            })
                    )
            );
    }

    private fetchIssueList(listIssueRequest: ListIssuesRequest): wemQ.Promise<number> {
        const deferred = wemQ.defer<number>();
        listIssueRequest.sendAndParse().then(
            (response: IssueResponse) => {
                const hitsCount = response.getMetadata().getTotalHits();

                (hitsCount > 0) ? deferred.resolve(hitsCount) : deferred.reject(0);
            }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        });

        return deferred.promise;
    }

}
