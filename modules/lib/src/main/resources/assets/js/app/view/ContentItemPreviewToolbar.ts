import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ContentStatusToolbar} from '../ContentStatusToolbar';
import {IssueStatus} from '../issue/IssueStatus';
import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {Issue} from '../issue/Issue';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {IssueType} from '../issue/IssueType';
import {MenuButton} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {ContentId} from '../content/ContentId';

export class ContentItemPreviewToolbar
    extends ContentStatusToolbar {

    private issueButton: MenuButton;
    private mainIssue: Issue;
    private mainAction: Action;
    private issueActionsList: Action[];
    private debouncedFetch: (id: ContentId) => void;

    constructor() {
        super({className: 'content-item-preview-toolbar'});
    }

    protected initElements(): void {
        super.initElements();

        this.mainAction = new Action();
        this.issueButton = new MenuButton(this.mainAction);
    }

    protected initListeners(): void {
        super.initListeners();

        this.mainAction.onExecuted(() => {
            if (this.mainIssue) {
                IssueDialogsManager.get().openDetailsDialog(this.mainIssue);
            }
        });

        this.initIssueUpdateListeners();
    }

    private initIssueUpdateListeners(): void {
        this.debouncedFetch = AppHelper.debounce(this.fetchIssues, 100);

        const reloadList = () => {
            const item: ContentSummaryAndCompareStatus = this.getItem();

            if (item) {
                const itemId: ContentId = item.getContentSummary().getContentId();
                this.debouncedFetch(itemId);
            }
        };

        const handler: IssueServerEventsHandler = IssueServerEventsHandler.getInstance();
        handler.onIssueCreated(reloadList);
        handler.onIssueUpdated(reloadList);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then(rendered => {
            this.issueButton.addClass('transparent');
            this.addContainer(this.issueButton, this.issueButton.getChildControls());
            return rendered;
        });
    }


    setItem(item: ContentSummaryAndCompareStatus): void {
        if (this.getItem() !== item) {
            this.debouncedFetch(item.getContentSummary().getContentId());
        }
        super.setItem(item);
    }

    clearItem(): void {
        super.clearItem();

        this.issueButton.getActionButton().setEnabled(false);
        this.issueButton.hideDropdown();
    }

    protected foldOrExpand(): void {
    //
    }

    private fetchIssues(id: ContentId): Q.Promise<void> {
        this.cleanIssues();

        return new FindIssuesRequest().addContentId(id).setIssueStatus(IssueStatus.OPEN).sendAndParse().then((issues: Issue[]) => {
            this.processIssues(issues);
            return Q.resolve();
        }).catch(DefaultErrorHandler.handle);
    }

    private cleanIssues(): void {
        if (this.issueActionsList && this.issueActionsList.length > 0) {
            this.issueButton.removeMenuActions(this.issueActionsList);
            this.issueActionsList.length = 0;
            this.mainAction.setLabel('');
        }
    }

    private processIssues(issues: Issue[]): void {
        const hasIssues: boolean = issues.length > 0;
        this.toggleClass('has-issues', hasIssues);
        this.issueButton.getActionButton().setEnabled(hasIssues);
        this.issueButton.hideDropdown(!hasIssues);
        // do remove here again since it might have been changed during request flight
        if (this.issueActionsList && this.issueActionsList.length > 0) {
            this.issueButton.removeMenuActions(this.issueActionsList);
        }
        this.issueActionsList = issues.map(this.createIssueAction);

        const latestAction: Action = this.issueActionsList.shift();

        if (latestAction) {
            this.mainAction.setLabel(latestAction.getLabel());
            this.mainAction.setIconClass(latestAction.getIconClass());
            this.mainIssue = issues[0];

            if (this.issueActionsList.length > 0) {
                this.issueButton.addMenuActions(this.issueActionsList);
            }
        }
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
