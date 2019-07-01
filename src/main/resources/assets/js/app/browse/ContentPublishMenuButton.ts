import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {IssueStatus} from '../issue/IssueStatus';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {Issue} from '../issue/Issue';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import MenuButton = api.ui.button.MenuButton;
import Action = api.ui.Action;
import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;
import ActionButton = api.ui.button.ActionButton;

export interface ContentPublishMenuButtonConfig {
    publishAction: Action;
    unpublishAction: Action;
    markAsReadyAction: Action;
    createIssueAction: Action;
}

export class ContentPublishMenuAction {
    private action: Action;
    private actionClass: string;

    constructor(action: Action, actionClass: string) {
        this.action = action;
        this.actionClass = actionClass;
    }

    isEnabled(): boolean {
        return this.action.isEnabled();
    }

    getAction(): Action {
        return this.action;
    }

    getActionClass(): string {
        return this.actionClass;
    }
}

export class ContentPublishMenuButton
    extends MenuButton {

    private issueActionsList: Action[];
    private issuesRequest: wemQ.Promise<void>;

    private activeClass: string;

    private initializedListeners: Function[] = [];

    protected publishAction: ContentPublishMenuAction;
    protected unpublishAction: ContentPublishMenuAction;
    protected createIssueAction: ContentPublishMenuAction;
    protected markAsReadyAction: ContentPublishMenuAction;

    protected markAsReadyButton: ActionButton;
    protected unpublishButton: ActionButton;
    protected createIssueButton: ActionButton;

    protected item: ContentSummaryAndCompareStatus;

    constructor(config: ContentPublishMenuButtonConfig) {
        super(config.publishAction);
        this.addClass('content-publish-menu transparent');

        this.initMenuActions(config);
        this.addMenuActions(this.getActions());
        this.initButtons();

        this.handleIssueCreatedOrUpdated();
        this.handleActionsUpdated();
    }

    protected initMenuActions(config: ContentPublishMenuButtonConfig) {
        this.publishAction = new ContentPublishMenuAction(config.publishAction, 'publish');
        this.unpublishAction = new ContentPublishMenuAction(config.unpublishAction, 'unpublish');
        this.createIssueAction = new ContentPublishMenuAction(config.createIssueAction, 'create-issue');
        this.markAsReadyAction = new ContentPublishMenuAction(config.markAsReadyAction, 'mark-as-ready');
    }

    protected getActions(): Action[] {
        return [
            this.publishAction.getAction(),
            this.markAsReadyAction.getAction(),
            this.unpublishAction.getAction(),
            this.createIssueAction.getAction()
        ];
    }

    protected initButtons() {
        this.unpublishButton = new ActionButton(this.unpublishAction.getAction());
        this.createIssueButton = new ActionButton(this.createIssueAction.getAction());
        this.markAsReadyButton = new ActionButton(this.markAsReadyAction.getAction());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(MenuButtonProgressBarManager.getProgressBar());
            this.getActionButton().addClass('publish-action-button');
            this.unpublishButton.addClass('unpublish-action-button');
            this.createIssueButton.addClass('create-issue-action-button');
            this.markAsReadyButton.addClass('mark-as-ready-action-button');

            this.appendChildren(...this.getButtons());
            this.getDropdownHandle().remove();
            this.appendChild(this.getDropdownHandle());

            return rendered;
        });
    }

    protected getButtons(): ActionButton[] {
        return [this.markAsReadyButton, this.unpublishButton, this.createIssueButton];
    }

    minimize() {
        //
    }

    maximize() {
        //
    }

    private notifyInitialized() {
        this.initializedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    onInitialized(listener: () => void) {
        this.initializedListeners.push(listener);
    }

    unInitialized(listener: () => void) {
        this.initializedListeners = this.initializedListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    private handleIssueCreatedOrUpdated() {
        const reloadList = (issue: Issue) => {
            if (this.item) {
                const nodeId = this.item.getContentSummary().getContentId();
                const issueHasSelectedContent = issue.getPublishRequest().getItemsIds().some(id => id.equals(nodeId));
                if (issueHasSelectedContent) {
                    this.fetchIssues(this.item);
                }
            }
        };

        IssueDialogsManager.get().onIssueCreated(reloadList);
        IssueDialogsManager.get().onIssueUpdated(reloadList);
    }

    private handleActionsUpdated() {
        const actionUpdatedHandler: () => void = api.util.AppHelper.debounce(() => {
            this.updateActiveClass();
        }, 500);

        this.getActions().forEach((action: Action) => action.onPropertyChanged(actionUpdatedHandler));
    }

    protected updateActiveClass() {
        if (this.publishAction.isEnabled()) {
            this.setActiveClass(this.publishAction.getActionClass());
        } else if (this.markAsReadyAction.isEnabled()) {
            this.setActiveClass(this.markAsReadyAction.getActionClass());
        } else if (this.unpublishAction.isEnabled()) {
            this.setActiveClass(this.unpublishAction.getActionClass());
        } else {
            this.setActiveClass(this.createIssueAction.getActionClass());
        }
    }

    protected setActiveClass(value: string) {
        if (this.hasClass(value)) {
            return;
        }

        if (this.activeClass) {
            this.removeClass(this.activeClass);
        } else {
            this.notifyInitialized();
        }

        this.activeClass = value;
        this.addClass(value);
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (item && (!this.item || !item.getContentId().equals(this.item.getContentId()))) {
            this.fetchIssues(item);
        }

        this.item = item;
    }

    private fetchIssues(highlightedOrSelected: ContentSummaryAndCompareStatus) {
        // don't update for mobile since the list is not visible
        if (this.isMinimized()) {
            return;
        }
        if (this.issueActionsList && this.issueActionsList.length > 0) {
            this.removeMenuActions(this.issueActionsList);
            this.issueActionsList.length = 0;
            this.removeMenuSeparator();
        }
        if (!this.issuesRequest && highlightedOrSelected) {
            const id = highlightedOrSelected.getContentSummary().getContentId();
            this.issuesRequest =
                new FindIssuesRequest().addContentId(id).setIssueStatus(IssueStatus.OPEN).sendAndParse().then((issues: Issue[]) => {
                    this.issueActionsList = issues.map(this.setupIssueAction);
                    if (this.issueActionsList.length > 0) {
                        this.addMenuSeparator();
                        this.addMenuActions(this.issueActionsList);
                    }
                })
                    .catch(api.DefaultErrorHandler.handle)
                    .finally(() => {
                        this.issuesRequest = undefined;
                    });
        }
    }

    private setupIssueAction(issue: Issue): Action {
        const action = new Action(issue.getTitleWithId());
        action.onExecuted(() => {
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
        return action;
    }

}
