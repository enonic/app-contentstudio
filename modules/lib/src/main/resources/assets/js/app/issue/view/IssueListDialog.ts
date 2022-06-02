import * as Q from 'q';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from '@enonic/lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {IssuesCount, IssuesPanel} from './IssuesPanel';
import {Issue} from '../Issue';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {GetIssueStatsRequest} from '../resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssueType} from '../IssueType';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {ProjectContext} from '../../project/ProjectContext';

export class IssueListDialog
    extends ModalDialogWithConfirmation {

    private static INSTANCE: IssueListDialog;

    private issuesPanel: IssuesPanel;

    private currentUser: Principal;

    private createAction: Action;

    private skipInitialLoad: boolean = false;

    private reloadRequired: boolean = false;

    private issueSelectedListeners: { (issue: Issue): void }[] = [];

    private constructor() {
        super(<ModalDialogWithConfirmationConfig>{
            title: i18n('field.issues'),
            class: 'issue-dialog issue-list-dialog grey-header',
            confirmation: {}
        });

        this.getBody().addClass('mask-wrapper');
    }

    public static get(): IssueListDialog {
        if (!IssueListDialog.INSTANCE) {
            IssueListDialog.INSTANCE = new IssueListDialog();
        }
        return IssueListDialog.INSTANCE;
    }

    private loadCurrentUser() {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
        });
    }

    protected initElements() {
        super.initElements();

        this.issuesPanel = this.createIssuePanel();
        this.createAction = new Action(i18n('action.newTask'));
        this.loadCurrentUser();
    }

    protected initListeners() {
        super.initListeners();
        this.handleIssueGlobalEvents();
        ProjectContext.get().onProjectChanged(() => {
            this.reloadRequired = true;
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getButtonRow().addAction(this.createAction, true);
            this.appendChildToContentPanel(this.issuesPanel);

            return rendered;
        });
    }

    show() {
        Body.get().appendChild(this);
        super.show();
        if (!this.skipInitialLoad || this.reloadRequired) {
            this.reload();
        } else {
            this.updateTabAndFiltersLabels().catch(DefaultErrorHandler.handle);
        }
    }

    close() {
        super.close();
        this.issuesPanel.resetFilters();
        this.remove();
    }

    open(assignedToMe: boolean = false) {

        if (assignedToMe) {
            this.skipInitialLoad = true;
        }

        super.open();

        this.skipInitialLoad = false;

        if (assignedToMe) {
            this.issuesPanel.selectAssignedToMe();
        }
    }

    unmask(): void {
        super.unmask();

        if (this.reloadRequired) {
            this.reload();
        }
    }

    private reload(updatedIssues?: Issue[]) {
        this.showLoadMask();
        this.issuesPanel.reload()
            .then(() => {
                return this.updateTabAndFiltersLabels();
            })
            .then(() => {
                if (this.isNotificationToBeShown(updatedIssues)) {
                    NotifyManager.get().showFeedback(i18n('notify.issue.listUpdated'));
                }
            })
            .catch(DefaultErrorHandler.handle)
            .finally(() => {
                this.hideLoadMask();
                this.reloadRequired = false;
            })
            .done();
    }

    private handleIssueGlobalEvents() {

        const debouncedReload = AppHelper.runOnceAndDebounce((issues?: Issue[]) => {
            this.reload(issues);
        }, 3000);

        const createUpdateHandler = (issues: Issue[]) => {
            if (this.isActive()) {
                debouncedReload(issues);
            } else if (this.isOpen()) {
                this.reloadRequired = true;
            }
        };

        IssueServerEventsHandler.getInstance().onIssueCreated(createUpdateHandler);
        IssueServerEventsHandler.getInstance().onIssueUpdated(createUpdateHandler);
    }

    private isNotificationToBeShown(issues?: Issue[]): boolean {
        if (!issues) {
            return false;
        }

        if (issues[0].getModifier()) {
            return !this.isIssueModifiedByCurrentUser(issues[0]);
        }

        return !this.isIssueCreatedByCurrentUser(issues[0]);
    }

    private isIssueModifiedByCurrentUser(issue: Issue): boolean {
        return issue.getModifier() === this.currentUser.getKey().toString();
    }

    private isIssueCreatedByCurrentUser(issue: Issue): boolean {
        if (!issue.getCreator()) {
            return false;
        }

        return issue.getCreator() === this.currentUser.getKey().toString();
    }

    private updateTabAndFiltersLabels(): Q.Promise<void> {
        return Q.all([
            new GetIssueStatsRequest().sendAndParse(),
            new GetIssueStatsRequest(IssueType.PUBLISH_REQUEST).sendAndParse(),
            new GetIssueStatsRequest(IssueType.STANDARD).sendAndParse()
        ]).then((results: IssueStatsJson[]) => {
            return this.updatePanelIssuesCount(results);
        });
    }

    private updatePanelIssuesCount(stats: IssueStatsJson[]): Q.Promise<void> {
        const openedIssues = IssueListDialog.createOpenedIssues(stats);
        const closedIssues = IssueListDialog.createClosedIssues(stats);
        return this.issuesPanel.updateIssuesCount(openedIssues, closedIssues);
    }

    private static createOpenedIssues(stats: IssueStatsJson[]): IssuesCount {
        return {
            all: stats[0].open,
            assignedToMe: stats[0].openAssignedToMe,
            assignedByMe: stats[0].openCreatedByMe,
            publishRequests: stats[1].open,
            tasks: stats[2].open
        };
    }

    private static createClosedIssues(stats: IssueStatsJson[]): IssuesCount {
        return {
            all: stats[0].closed,
            assignedToMe: stats[0].closedAssignedToMe,
            assignedByMe: stats[0].closedCreatedByMe,
            publishRequests: stats[1].closed,
            tasks: stats[2].closed
        };
    }

    onCreateButtonClicked(listener: (action: Action) => void) {
        return this.createAction.onExecuted(listener);
    }

    private createIssuePanel(): IssuesPanel {
        const issuePanel: IssuesPanel = new IssuesPanel();
        issuePanel.setDoOffset(false);
        issuePanel.setLoadMask(this.loadMask);

        issuePanel.onIssueSelected(issue => this.notifyIssueSelected(issue.getIssue()));

        return issuePanel;
    }

    private notifyIssueSelected(issue: Issue) {
        this.issueSelectedListeners.forEach(listener => listener(issue));
    }

    public onIssueSelected(listener: (issue: Issue) => void) {
        this.issueSelectedListeners.push(listener);
    }

    public unIssueSelected(listener: (issue: Issue) => void) {
        this.issueSelectedListeners = this.issueSelectedListeners.filter(curr => curr !== listener);
    }
}
