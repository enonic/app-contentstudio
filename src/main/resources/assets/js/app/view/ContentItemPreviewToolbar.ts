import '../../api.ts';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {IssueStatus} from '../issue/IssueStatus';
import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {Issue} from '../issue/Issue';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import MenuButton = api.ui.button.MenuButton;
import ContentId = api.content.ContentId;
import Action = api.ui.Action;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    private issueButton: MenuButton;
    private mainIssue: Issue;
    private mainAction: Action;
    private issueActionsList: Action[];

    constructor() {
        super('content-item-preview-toolbar');

        const reloadList = (issue: Issue) => {
            const item = this.getItem();
            if (item) {
                const itemId = item.getContentSummary().getContentId();
                const issueHasSelectedContent = issue.getPublishRequest().getItemsIds().some(id => id.equals(itemId));
                if (issueHasSelectedContent) {
                    this.fetchIssues(itemId);
                }
            }
        };

        IssueDialogsManager.get().onIssueCreated(reloadList);
        IssueDialogsManager.get().onIssueUpdated(reloadList);
    }

    doRender(): wemQ.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.mainAction = new Action();
            this.mainAction.onExecuted(a => {
                if (this.mainIssue) {
                    IssueDialogsManager.get().openDetailsDialog(this.mainIssue);
                }
            });
            this.issueButton = new MenuButton(this.mainAction);
            this.issueButton.addClass('transparent');
            this.addElement(this.issueButton);
            return true;
        });
    }


    setItem(item: ContentSummaryAndCompareStatus): void {
        if (this.getItem() !== item) {
            this.fetchIssues(item.getContentSummary().getContentId());
        }
        super.setItem(item);
    }

    protected foldOrExpand() {
        // Disable fold in the Content preview toolbar
        return false;
    }

    private fetchIssues(id: ContentId) {
        if (this.issueActionsList && this.issueActionsList.length > 0) {
            this.issueButton.removeMenuActions(this.issueActionsList);
            this.issueActionsList.length = 0;
            this.mainAction.setLabel('');
        }
        return new FindIssuesRequest().addContentId(id).setIssueStatus(IssueStatus.OPEN).sendAndParse().then((issues: Issue[]) => {
            this.toggleClass('has-issues', issues.length > 0);
            this.issueButton.getActionButton().setEnabled(issues.length > 0);
            this.issueActionsList = issues.map(this.createIssueAction);

            const latestAction = this.issueActionsList.shift();
            if (latestAction) {
                this.mainAction.setLabel(latestAction.getLabel());
                this.mainIssue = issues[0];

                if (this.issueActionsList.length > 0) {
                    this.issueButton.addMenuActions(this.issueActionsList);
                }
            }
        }).catch(api.DefaultErrorHandler.handle);
    }

    private createIssueAction(issue: Issue) {
        const action = new Action(`#${issue.getIndex()} <i>${issue.getTitle()}</i>`);
        action.onExecuted((a) => {
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
        return action;
    }
}
