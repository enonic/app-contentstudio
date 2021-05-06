import * as Q from 'q';
import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {IssueStatus} from '../issue/IssueStatus';
import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {Issue} from '../issue/Issue';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {IssueType} from '../issue/IssueType';
import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentId} from '../content/ContentId';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    private issueButton: MenuButton;
    private mainIssue: Issue;
    private mainAction: Action;
    private issueActionsList: Action[];
    private debouncedFetch: (id: ContentId) => void;

    constructor() {
        super('content-item-preview-toolbar');

        this.mainAction = new Action();
        this.mainAction.onExecuted(() => {
            if (this.mainIssue) {
                IssueDialogsManager.get().openDetailsDialog(this.mainIssue);
            }
        });
        this.issueButton = new MenuButton(this.mainAction);
        this.issueButton.addClass('transparent');

        this.debouncedFetch = AppHelper.debounce(this.fetchIssues, 100);

        const reloadList = () => {
            const item = this.getItem();
            if (item) {
                const itemId = item.getContentSummary().getContentId();
                this.debouncedFetch(itemId);
            }
        };

        const handler = IssueServerEventsHandler.getInstance();
        handler.onIssueCreated(reloadList);
        handler.onIssueUpdated(reloadList);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.addElement(this.issueButton);
            return rendered;
        });
    }


    setItem(item: ContentSummaryAndCompareStatus): void {
        if (this.getItem() !== item) {
            this.debouncedFetch(item.getContentSummary().getContentId());
        }
        super.setItem(item);
    }

    clearItem() {
        super.clearItem();

        this.issueButton.getActionButton().setEnabled(false);
        this.issueButton.hideDropdown();
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
            const hasIssues = issues.length > 0;
            this.toggleClass('has-issues', hasIssues);
            this.issueButton.getActionButton().setEnabled(hasIssues);
            this.issueButton.hideDropdown(!hasIssues);
            // do remove here again since it might have been changed during request flight
            if (this.issueActionsList && this.issueActionsList.length > 0) {
                this.issueButton.removeMenuActions(this.issueActionsList);
            }
            this.issueActionsList = issues.map(this.createIssueAction);

            const latestAction = this.issueActionsList.shift();
            if (latestAction) {
                this.mainAction.setLabel(latestAction.getLabel());
                this.mainAction.setIconClass(latestAction.getIconClass());
                this.mainIssue = issues[0];

                if (this.issueActionsList.length > 0) {
                    this.issueButton.addMenuActions(this.issueActionsList);
                }
            }
        }).catch(DefaultErrorHandler.handle);
    }

    private createIssueAction(issue: Issue): Action {
        const type = issue.getType() === IssueType.PUBLISH_REQUEST ? 'publish-request' : 'issue';
        const action = new Action(issue.getTitle());
        action.setIconClass(`icon icon-${type} opened`);
        action.onExecuted(() => {
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
        return action;
    }
}
