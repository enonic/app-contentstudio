import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {FindIssuesRequest} from './issue/resource/FindIssuesRequest';
import {IssueStatus} from './issue/IssueStatus';
import {IssueDialogsManager} from './issue/IssueDialogsManager';
import {Issue} from './issue/Issue';
import {ContentSummaryAndCompareStatus} from './content/ContentSummaryAndCompareStatus';
import {IssueServerEventsHandler} from './issue/event/IssueServerEventsHandler';
import {MenuButtonConfig, MenuButton, MenuButtonDropdownPos} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {MenuButtonProgressBarManager} from '@enonic/lib-admin-ui/ui/button/MenuButtonProgressBarManager';
import {ContentId} from './content/ContentId';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';

interface ContentActionMenuButtonConfig
    extends MenuButtonConfig {
    defaultActionNoContent?: Action;
    debounceRequests?: number;
}

export class ContentActionMenuButton
    extends MenuButton {

    protected config: ContentActionMenuButtonConfig;
    protected item: ContentSummaryAndCompareStatus;

    private issueActionsList: Action[];
    private issuesRequest: Q.Promise<void>;

    private actionUpdatedListeners: (() => void)[] = [];
    private actionUpdatedHandler: () => void;

    private isRefreshDisabled: boolean = false;
    private debouncedFetchIssues: () => void;

    constructor(config: ContentActionMenuButtonConfig) {
        super(config);

        this.addClass('content-publish-menu transparent no-item');
    }

    protected initListeners(): void {
        super.initListeners();

        if (this.config.debounceRequests) {
            this.debouncedFetchIssues = AppHelper.debounce(this.fetchIssues, 500);
        } else {
            this.debouncedFetchIssues = this.fetchIssues;
        }

        this.handleIssueCreatedOrUpdated();
        this.handleActionsUpdated();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(MenuButtonProgressBarManager.getProgressBar());

            return rendered;
        });
    }

    minimize() {
        //
    }

    maximize() {
        //
    }

    setRefreshDisabled(value: boolean) {
        this.isRefreshDisabled = value;

        if (!value) {
            this.actionUpdatedHandler();
        }
    }

    private notifyActionUpdated() {
        this.actionUpdatedListeners.forEach((listener: () => void) => {
            listener();
        });
    }

    onActionUpdated(listener: () => void) {
        this.actionUpdatedListeners.push(listener);
    }

    unActionUpdated(listener: () => void) {
        this.actionUpdatedListeners = this.actionUpdatedListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    private handleIssueCreatedOrUpdated() {
        const reloadList = () => {
            if (this.item) {
                // item might've been removed from issue, so reload even if it's not listed
                this.debouncedFetchIssues();
            }
        };

        const handler = IssueServerEventsHandler.getInstance();
        handler.onIssueCreated(reloadList);
        handler.onIssueUpdated(reloadList);
    }

    private handleActionsUpdated() {
        this.actionUpdatedHandler = AppHelper.debounce(() => {
            this.refreshActionButton();
            this.toggleClass('no-item', !this.hasItem());
        }, 50);

        this.getMenuActions().forEach((action: Action) => action.onPropertyChanged(() => {
            if (!this.isRefreshDisabled) {
                this.actionUpdatedHandler();
            }
        }));
    }

    protected getActiveAction(): Action {
        if (!this.hasItem() && ObjectHelper.isDefined(this.config.defaultActionNoContent)) {
            return this.config.defaultActionNoContent;
        }

        const defaultAction = this.getDefaultAction();
        if (defaultAction.isEnabled()) {
            return defaultAction;
        }

        const activeAction = this.getMenuActions().find((action: Action) => action.isEnabled());

        return activeAction || defaultAction;
    }

    private refreshActionButton() {
        this.setButtonAction(this.getActiveAction());
        this.notifyActionUpdated();
    }

    setItem(item: ContentSummaryAndCompareStatus) {
        if (ObjectHelper.equals(item, this.item)) {
            return;
        }

        this.item = item;
        this.debouncedFetchIssues();
    }

    private hasItem(): boolean {
        return ObjectHelper.isDefined(this.item);
    }

    private fetchIssues() {
        // don't update for mobile since the list is not visible
        if (this.isMinimized()) {
            return;
        }
        if (this.issueActionsList?.length > 0) {
            this.removeMenuActions(this.issueActionsList);
            this.issueActionsList = [];
            this.removeMenuSeparator();
        }
        if (!ObjectHelper.isDefined(this.issuesRequest) && this.hasItem()) {
            const contentId = this.item.getContentId();
            this.issuesRequest = this.findIssues(contentId)
                .catch(DefaultErrorHandler.handle)
                .finally(() => {
                    this.issuesRequest = null;
                });
        }
    }

    protected findIssues(contentId: ContentId): Q.Promise<Issue[]> {
        return new FindIssuesRequest()
            .addContentId(contentId)
            .setIssueStatus(IssueStatus.OPEN)
            .sendAndParse()
            .then((issues: Issue[]) => {
                if (this.issueActionsList && this.issueActionsList.length > 0) {
                    this.removeMenuActions(this.issueActionsList);
                }
                this.issueActionsList = issues.map(this.setupIssueAction);
                if (this.issueActionsList.length > 0) {
                    this.addMenuSeparator();
                    this.addMenuActions(this.issueActionsList);
                }
                return issues;
            });
    }

    private setupIssueAction(issue: Issue): Action {
        const action = new Action(issue.getTitleWithId());
        action.onExecuted(() => IssueDialogsManager.get().openDetailsDialog(issue));

        return action;
    }
}
