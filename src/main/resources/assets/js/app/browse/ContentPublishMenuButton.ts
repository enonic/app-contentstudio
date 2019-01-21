import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {IssueStatus} from '../issue/IssueStatus';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {Issue} from '../issue/Issue';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {GetPermittedActionsRequest} from '../resource/GetPermittedActionsRequest';
import {Permission} from '../access/Permission';
import MenuButton = api.ui.button.MenuButton;
import Action = api.ui.Action;
import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;
import ActionButton = api.ui.button.ActionButton;

export interface ContentPublishMenuButtonConfig {
    publishAction: Action;
    publishTreeAction: Action;
    unpublishAction: Action;
    createIssueAction: Action;
}

export class ContentPublishMenuButton
    extends MenuButton {

    private issueActionsList: Action[];
    private issuesRequest: wemQ.Promise<void>;

    private publishAction: Action;
    private publishTreeAction: Action;
    private unpublishAction: Action;
    private createIssueAction: Action;

    private createIssueButton: ActionButton;

    private item: ContentSummaryAndCompareStatus;
    private isItemPublishable: boolean = false;
    private isItemPublishableHandler: () => void;
    private updateButtonStateHandler: () => void;

    constructor(config: ContentPublishMenuButtonConfig) {
        super(config.publishAction, [config.publishTreeAction, config.unpublishAction, config.createIssueAction]);
        this.addClass('content-publish-menu transparent');
        this.appendChild(MenuButtonProgressBarManager.getProgressBar());

        this.publishAction = config.publishAction;
        this.publishTreeAction = config.publishTreeAction;
        this.unpublishAction = config.unpublishAction;
        this.createIssueAction = config.createIssueAction;

        this.createIssueButton = new ActionButton(this.createIssueAction);

        this.initIsItemPublishableHandler();
        this.handleIssueCreatedOrUpdated();
        this.handleActionsStateUpdated();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered) => {
            this.getActionButton().addClass('main-action-button');
            this.createIssueButton.addClass('create-issue-action-button');
            this.appendChild(this.createIssueButton);

            return rendered;
        });
    }

    private initIsItemPublishableHandler() {
        this.isItemPublishableHandler = api.util.AppHelper.debounce(() => {
            this.checkItemIsPublishable().then((result: boolean) => {
                this.isItemPublishable = result;
                this.updateButtonStateHandler();
            });
        }, 200);
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

    private handleActionsStateUpdated() {
        this.updateButtonStateHandler = api.util.AppHelper.debounce(() => {
            this.toggleClass('only-create-issue', this.isOnlyCreateIssueEnabled());
        }, 200);

        this.publishAction.onPropertyChanged(this.updateButtonStateHandler);
        this.publishTreeAction.onPropertyChanged(this.updateButtonStateHandler);
        this.unpublishAction.onPropertyChanged(this.updateButtonStateHandler);
        this.createIssueAction.onPropertyChanged(this.updateButtonStateHandler);
    }

    private isOnlyCreateIssueEnabled(): boolean {
        if (!!this.item && this.isItemPublishable) {
            return false;
        }

        return this.createIssueAction.isEnabled() && !this.publishAction.isEnabled() && !this.publishTreeAction.isEnabled() &&
               !this.unpublishAction.isEnabled();
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (!!item && !item.getContentId().equals(item.getContentId())) {
            this.fetchIssues(item);
        }

        this.item = item;

        this.isItemPublishableHandler();
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
        action.onExecuted((a) => {
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
        return action;
    }

    private checkItemIsPublishable(): wemQ.Promise<boolean> {
        if (!this.item) {
            return wemQ(false);
        }

        return new GetPermittedActionsRequest()
            .addContentIds(this.item.getContentId())
            .addPermissionsToBeChecked(Permission.PUBLISH)
            .sendAndParse().then((allowedPermissions: Permission[]) => {
                return allowedPermissions.indexOf(Permission.PUBLISH) > -1;
            });
    }
}
