import '../../api.ts';
import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {IssueStatus} from '../issue/IssueStatus';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {Issue} from '../issue/Issue';
import MenuButton = api.ui.button.MenuButton;
import Action = api.ui.Action;
import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

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

    private item: ContentSummaryAndCompareStatus;

    constructor(config: ContentPublishMenuButtonConfig) {
        super(config.publishAction, [config.publishTreeAction, config.unpublishAction, config.createIssueAction]);
        this.addClass('content-publish-menu transparent');
        this.appendChild(MenuButtonProgressBarManager.getProgressBar());

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

    setItem(item: ContentSummaryAndCompareStatus) {
        this.item = item;
        this.fetchIssues(item);
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
                    this.issueActionsList = issues.map(this.createIssueAction);
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

    private createIssueAction(issue: Issue): Action {
        const action = new Action(issue.getTitleWithId());
        action.onExecuted((a) => {
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
        return action;
    }
}
