import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ActionButton} from 'lib-admin-ui/ui/button/ActionButton';
import {ShowIssuesDialogAction} from '../../browse/action/ShowIssuesDialogAction';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueResponse} from '../resource/IssueResponse';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';
import {IssueStatus} from '../IssueStatus';
import {SpanEl} from 'lib-admin-ui/dom/SpanEl';
import {ProjectChangedEvent} from '../../project/ProjectChangedEvent';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ProjectContext} from '../../project/ProjectContext';

export class ShowIssuesDialogButton extends ActionButton {

    private countSpan: SpanEl;

    private updateHandler: () => void;

    constructor() {
        super(new ShowIssuesDialogAction());

        this.addClass('show-issues-dialog-button');

        this.updateHandler = AppHelper.debounce(() => {
            this.fetchIssuesAndCreateLink();
        }, 200);

        this.initEventsListeners();
    }

    getAction(): ShowIssuesDialogAction {
        return <ShowIssuesDialogAction>super.getAction();
    }

    private initEventsListeners() {
        IssueServerEventsHandler.getInstance().onIssueCreated(this.updateHandler);
        IssueServerEventsHandler.getInstance().onIssueUpdated(this.updateHandler);
        ProjectChangedEvent.on(this.updateHandler);
    }

    private setIssueCount(count: number) {

        if (!this.countSpan) {
            this.countSpan = new SpanEl('issue-count');
            this.appendChild(this.countSpan);
        }

        this.countSpan.setHtml('' + count);
    }

    private resetIssueRequest(): ListIssuesRequest {
        return new ListIssuesRequest().setIssueStatus(IssueStatus.OPEN).setSize(0);
    }

    private resetButton() {
        this.removeClass('has-assigned-issues has-issues');
        this.setLabel('');
        this.getAction().setAssignedToMe(false).setCreatedByMe(false);
    }

    private fetchIssuesAndCreateLink() {
        if (ProjectContext.get().isInitialized()) {
            this.doFetchIssuesAndCreateLink();
        } else {
            const projectSetHandler = () => {
                ProjectChangedEvent.un(projectSetHandler);
                this.doFetchIssuesAndCreateLink();
            };

            ProjectChangedEvent.on(projectSetHandler);
        }
    }

    private doFetchIssuesAndCreateLink() {
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
                }).catch(DefaultErrorHandler.handle);
            }

        }).catch(DefaultErrorHandler.handle);
    }

    private fetchNumberOfOpenIssuesAssignedToMe(): Q.Promise<number> {
        return this.fetchIssueList(this.resetIssueRequest().setAssignedToMe(true));
    }

    private fetchIssueList(listIssueRequest: ListIssuesRequest): Q.Promise<number> {
        return listIssueRequest.sendAndParse().then((response: IssueResponse) => response.getMetadata().getTotalHits());
    }

    private fetchNumberOfOpenIssues(): Q.Promise<number> {
        return this.fetchIssueList(this.resetIssueRequest());
    }

    private showAssignedToMeIssues(issuesCount: number) {
        this.setLabel(i18n('field.assignedToMe'));
        this.addClass('has-assigned-issues');
        this.setIssueCount(issuesCount);
        this.getAction().setAssignedToMe(true);
    }
}
