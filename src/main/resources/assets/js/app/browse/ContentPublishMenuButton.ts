import '../../api.ts';
import {ContentTreeGridActions} from './action/ContentTreeGridActions';
import {ContentTreeGrid} from './ContentTreeGrid';
import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {IssueStatus} from '../issue/IssueStatus';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {Issue} from '../issue/Issue';
import MenuButton = api.ui.button.MenuButton;
import TreeNode = api.ui.treegrid.TreeNode;
import Action = api.ui.Action;
import MenuButtonProgressBarManager = api.ui.button.MenuButtonProgressBarManager;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;

export class ContentPublishMenuButton
    extends MenuButton {

    private issueActionsList: Action[];

    constructor(actions: ContentTreeGridActions, grid: ContentTreeGrid) {
        super(actions.getPublishAction(), [actions.getPublishTreeAction(), actions.getUnpublishAction(), actions.getCreateIssueAction()]);
        this.addClass('content-publish-menu');
        this.appendChild(MenuButtonProgressBarManager.getProgressBar());

        grid.onSelectionChanged(
            (currentSel: TreeNode<ContentSummaryAndCompareStatus>[], fullSel: TreeNode<ContentSummaryAndCompareStatus>[],
             highlighted: boolean) => {
                return this.handleSelectionChanged(fullSel.length == 1 ? fullSel[0] : null);
            });

        grid.onHighlightingChanged(this.handleSelectionChanged.bind(this));

        IssueDialogsManager.get().onIssueCreated((issue: Issue) => {
            const selectCount = grid.getSelectedNodes().length;
            const node = grid.getFirstSelectedOrHighlightedNode();
            // update issues list if no more than 1 node is selected or highlighted only
            if (node && selectCount <= 1) {
                const nodeId = node.getData().getContentSummary().getContentId();
                const issueHasSelectedContent = issue.getPublishRequest().getItemsIds().some(id => id.equals(nodeId));
                if (issueHasSelectedContent) {
                    this.handleSelectionChanged(node);
                }
            }
        });
    }

    private handleSelectionChanged(highlightedOrSelected: TreeNode<ContentSummaryAndCompareStatus>) {
        // don't update for mobile since the list is not visible
        if (this.isMinimized()) {
            return;
        }
        if (this.issueActionsList && this.issueActionsList.length > 0) {
            this.removeMenuActions(this.issueActionsList);
            this.issueActionsList.length = 0;
            this.removeMenuSeparator();
        }
        if (highlightedOrSelected) {
            const id = highlightedOrSelected.getData().getContentSummary().getContentId();
            new FindIssuesRequest().addContentId(id).setIssueStatus(IssueStatus.OPEN).sendAndParse().then((issues: Issue[]) => {
                this.issueActionsList = issues.map((issue: Issue) => {
                    const action = new Action(issue.getTitleWithId());
                    action.onExecuted((a) => {
                        IssueDialogsManager.get().openDetailsDialog(issue);
                    });
                    return action;
                });
                if (this.issueActionsList.length > 0) {
                    this.addMenuSeparator();
                    this.addMenuActions(this.issueActionsList);
                }
            }).catch(api.DefaultErrorHandler.handle);
        }
    };
}
