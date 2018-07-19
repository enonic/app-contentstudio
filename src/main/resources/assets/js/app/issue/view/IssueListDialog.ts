import DockedPanel = api.ui.panel.DockedPanel;
import ModalDialog = api.ui.dialog.ModalDialog;
import LoadMask = api.ui.mask.LoadMask;
import User = api.security.User;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import {IssuesPanel} from './IssuesPanel';
import {Issue} from '../Issue';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {IssueStatus} from '../IssueStatus';
import {GetIssueStatsRequest} from '../resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../json/IssueStatsJson';

export class IssueListDialog
    extends ModalDialog {

    private static INSTANCE: IssueListDialog = new IssueListDialog();

    private dockedPanel: DockedPanel;

    private openIssuesPanel: IssuesPanel;

    private closedIssuesPanel: IssuesPanel;

    private reload: Function;

    private loadMask: LoadMask;

    private currentUser: User;

    private createAction: api.ui.Action;

    private skipInitialLoad: boolean = false;

    private issueSelectedListeners: { (issue: Issue): void }[] = [];

    private constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{title: i18n('text.publishingissues')});
        this.addClass('issue-dialog issue-list-dialog grey-header');

        this.getBody().addClass('mask-wrapper');

        this.createAction = new Action(i18n('action.newIssueMore'));

        this.initDeboundcedReloadFunc();
        this.handleIssueGlobalEvents();
        this.initElements();

        this.loadCurrentUser();
    }

    public static get(): IssueListDialog {
        return IssueListDialog.INSTANCE;
    }

    private loadCurrentUser() {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
        });
    }

    private initElements() {
        this.loadMask = new LoadMask(this);
        this.openIssuesPanel = this.createIssuePanel(IssueStatus.OPEN);
        this.closedIssuesPanel = this.createIssuePanel(IssueStatus.CLOSED);
        this.dockedPanel = this.createDockedPanel();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getButtonRow().addAction(this.createAction);
            this.appendChildToContentPanel(this.dockedPanel);
            return rendered;
        });
    }

    private createDockedPanel(): DockedPanel {
        const dockedPanel = new DockedPanel();

        dockedPanel.addItem(i18n('field.issue.openIssues'), true, this.openIssuesPanel);
        dockedPanel.addItem(i18n('field.issue.closedIssues'), true, this.closedIssuesPanel);

        return dockedPanel;
    }

    private reloadDockPanel(): wemQ.Promise<any> {
        return wemQ.all([
            this.openIssuesPanel.reload(),
            this.closedIssuesPanel.reload()
        ]);
    }

    show() {
        api.dom.Body.get().appendChild(this);
        super.show();
        this.appendChildToContentPanel(this.loadMask);
        if (!this.skipInitialLoad) {
            this.reload();
        } else {
            this.updateTabAndFiltersLabels();
        }
    }

    close() {
        super.close();
        this.openIssuesPanel.resetFilters();
        this.closedIssuesPanel.resetFilters();
        this.remove();
    }

    open(assignedToMe: boolean = false, createdByMe: boolean = false) {

        if (assignedToMe || createdByMe) {
            this.skipInitialLoad = true;
        }

        super.open();

        this.skipInitialLoad = false;
        this.openIssuesPanel.resetFilters();
        this.closedIssuesPanel.resetFilters();
        if (assignedToMe) {
            this.openIssuesPanel.setAssignedToMe(true, true);
            this.closedIssuesPanel.setAssignedToMe(true, true);
            return;
        }
        if (createdByMe) {
            this.openIssuesPanel.setCreatedByMe(true, true);
            this.closedIssuesPanel.setCreatedByMe(true, true);
            return;
        }
    }

    private initDeboundcedReloadFunc() {
        this.reload = api.util.AppHelper.debounce((issues?: Issue[]) => {
            this.doReload(issues);
        }, 3000, true);
    }

    private doReload(updatedIssues?: Issue[]) {
        this.loadMask.show();
        this.reloadDockPanel()
            .then(() => {
                this.notifyResize();
                this.updateTabAndFiltersLabels();
                if (this.isNotificationToBeShown(updatedIssues)) {
                    api.notify.NotifyManager.get().showFeedback(i18n('notify.issue.listUpdated'));
                }
            })
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => this.loadMask.hide())
            .done();
    }

    private handleIssueGlobalEvents() {

        IssueServerEventsHandler.getInstance().onIssueCreated((issues: Issue[]) => {
            if (this.isVisible()) {
                this.reload(issues);
            }
        });

        IssueServerEventsHandler.getInstance().onIssueUpdated((issues: Issue[]) => {
            if (this.isVisible()) {
                this.reload(issues);
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

    private openTab(issuePanel: IssuesPanel) {
        this.dockedPanel.selectPanel(issuePanel);
    }

    protected hasSubDialog(): boolean {
        return true;
    }

    private updateTabAndFiltersLabels() {
        new GetIssueStatsRequest().sendAndParse().then((stats: IssueStatsJson) => {
            this.updateTabLabel(0, i18n('field.issue.openIssues'), stats.open);
            this.updateTabLabel(1, i18n('field.issue.closedIssues'), stats.closed);
            this.openIssuesPanel.updateMyIssuesCheckbox(stats.openCreatedByMe);
            this.openIssuesPanel.updateAssignedToMeCheckbox(stats.openAssignedToMe);
            this.closedIssuesPanel.updateMyIssuesCheckbox(stats.closedCreatedByMe);
            this.closedIssuesPanel.updateAssignedToMeCheckbox(stats.closedAssignedToMe);
            this.dockedPanel.selectPanel(stats.open === 0 && stats.closed > 0 ? this.closedIssuesPanel : this.openIssuesPanel);
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        });
    }

    private updateTabLabel(tabIndex: number, label: string, issuesFound: number) {
        this.dockedPanel.getNavigator().getNavigationItem(tabIndex).setLabel(issuesFound > 0 ? (label + ' (' + issuesFound + ')') : label);
    }

    onCreateButtonClicked(listener: (action: Action) => void) {
        return this.createAction.onExecuted(listener);
    }

    private createIssuePanel(issueStatus: IssueStatus): IssuesPanel {
        const issuePanel = new IssuesPanel(issueStatus);
        issuePanel.setLoadMask(this.loadMask);

        issuePanel.onIssueSelected(issue => this.notifyIssueSelected(issue.getIssue()));
        issuePanel.getIssueList().onIssuesLoaded(() => this.notifyResize());
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
