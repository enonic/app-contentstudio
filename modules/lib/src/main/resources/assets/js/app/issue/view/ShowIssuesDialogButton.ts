import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {SpanEl} from '@enonic/lib-admin-ui/dom/SpanEl';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {AriaHasPopup, WCAG} from '@enonic/lib-admin-ui/ui/WCAG';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ShowIssuesDialogAction} from '../../browse/action/ShowIssuesDialogAction';
import {ProjectContext} from '../../project/ProjectContext';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueStatus} from '../IssueStatus';
import {IssueResponse} from '../resource/IssueResponse';
import {ListIssuesRequest} from '../resource/ListIssuesRequest';

export class ShowIssuesDialogButton
    extends ActionButton
    implements WCAG {

    [WCAG]: boolean = true;
    ariaHasPopup: AriaHasPopup = AriaHasPopup.DIALOG;
    tabbable: boolean = true;

    private countSpan: SpanEl;

    private readonly updateHandler: () => void;

    constructor() {
        super(new ShowIssuesDialogAction());

        this.addClass('show-issues-dialog-button icon-signup');

        this.updateHandler = AppHelper.debounce(() => {
            this.fetchIssuesAndCreateLink();
        }, 200);

        this.updateHandler();
        this.initEventsListeners();
    }

    getAction(): ShowIssuesDialogAction {
        return super.getAction() as ShowIssuesDialogAction;
    }

    private initEventsListeners() {
        IssueServerEventsHandler.getInstance().onIssueCreated(this.updateHandler);
        IssueServerEventsHandler.getInstance().onIssueUpdated(this.updateHandler);
        ProjectContext.get().onProjectChanged(this.updateHandler);
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
