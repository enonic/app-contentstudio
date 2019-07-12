import ModalDialog = api.ui.dialog.ModalDialog;
import Principal = api.security.Principal;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import Panel = api.ui.panel.Panel;
import TabBar = api.ui.tab.TabBar;
import NavigatedDeckPanel = api.ui.panel.NavigatedDeckPanel;
import TabBarItem = api.ui.tab.TabBarItem;
import TabBarItemBuilder = api.ui.tab.TabBarItemBuilder;
import {IssuesCount, IssuesPanel} from './IssuesPanel';
import {Issue} from '../Issue';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {GetIssueStatsRequest} from '../resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../json/IssueStatsJson';

export class IssueListDialog
    extends ModalDialog {

    private static INSTANCE: IssueListDialog;

    private tabBar: TabBar;

    private allTab: TabBarItem;

    private publishRequestsTab: TabBarItem;

    private issuesTab: TabBarItem;

    private deckPanel: NavigatedDeckPanel;

    private issuesPanel: IssuesPanel;

    private currentUser: Principal;

    private createAction: api.ui.Action;

    private skipInitialLoad: boolean = false;

    private issueSelectedListeners: { (issue: Issue): void }[] = [];

    private constructor() {
        super(<api.ui.dialog.ModalDialogConfig>{
            title: i18n('text.publishingissues'),
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
        this.tabBar = this.createTabBar();
        this.deckPanel = this.createDeckPanel();
        this.createAction = new Action(i18n('action.newIssueMore'));
        this.loadCurrentUser();
    }

    protected initListeners() {
        super.initListeners();
        this.handleIssueGlobalEvents();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getButtonRow().addAction(this.createAction, true);
            this.appendChildToHeader(this.tabBar);
            this.appendChildToContentPanel(this.deckPanel);

            return rendered;
        });
    }

    private createTabBar(): TabBar {
        const tabBar = new TabBar();

        this.allTab = IssueListDialog.createTab(i18n('field.all'));
        this.publishRequestsTab = IssueListDialog.createTab(i18n('field.issue.publishRequests'));
        this.issuesTab = IssueListDialog.createTab(i18n('field.issues'));

        return tabBar;
    }

    private static createTab(label: string): TabBarItem {
        const builder = new TabBarItemBuilder();
        return builder.setLabel(label).build();
    }

    private createDeckPanel(): NavigatedDeckPanel {
        const deckPanel = new NavigatedDeckPanel(this.tabBar);

        const panel2 = new Panel();
        const panel3 = new Panel();

        deckPanel.addNavigablePanel(this.allTab, this.issuesPanel, true);
        deckPanel.addNavigablePanel(this.publishRequestsTab, panel2);
        deckPanel.addNavigablePanel(this.issuesTab, panel3);

        return deckPanel;
    }

    private reloadDockPanel(): wemQ.Promise<any> {
        return this.issuesPanel.reload();
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
        this.allTab.select();
        this.issuesPanel.resetFilters();
        this.remove();
    }

    open(assignedToMe: boolean = false, createdByMe: boolean = false) {

        if (assignedToMe || createdByMe) {
            this.skipInitialLoad = true;
        }

        super.open();

        this.skipInitialLoad = false;
        this.allTab.select();
        this.issuesPanel.resetFilters();
        if (assignedToMe) {
            this.issuesPanel.selectAssignedToMe();
            return;
        }
        if (createdByMe) {
            this.issuesPanel.selectAssignedByMe();
            return;
        }
    }

    private reload(updatedIssues?: Issue[]) {
        this.showLoadMask();
        this.reloadDockPanel()
            .then(() => {
                this.notifyResize();
                return this.updateTabAndFiltersLabels();
            }).then(() => {
                if (this.isNotificationToBeShown(updatedIssues)) {
                    api.notify.NotifyManager.get().showFeedback(i18n('notify.issue.listUpdated'));
                }
            })
            .catch(api.DefaultErrorHandler.handle)
            .finally(() => this.hideLoadMask())
            .done();
    }

    private handleIssueGlobalEvents() {

        const debouncedReload = api.util.AppHelper.debounce((issues?: Issue[]) => {
            this.reload(issues);
        }, 3000, true);

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
        return new GetIssueStatsRequest().sendAndParse().then((stats: IssueStatsJson) => {
            const openedIssues: IssuesCount = {
                all: stats.open,
                assignedToMe: stats.openAssignedToMe,
                assignedByMe: stats.openCreatedByMe
            };
            const closedIssues: IssuesCount = {
                all: stats.closed,
                assignedToMe: stats.closedAssignedToMe,
                assignedByMe: stats.closedCreatedByMe
            };

            return this.issuesPanel.updateIssuesCount(openedIssues, closedIssues);
        });
    }

    private updateTabLabel(tabIndex: number, label: string, count: number) {
        this.tabBar.getNavigationItem(tabIndex).setLabel(count > 0 ? (label + ' (' + count + ')') : label);
    }

    onCreateButtonClicked(listener: (action: Action) => void) {
        return this.createAction.onExecuted(listener);
    }

    private createIssuePanel(): IssuesPanel {
        const issuePanel = new IssuesPanel();
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
