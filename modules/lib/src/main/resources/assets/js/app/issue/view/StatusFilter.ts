import Q from 'q';
import {IssueStatus} from '../IssueStatus';
import {StatusFilterButton} from './StatusFilterButton';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';

export class StatusFilter
    extends DivEl {

    private showOpenIssuesButton: StatusFilterButton;

    private showClosedIssuesButton: StatusFilterButton;

    private currentStatus: IssueStatus;

    private statusChangedListeners: ((status: IssueStatus) => void)[];

    constructor() {
        super('status-filter');

        this.initStatusButtons();
        this.initListeners();
        this.currentStatus = IssueStatus.OPEN;
        this.statusChangedListeners = [];
    }

    private initStatusButtons() {
        this.showOpenIssuesButton = new StatusFilterButton(i18n('field.issue.status.open'));
        this.showClosedIssuesButton = new StatusFilterButton(i18n('field.issue.status.closed'));
    }

    private initListeners() {
        this.showOpenIssuesButton.onClicked(() => this.handleStatusChanged(IssueStatus.OPEN));
        this.showClosedIssuesButton.onClicked(() => this.handleStatusChanged(IssueStatus.CLOSED));
    }

    private handleStatusChanged(status: IssueStatus) {
        if (status === this.currentStatus) {
            return;
        }

        this.currentStatus = status;
        this.showOpenIssuesButton.toggleClass('active', status === IssueStatus.OPEN);
        this.showClosedIssuesButton.toggleClass('active', status === IssueStatus.CLOSED);

        this.notifyStatusChanged(status);
    }

    updateStatusButtons(open: number, closed: number) {
        this.showOpenIssuesButton.updateByTotal(open);
        this.showClosedIssuesButton.updateByTotal(closed);

        this.showOpenIssuesButton.toggleClass('active', this.currentStatus === IssueStatus.OPEN && open > 0);
        this.showClosedIssuesButton.toggleClass('active', this.currentStatus === IssueStatus.CLOSED && closed > 0);
    }

    getStatus(): IssueStatus {
        return this.currentStatus;
    }

    setStatus(value: IssueStatus) {
        this.currentStatus = value;
    }

    onStatusChanged(handler: (status: IssueStatus) => void) {
        this.statusChangedListeners.push(handler);
    }

    unStatusChanged(handler: (status: IssueStatus) => void) {
        this.statusChangedListeners = this.statusChangedListeners.filter((curr) => {
            return curr !== handler;
        });
    }

    private notifyStatusChanged(status: IssueStatus) {
        this.statusChangedListeners.forEach((listener) => {
            listener(status);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.showOpenIssuesButton.addClass('status-button open');
            this.showClosedIssuesButton.addClass('status-button closed');
            this.appendChildren(this.showOpenIssuesButton, this.showClosedIssuesButton);

            return rendered;
        });
    }
}
