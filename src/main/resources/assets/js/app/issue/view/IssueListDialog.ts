import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {Body} from 'lib-admin-ui/dom/Body';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ModalDialogWithConfirmation, ModalDialogWithConfirmationConfig} from 'lib-admin-ui/ui/dialog/ModalDialogWithConfirmation';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {Principal} from 'lib-admin-ui/security/Principal';
import {Action} from 'lib-admin-ui/ui/Action';
import {TabBar} from 'lib-admin-ui/ui/tab/TabBar';
import {NavigatedDeckPanel} from 'lib-admin-ui/ui/panel/NavigatedDeckPanel';
import {NavigatorEvent} from 'lib-admin-ui/ui/NavigatorEvent';
import {TabBarItem, TabBarItemBuilder} from 'lib-admin-ui/ui/tab/TabBarItem';
import {IssuesCount, IssuesPanel, IssuesPanelConfig} from './IssuesPanel';
import {Issue} from '../Issue';
import {IssueServerEventsHandler} from '../event/IssueServerEventsHandler';
import {GetIssueStatsRequest} from '../resource/GetIssueStatsRequest';
import {IssueStatsJson} from '../json/IssueStatsJson';
import {IssuesStorage} from './IssuesStorage';
import {IssueType} from '../IssueType';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {KeyBinding} from 'lib-admin-ui/ui/KeyBinding';
import {KeyBindings} from 'lib-admin-ui/ui/KeyBindings';

export class IssueListDialog
    extends ModalDialogWithConfirmation {

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

    private createAction: Action;

    private keyBinding: KeyBinding;

    private skipInitialLoad: boolean = false;

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
        this.setupKeyNavigation();

        this.onShown(() => {
            if (this.isRendered()) {
                this.allTab.getFirstChild().giveFocus();
            } else {
                this.onRendered(() => {
                    this.allTab.getFirstChild().giveFocus();
                });
            }
        });
    }

    private setupKeyNavigation() {
        this.keyBinding = new KeyBinding('tab', (event) => {
            if (this.isAllTabFocused() && !this.allPanel.isEmpty()) {
                event.stopPropagation();
                event.preventDefault();
                this.allPanel.focusFirstItem();

                return;
            }

            if (this.isLastListItemFocused(this.allPanel)) {
                event.stopPropagation();
                event.preventDefault();
                this.publishRequestsTab.getFirstChild().giveFocus();

                return;
            }

            if (this.isPublishRequestsTabFocused() && !this.publishRequestsPanel.isEmpty()) {
                event.stopPropagation();
                event.preventDefault();
                this.publishRequestsPanel.focusFirstItem();

                return;
            }

            if (this.isLastListItemFocused(this.publishRequestsPanel)) {
                event.stopPropagation();
                event.preventDefault();
                this.issuesTab.getFirstChild().giveFocus();

                return;
            }

            if (this.isIssuesTabFocused() && !this.issuesPanel.isEmpty()) {
                event.stopPropagation();
                event.preventDefault();
                this.issuesPanel.focusFirstItem();

                return;
            }
        });

        this.allTab.onClicked(() => {
            this.allTab.getFirstChild().giveFocus();
        });

        this.allTab.getFirstChild().onFocus(() => {
            this.allTab.select();
        });

        this.publishRequestsTab.onClicked(() => {
            this.publishRequestsTab.getFirstChild().giveFocus();
        });

        this.publishRequestsTab.getFirstChild().onFocus(() => {
            this.publishRequestsTab.select();
        });

        this.issuesTab.onClicked(() => {
            this.issuesTab.getFirstChild().giveFocus();
        });

        this.issuesTab.getFirstChild().onFocus(() => {
            this.issuesTab.select();
        });
    }

    private isAllTabFocused(): boolean {
        return document.activeElement === this.allTab.getFirstChild().getHTMLElement() || document.activeElement ===
               this.allTab.getHTMLElement();
    }

    private isPublishRequestsTabFocused(): boolean {
        return document.activeElement === this.publishRequestsTab.getFirstChild().getHTMLElement() || document.activeElement ===
               this.publishRequestsTab.getHTMLElement();
    }

    private isIssuesTabFocused(): boolean {
        return document.activeElement === this.issuesTab.getFirstChild().getHTMLElement() || document.activeElement ===
               this.issuesTab.getHTMLElement();
    }

    private isLastListItemFocused(issuesPanel: IssuesPanel): boolean {
        return document.activeElement === issuesPanel.getIssueList().getLastChild().getHTMLElement();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getButtonRow().addAction(this.createAction, true);
            this.appendChildToHeader(this.tabBar);
            this.appendChildToContentPanel(this.deckPanel);

            return rendered;
        });
    }

    unmask() {
        super.unmask();
        this.tabBar.getSelectedNavigationItem().getFirstChild().giveFocus();
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
        const tabBarItem: TabBarItem = new TabBarItemBuilder().setLabel(label).setAddLabelTitleAttribute(false).build();

        return tabBarItem;
    }

    private createDeckPanel(): NavigatedDeckPanel {
        const deckPanel = new NavigatedDeckPanel(this.tabBar);

        deckPanel.addNavigablePanel(this.allTab, this.allPanel, true);
        deckPanel.addNavigablePanel(this.publishRequestsTab, this.publishRequestsPanel);
        deckPanel.addNavigablePanel(this.issuesTab, this.issuesPanel);

        return deckPanel;
    }

    private reloadDeckPanel(): Q.Promise<any> {
        const panel = <IssuesPanel>(this.deckPanel.getPanelShown() || this.allPanel);
        return panel.reload();
    }

    show() {
        Body.get().appendChild(this);
        super.show();
        if (!this.skipInitialLoad) {
            this.reload();
        } else {
            this.updateTabAndFiltersLabels().catch(DefaultErrorHandler.handle);
        }
    }

    close() {
        super.close();
        this.resetFiltersAndTab();
        this.remove();
        KeyBindings.get().unbindKey(this.keyBinding);
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

        KeyBindings.get().bindKey(this.keyBinding);
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
                    NotifyManager.get().showFeedback(i18n('notify.issue.listUpdated'));
                }
            })
            .catch(DefaultErrorHandler.handle)
            .finally(() => this.hideLoadMask())
            .done();
    }

    private handleIssueGlobalEvents() {

        const debouncedReload = AppHelper.runOnceAndDebounce((issues?: Issue[]) => {
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

    private updateTabAndFiltersLabels(): Q.Promise<void> {
        return Q.all([
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

    private static updatePanelIssuesCount(panel: IssuesPanel, stats: IssueStatsJson): Q.Promise<void> {
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
