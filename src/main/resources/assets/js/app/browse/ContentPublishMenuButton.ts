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
    publishTreeAction: Action;
    unpublishAction: Action;
    createIssueAction: Action;
    showCreateIssueButtonByDefault?: boolean;
}

enum ButtonState {
    PUBLISH, PUBLISH_TREE, UNPUBLISH, CREATE_ISSUE, NO_ITEM
}

export class ContentPublishMenuButton
    extends MenuButton {

    private issueActionsList: Action[];
    private issuesRequest: wemQ.Promise<void>;
    private state: ButtonState;

    private publishAction: Action;
    private publishTreeAction: Action;
    private unpublishAction: Action;
    private createIssueAction: Action;

    private publishTreeButton: ActionButton;
    private unpublishButton: ActionButton;
    private createIssueButton: ActionButton;

    private item: ContentSummaryAndCompareStatus;

    constructor(config: ContentPublishMenuButtonConfig) {
        super(config.publishAction, [config.publishAction, config.publishTreeAction, config.unpublishAction, config.createIssueAction]);
        this.addClass('content-publish-menu transparent');
        this.appendChild(MenuButtonProgressBarManager.getProgressBar());

        this.publishAction = config.publishAction;
        this.publishTreeAction = config.publishTreeAction;
        this.unpublishAction = config.unpublishAction;
        this.createIssueAction = config.createIssueAction;

        this.publishTreeButton = new ActionButton(this.publishTreeAction);
        this.unpublishButton = new ActionButton(this.unpublishAction);
        this.createIssueButton = new ActionButton(this.createIssueAction);

        if (config.showCreateIssueButtonByDefault) {
            this.setState(ButtonState.NO_ITEM);
        }

        this.handleIssueCreatedOrUpdated();
        this.handleActionsUpdated();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.getActionButton().addClass('publish-action-button');
            this.publishTreeButton.addClass('publish-tree-action-button');
            this.unpublishButton.addClass('unpublish-action-button');
            this.createIssueButton.addClass('create-issue-action-button');

            this.appendChild(this.publishTreeButton);
            this.appendChild(this.unpublishButton);
            this.appendChild(this.createIssueButton);

            return rendered;
        });
    }

    minimize() {
        //
    }

    maximize() {
        //
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
            this.updateActiveState();
        }, 500);

        this.publishAction.onPropertyChanged(actionUpdatedHandler);
        this.publishTreeAction.onPropertyChanged(actionUpdatedHandler);
        this.unpublishAction.onPropertyChanged(actionUpdatedHandler);
        this.createIssueAction.onPropertyChanged(actionUpdatedHandler);
    }

    private updateActiveState() {
        if (!this.item) {
            if (this.publishAction.isEnabled()) {
                this.setState(ButtonState.PUBLISH); // when multiple items selected
            } else {
                this.setState(ButtonState.NO_ITEM);
            }
        } else if (this.publishAction.isEnabled()) {
            this.setState(ButtonState.PUBLISH);
        } else if (this.publishTreeAction.isEnabled()) {
            this.setState(ButtonState.PUBLISH_TREE);
        } else if (this.unpublishAction.isEnabled()) {
            this.setState(ButtonState.UNPUBLISH);
        } else {
            this.setState(ButtonState.CREATE_ISSUE);
        }
    }

    private setState(state: ButtonState) {
        if (state === this.state) {
            return;
        }

        if (ButtonState[this.state]) {
            this.removeClass(this.currentStateAsString());
        }

        this.state = state;
        this.addClass(this.currentStateAsString());
    }

    private currentStateAsString(): string {
        return ButtonState[this.state].toLowerCase().replace('_', '-');
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
