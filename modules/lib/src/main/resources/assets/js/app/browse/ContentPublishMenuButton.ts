import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {FindIssuesRequest} from '../issue/resource/FindIssuesRequest';
import {IssueStatus} from '../issue/IssueStatus';
import {IssueDialogsManager} from '../issue/IssueDialogsManager';
import {Issue} from '../issue/Issue';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {MenuButton} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {MenuButtonProgressBarManager} from '@enonic/lib-admin-ui/ui/button/MenuButtonProgressBarManager';
import {ActionButton} from '@enonic/lib-admin-ui/ui/button/ActionButton';
import {ContentId} from '../content/ContentId';

export interface ContentPublishMenuButtonConfig {
    publishAction: Action;
    unpublishAction: Action;
    markAsReadyAction: Action;
    requestPublishAction: Action;
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
    private issuesRequest: Q.Promise<void>;

    private activeClass: string;

    private initializedListeners: Function[] = [];
    private actionUpdatedHandler: Function;

    protected publishAction: ContentPublishMenuAction;
    protected unpublishAction: ContentPublishMenuAction;
    protected createIssueAction: ContentPublishMenuAction;
    protected markAsReadyAction: ContentPublishMenuAction;
    protected requestPublishAction: ContentPublishMenuAction;

    protected markAsReadyButton: ActionButton;
    protected unpublishButton: ActionButton;
    protected createIssueButton: ActionButton;
    protected requestPublishButton: ActionButton;

    protected item: ContentSummaryAndCompareStatus;

    private isRefreshDisabled: boolean = false;
    private debouncedFetch: (highlightedOrSelected: ContentSummaryAndCompareStatus) => void;

    constructor(config: ContentPublishMenuButtonConfig) {
        super(config.publishAction);
        this.addClass('content-publish-menu transparent');

        this.debouncedFetch = AppHelper.debounce(this.fetchIssues, 500);

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
        this.requestPublishAction = new ContentPublishMenuAction(config.requestPublishAction, 'request-publish');
    }

    protected getActions(): Action[] {
        return [
            this.markAsReadyAction.getAction(),
            this.publishAction.getAction(),
            this.unpublishAction.getAction(),
            this.requestPublishAction.getAction(),
            this.createIssueAction.getAction()
        ];
    }

    protected initButtons() {
        this.unpublishButton = new ActionButton(this.unpublishAction.getAction());
        this.createIssueButton = new ActionButton(this.createIssueAction.getAction());
        this.markAsReadyButton = new ActionButton(this.markAsReadyAction.getAction());
        this.requestPublishButton = new ActionButton(this.requestPublishAction.getAction());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChild(MenuButtonProgressBarManager.getProgressBar());
            this.getActionButton().addClass('publish-action-button');
            this.unpublishButton.addClass('unpublish-action-button');
            this.createIssueButton.addClass('create-issue-action-button');
            this.markAsReadyButton.addClass('mark-as-ready-action-button');
            this.requestPublishButton.addClass('request-publish-action-button');

            this.appendChildren(...this.getButtons());
            this.getDropdownHandle().remove();
            this.appendChild(this.getDropdownHandle());

            return rendered;
        });
    }

    protected getButtons(): ActionButton[] {
        return [this.markAsReadyButton, this.unpublishButton, this.requestPublishButton, this.createIssueButton];
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
        const reloadList = () => {
            if (this.item) {
                // item might've been removed from issue, so reload even if it's not listed
                this.debouncedFetch(this.item);
            }
        };

        const handler = IssueServerEventsHandler.getInstance();
        handler.onIssueCreated(reloadList);
        handler.onIssueUpdated(reloadList);
    }

    private handleActionsUpdated() {
        this.actionUpdatedHandler = AppHelper.debounce(() => {
            this.updateActiveClass();
        }, 50);

        this.getActions().forEach((action: Action) => action.onPropertyChanged(() => {
            if (!this.isRefreshDisabled) {
                this.actionUpdatedHandler();
            }
        }));
    }

    protected isItemPendingDelete(): boolean {
        return this.item != null && this.item.isPendingDelete();
    }

    protected getActiveActionButton(): ActionButton {
        return [super.getActiveActionButton()].concat(this.getButtons()).find((button: ActionButton) => button.isVisible());
    }

    updateActiveClass() {
        if (this.markAsReadyAction.isEnabled()) {
            this.setActiveClass(this.markAsReadyAction.getActionClass());
        } else if (this.publishAction.isEnabled()) {
            this.setActiveClass(this.publishAction.getActionClass());
        } else if (this.unpublishAction.isEnabled()) {
            this.setActiveClass(this.unpublishAction.getActionClass());
        } else if (this.requestPublishAction.isEnabled()) {
            this.setActiveClass(this.requestPublishAction.getActionClass());
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
            this.debouncedFetch(item);
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
        if (this.issuesRequest == null && highlightedOrSelected) {
            const contentId = highlightedOrSelected.getContentSummary().getContentId();
            this.issuesRequest = this.findIssues(contentId)
                .catch(DefaultErrorHandler.handle)
                .finally(() => {
                    this.issuesRequest = undefined;
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
        action.onExecuted(() => {
            IssueDialogsManager.get().openDetailsDialog(issue);
        });
        return action;
    }
}
