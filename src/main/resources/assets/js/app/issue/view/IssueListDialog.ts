import ModalDialog = api.ui.dialog.ModalDialog;
import Principal = api.security.Principal;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import TabBar = api.ui.tab.TabBar;
import NavigatedDeckPanel = api.ui.panel.NavigatedDeckPanel;
import NavigatorEvent = api.ui.NavigatorEvent;
import TabBarItem = api.ui.tab.TabBarItem;
import TabBarItemBuilder = api.ui.tab.TabBarItemBuilder;
import {IssuesCount, IssuesPanel, IssuesPanelConfig} from './IssuesPanel';
import {Issue} from '../Issue';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {GetIssueStatsRequest} from '../resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssuesStorage} from './IssuesStorage';
import {IssueType} from '../IssueType';

export class IssueListDialog
    extends ModalDialog {

    private static INSTANCE: IssueListDialog;

    private tabBar: TabBar;

    private allTab: TabBarItem;

    private publishRequestsTab: TabBarItem;

    private issuesTab: TabBarItem;

    private deckPanel: NavigatedDeckPanel;

    private allPanel: IssuesPanel;

    private publishRequestsPanel: IssuesPanel;

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
        const storage = new IssuesStorage();

        this.allPanel = this.createIssuePanel({
            storage,
            noIssuesMessage: i18n('dialog.issue.noIssuesAndPublishRequests'),
            issuesToggledHandler: () => this.updateAllTabLabel()
        });

        this.publishRequestsPanel = this.createIssuePanel({
            storage,
            issueType: IssueType.PUBLISH_REQUEST,
            noIssuesMessage: i18n('dialog.issue.noPublishRequests'),
            issuesToggledHandler: () => this.updatePublishRequestsTabLabel()
        });

        this.issuesPanel = this.createIssuePanel({
            storage,
            issueType: IssueType.STANDARD,
            noIssuesMessage: i18n('dialog.issue.noIssues'),
            issuesToggledHandler: () => this.updateIssuesTabLabel()
        });

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
        this.publishRequestsTab = IssueListDialog.createTab(i18n('field.publishRequests'));
        this.issuesTab = IssueListDialog.createTab(i18n('field.issues'));

        tabBar.onNavigationItemSelected((event: NavigatorEvent) => {
            this.toggleClass('show-footer', event.getItem() === this.issuesTab);
        });

        return tabBar;
    }

    private static createTab(label: string): TabBarItem {
        const builder = new TabBarItemBuilder();
        return builder.setLabel(label).setAddLabelTitleAttribute(false).build();
    }

    private createDeckPanel(): NavigatedDeckPanel {
        const deckPanel = new NavigatedDeckPanel(this.tabBar);

        deckPanel.addNavigablePanel(this.allTab, this.allPanel, true);
        deckPanel.addNavigablePanel(this.publishRequestsTab, this.publishRequestsPanel);
        deckPanel.addNavigablePanel(this.issuesTab, this.issuesPanel);

        return deckPanel;
    }

    private reloadDeckPanel(): wemQ.Promise<any> {
        const panel = <IssuesPanel>(this.deckPanel.getPanelShown() || this.allPanel);
        return panel.reload();
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
        this.resetFiltersAndTab();
        this.remove();
    }

    open(assignedToMe: boolean = false, createdByMe: boolean = false) {

        if (assignedToMe || createdByMe) {
            this.skipInitialLoad = true;
        }

        super.open();

        this.skipInitialLoad = false;
        this.resetFiltersAndTab();
        if (assignedToMe) {
            this.allPanel.selectAssignedToMe();
            this.publishRequestsPanel.selectAssignedToMe();
            this.issuesPanel.selectAssignedToMe();
        } else if (createdByMe) {
            this.allPanel.selectAssignedByMe();
            this.publishRequestsPanel.selectAssignedByMe();
            this.issuesPanel.selectAssignedByMe();
        }
    }

    private resetFiltersAndTab() {
        this.allTab.select();
        this.allPanel.resetFilters();
        this.publishRequestsPanel.resetFilters();
        this.issuesPanel.resetFilters();
    }

    private reload(updatedIssues?: Issue[]) {
        this.showLoadMask();
        this.reloadDeckPanel()
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
            return IssueListDialog.updatePanelIssuesCount(this.allPanel, results[0])
                .then(() => IssueListDialog.updatePanelIssuesCount(this.publishRequestsPanel, results[1]))
                .then(() => IssueListDialog.updatePanelIssuesCount(this.issuesPanel, results[2]))
                .then(() => this.updateTabsLabels());
        });
    }

    private static updatePanelIssuesCount(panel: IssuesPanel, stats: IssueStatsJson): wemQ.Promise<void> {
        const openedIssues = IssueListDialog.createOpenedIssues(stats);
        const closedIssues = IssueListDialog.createClosedIssues(stats);
        return panel.updateIssuesCount(openedIssues, closedIssues);
    }

    private static createOpenedIssues(stats: IssueStatsJson): IssuesCount {
        return {
            all: stats.open,
            assignedToMe: stats.openAssignedToMe,
            assignedByMe: stats.openCreatedByMe
        };
    }

    private static createClosedIssues(stats: IssueStatsJson): IssuesCount {
        return {
            all: stats.closed,
            assignedToMe: stats.closedAssignedToMe,
            assignedByMe: stats.closedCreatedByMe
        };
    }

    updateTabsLabels() {
        this.updateAllTabLabel();
        this.updatePublishRequestsTabLabel();
        this.updateIssuesTabLabel();
    }

    private updateAllTabLabel() {
        const total = this.allPanel.getActiveTotal();
        const label = IssueListDialog.createTabLabel(i18n('field.all'), total);
        this.allTab.setLabel(label, false, false);
    }

    private updatePublishRequestsTabLabel() {
        const total = this.publishRequestsPanel.getActiveTotal();
        const label = IssueListDialog.createTabLabel(i18n('field.publishRequests'), total);
        this.publishRequestsTab.setLabel(label, false, false);
    }

    private updateIssuesTabLabel() {
        const total = this.issuesPanel.getActiveTotal();
        const label = IssueListDialog.createTabLabel(i18n('field.issues'), total);
        this.issuesTab.setLabel(label, false, false);
    }

    private static createTabLabel(label: string, count: number) {
        return count > 0 ? `${label} (${count})` : label;
    }

    onCreateButtonClicked(listener: (action: Action) => void) {
        return this.createAction.onExecuted(listener);
    }

    private createIssuePanel(config: IssuesPanelConfig): IssuesPanel {
        const issuePanel = new IssuesPanel(config);
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
