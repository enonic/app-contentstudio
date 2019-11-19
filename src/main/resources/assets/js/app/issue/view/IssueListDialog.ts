import ModalDialog = api.ui.dialog.ModalDialog;
import Principal = api.security.Principal;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import {IssuesCount, IssuesPanel} from './IssuesPanel';
import {Issue} from '../Issue';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {GetIssueStatsRequest} from '../resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssueType} from '../IssueType';

export class IssueListDialog
    extends ModalDialog {

    private static INSTANCE: IssueListDialog;

    private issuesPanel: IssuesPanel;

    private currentUser: Principal;

    private createAction: api.ui.Action;

    private skipInitialLoad: boolean = false;

    private issueSelectedListeners: { (issue: Issue): void }[] = [];

    private constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('field.issues'),
            class: 'issue-dialog issue-list-dialog grey-header'
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
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
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
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getButtonRow().addAction(this.createAction, true);
            this.appendChildToContentPanel(this.issuesPanel);

            return rendered;
        });
    }

    show() {
        api.dom.Body.get().appendChild(this);
        super.show();
        if (!this.skipInitialLoad) {
            this.reload();
        } else {
            this.updateTabAndFiltersLabels().catch(api.DefaultErrorHandler.handle);
        }
    }

    close() {
        super.close();
        this.issuesPanel.resetFilters();
        this.remove();
    }

    open(assignedToMe: boolean = false, createdByMe: boolean = false) {

        if (assignedToMe || createdByMe) {
            this.skipInitialLoad = true;
        }

        super.open();

        this.skipInitialLoad = false;
        if (assignedToMe) {
            this.issuesPanel.selectAssignedToMe();
        } else if (createdByMe) {
            this.issuesPanel.selectCreatedByMe();
        }
    }

    private reload(updatedIssues?: Issue[]) {
        this.showLoadMask();
        this.issuesPanel.reload()
            .then(() => {
                this.notifyResize();
                return this.updateTabAndFiltersLabels();
            })
            .then(() => {
                if (this.isNotificationToBeShown(updatedIssues)) {
                    api.notify.NotifyManager.get().showFeedback(i18n('notify.issue.listUpdated'));
                }
            })
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => this.hideLoadMask())
            .done();
    }

    private handleIssueGlobalEvents() {

        const debouncedReload = api.util.AppHelper.runOnceAndDebounce((issues?: Issue[]) => {
            this.reload(issues);
        }, 3000);

        IssueServerEventsHandler.getInstance().onIssueCreated((issues: Issue[]) => {
            if (this.isVisible()) {
                debouncedReload(issues);
            }
        });

        IssueServerEventsHandler.getInstance().onIssueUpdated((issues: Issue[]) => {
            if (this.isVisible()) {
                debouncedReload(issues);
            }
        });
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

    protected hasSubDialog(): boolean {
        return this.isMasked();
    }

    private updateTabAndFiltersLabels(): wemQ.Promise<void> {
        return wemQ.all([
            new GetIssueStatsRequest().sendAndParse(),
            new GetIssueStatsRequest(IssueType.PUBLISH_REQUEST).sendAndParse(),
            new GetIssueStatsRequest(IssueType.STANDARD).sendAndParse()
        ]).then((results: IssueStatsJson[]) => {
            return this.updatePanelIssuesCount(results);
        });
    }

    private updatePanelIssuesCount(stats: IssueStatsJson[]): wemQ.Promise<void> {
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
        issuePanel.setLoadMask(this.loadMask);

        issuePanel.onIssueSelected(issue => this.notifyIssueSelected(issue.getIssue()));
        issuePanel.onIssueLoaded(() => this.notifyResize());
        issuePanel.onShown(() => this.notifyResize());

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
