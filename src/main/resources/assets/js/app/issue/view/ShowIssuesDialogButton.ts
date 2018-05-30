import ActionButton = api.ui.button.ActionButton;
import {ShowIssuesDialogAction} from '../../browse/action/ShowIssuesDialogAction';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueResponse} from '../resource/IssueResponse';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueStatus} from '../IssueStatus';
import i18n = api.util.i18n;

export class ShowIssuesDialogButton extends ActionButton {

    constructor() {
        super(new ShowIssuesDialogAction());

        this.addClass('show-issues-dialog-button');

        this.getEl().setTitle(i18n('text.publishingissues'));

        this.fetchIssuesAndCreateLink();

        this.initEventsListeners();
    }

    private initEventsListeners() {
        IssueServerEventsHandler.getInstance().onIssueCreated(() => {
            //this.updateShowIssuesDialogButton();
        });

        IssueServerEventsHandler.getInstance().onIssueUpdated(() => {
            //this.updateShowIssuesDialogButton();
        });
    }

    private resetIssueRequest(): ListIssuesRequest {
        return new ListIssuesRequest().setIssueStatus(IssueStatus.OPEN).setSize(0);
    }

    private fetchIssuesAndCreateLink() {
        this.fetchIssueList(this.resetIssueRequest().setAssignedToMe(true))
            .then(hits => {
                this.setLabel(i18n('field.assignedToMe') + ` (${hits})`);
                this.addClass('has-assigned-issues');
                this.getEl().setTitle(i18n('text.youhaveissues'));
            })
            .fail(() =>
                this.fetchIssueList(this.resetIssueRequest().setCreatedByMe(true))
                    .then(hits => {
                        this.setLabel(i18n('field.myIssues') + ` (${hits})`);
                    })
                    .fail(() =>
                        this.fetchIssueList(this.resetIssueRequest())
                            .then(hits => {
                                this.setLabel(i18n('field.openIssues') + ` (${hits})`);
                            })
                            .fail(() => {
                                console.log('Nothing found');
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
