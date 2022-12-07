import * as Q from 'q';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from './DependantItemsWithProgressDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {PublishProcessor} from '../publish/PublishProcessor';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {Issue} from '../issue/Issue';
import {PublishDialogItemList} from '../publish/PublishDialogItemList';
import {PublishDialogDependantList} from '../publish/PublishDialogDependantList';
import {CreateIssueDialog} from '../issue/view/CreateIssueDialog';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import {PublishScheduleForm} from '../publish/PublishScheduleForm';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {PropertyEvent} from '@enonic/lib-admin-ui/data/PropertyEvent';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {MarkAsReadyRequest} from '../resource/MarkAsReadyRequest';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {ContentId} from '../content/ContentId';
import {MenuItem} from '@enonic/lib-admin-ui/ui/menu/MenuItem';
import {MenuButton} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {AccessibilityHelper} from '../util/AccessibilityHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {DialogErrorsStateBar} from './DialogErrorsStateBar';
import {DialogErrorStateEntry} from './DialogErrorStateEntry';

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    private currentUser: Principal;

    protected publishProcessor: PublishProcessor;

    protected publishScheduleForm: PublishScheduleForm;

    protected markAllAsReadyAction: Action;

    protected scheduleFormPropertySet: PropertySet;

    protected scheduleFormToggle: ButtonEl;

    protected stateBar: DialogErrorsStateBar;

    private invalidErrorEntry: DialogErrorStateEntry;

    private inProgressErrorEntry: DialogErrorStateEntry;

    private noPermissionsErrorEntry: DialogErrorStateEntry;

    protected constructor(config: DependantItemsWithProgressDialogConfig) {
        super(config);

        this.loadCurrentUser().catch(DefaultErrorHandler.handle);
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new PublishDialogItemList();
    }

    protected getItemList(): PublishDialogItemList {
        return <PublishDialogItemList>super.getItemList();
    }

    protected createDependantList(): PublishDialogDependantList {
        return new PublishDialogDependantList();
    }

    protected getDependantList(): PublishDialogDependantList {
        return <PublishDialogDependantList>super.getDependantList();
    }

    protected initElements(): void {
        this.initActions();

        super.initElements();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());

        this.initStateBar();

        this.scheduleFormPropertySet = new PropertySet();
        this.publishScheduleForm = new PublishScheduleForm(this.scheduleFormPropertySet);

        this.scheduleFormToggle = this.publishScheduleForm.createExternalToggle();

        this.publishScheduleForm.layout(false);
        this.scheduleFormPropertySet.onChanged((event: PropertyEvent) => {
            this.updateControls();
        });
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.updateControls();
            this.notifyResize();
        });
    }

    protected initStateBar(): void {
        this.stateBar = new DialogErrorsStateBar({
            failText: i18n('dialog.publish.error.loadFailed'),
            resolvedText: i18n('dialog.publish.error.resolved'),
        });

        this.invalidErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.invalid'),
            iconClass: 'icon-state-invalid',
            actionButton: {
                label: i18n('dialog.publish.exclude.invalid'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeItems(this.publishProcessor.getInvalidIds());
                },
            },
        });

        this.inProgressErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.inProgress'),
            iconClass: 'icon-state-in-progress',
            actionButton: {
                label: i18n('dialog.publish.exclude.inProgress'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeItems(this.publishProcessor.getInProgressIdsWithoutInvalid());
                },
            },
        });

        this.noPermissionsErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.noPermissions'),
            actionButton: {
                label: i18n('dialog.publish.exclude.noPermissions'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeItems(this.publishProcessor.getNotPublishableIds());
                },
            },
        });

        this.stateBar.markChecking(true);
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(CreateIssueDialog.get());

        this.lockControls();
    }

    getButtonRow(): PublishDialogButtonRow {
        return <PublishDialogButtonRow>super.getButtonRow();
    }

    protected initListeners() {
        super.initListeners();

        // TODO: This delay was added to make UI transitions smooth. Consider removing it later
        const debouncedFinishedHandler = AppHelper.debounce(() => this.handleLoadFinished(), 500);

        this.publishProcessor.onLoadingStarted(() => this.handleLoadStarted());
        this.publishProcessor.onLoadingFinished(debouncedFinishedHandler);
        this.publishProcessor.onLoadingFailed(() => this.handleLoadFailed());
        this.publishProcessor.onItemsChanged(debouncedFinishedHandler);

        this.handleIssueGlobalEvents();
    }

    private handleLoadStarted(): void {
        this.lockControls();
        this.setSubTitle(i18n('dialog.publish.resolving'));
        this.stateBar.markChecking(true);
        this.stateBar.reset();
    }

    private handleLoadFinished(): void {
        const header: string = this.getDependantsHeader(this.getDependantList().isVisible());
        this.updateDependantsHeader(header);
        this.updateChildItemsToggler();

        if (this.publishProcessor.containsInvalidDependants() || this.publishProcessor.containsItemsInProgress() ||
            this.publishProcessor.isCheckPublishable() && !this.isAllPublishable()) {
            this.setDependantListVisible(true);
        }

        // updateCount
        const itemsToPublish = this.countTotal();
        const isNoItems = itemsToPublish === 0;
        this.stateBar.toggleHideIfResolved(isNoItems);

        this.updateSubTitle(itemsToPublish);
        this.updateButtonCount(null, itemsToPublish);
        this.unlockControls();
        this.updateControls(itemsToPublish);

        this.stateBar.markChecking(false);
    }

    private handleLoadFailed() {
        this.stateBar.markErrored();
        this.scheduleFormToggle.setEnabled(false);
    }

    private updateChildItemsToggler() {
        const ids: ContentId[] = this.getContentToPublishIds();

        new HasUnpublishedChildrenRequest(ids).sendAndParse().then((children) => {
            const toggleable = children.getResult().some(requestedResult => requestedResult.getHasChildren());
            this.getItemList().setContainsToggleable(toggleable);

            children.getResult().forEach((requestedResult) => {
                const item = this.getItemList().getItemViewById(requestedResult.getId());

                if (item) {
                    item.setTogglerActive(requestedResult.getHasChildren());
                }
            });
        });
    }

    protected updateSubTitle(itemsToPublish: number) {
        const isAllValid = this.areItemsAndDependantsValid();
        const hasInProgress = this.containsItemsInProgress();
        const isNeedPublish = this.publishProcessor.isCheckPublishable();
        const isAllPublishable = this.isAllPublishable();

        if ((!isNeedPublish || isAllPublishable) && isAllValid && !hasInProgress) {
            this.stateBar.reset();
        } else {
            this.invalidErrorEntry.updateCount(this.publishProcessor.getTotalInvalid());
            this.invalidErrorEntry.markNonInteractive(this.publishProcessor.hasNotExcludedInvalid());

            this.inProgressErrorEntry.updateCount(this.publishProcessor.getTotalInProgress());
            this.inProgressErrorEntry.markNonInteractive(this.publishProcessor.hasNotExcludedInProgress());

            this.noPermissionsErrorEntry.updateCount(this.publishProcessor.getTotalNotPublishable());
            this.noPermissionsErrorEntry.markNonInteractive(this.publishProcessor.hasNotExcludedNotPublishable());
        }
    }

    protected updateControls(itemsToPublish: number = this.countTotal()) {
        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();

        const canPublish: boolean = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        this.scheduleFormToggle.getEl().setDisabled(this.publishProcessor.isAllPendingDelete() || !canPublish);

        this.getButtonRow().setTotalInProgress(this.getTotalInProgressWithoutInvalid());
    }

    private getTotalInProgressWithoutInvalid(): number {
        return this.publishProcessor.getInProgressIdsWithoutInvalid().length;
    }

    protected isScheduleFormValid(): boolean {
        return !this.publishScheduleForm.isFormVisible() || this.publishScheduleForm.isFormValid();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addClass('schedulable-dialog');

            return rendered;
        });
    }

    protected initActions() {
        const allow = CONFIG.isTrue('allowContentUpdate');
        this.markAllAsReadyAction = new Action(i18n('action.markAsReady')).onExecuted(this.markAllAsReady.bind(this)).setEnabled(allow);
    }

    private loadCurrentUser(): Q.Promise<void> {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult: LoginResult) => {
            this.currentUser = loginResult.getUser();
        });
    }

    private handleIssueGlobalEvents() {

        IssueServerEventsHandler.getInstance().onIssueCreated((issues: Issue[]) => {
            if (this.isOpen()) {
                if (issues.some((issue) => this.isIssueCreatedByCurrentUser(issue))) {
                    this.close();
                }
            }
        });
    }

    isIssueCreatedByCurrentUser(issue: Issue): boolean {
        if (!issue.getCreator()) {
            return false;
        }

        return issue.getCreator() === this.currentUser.getKey().toString();
    }

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]): BasePublishDialog {
        if (this.isProgressBarEnabled()) {
            return this;
        }
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        return this;
    }

    protected countTotal(): number {
        return this.publishProcessor.countTotal();
    }

    protected getDependantIds(): ContentId[] {
        return this.publishProcessor.getDependantIds();
    }

    protected setIgnoreItemsChanged(value: boolean) {
        super.setIgnoreItemsChanged(value);
        this.publishProcessor.setIgnoreItemsChanged(value);
    }

    protected getContentToPublishIds(): ContentId[] {
        return this.publishProcessor.getContentToPublishIds();
    }

    protected getExcludedIds(): ContentId[] {
        return this.publishProcessor.getExcludedIds();
    }

    public setExcludedIds(ids: ContentId[]): BasePublishDialog {
        this.publishProcessor.setExcludedIds(ids);
        return this;
    }

    setDependantItems(items: ContentSummaryAndCompareStatus[]) {
        if (this.isProgressBarEnabled()) {
            return;
        }
        super.setDependantItems(items);
    }

    protected containsItemsInProgress(): boolean {
        return this.publishProcessor.containsItemsInProgress();
    }

    protected areItemsAndDependantsValid(): boolean {
        return !this.publishProcessor.containsInvalidItems();
    }

    protected isAllPublishable(): boolean {
        return this.publishProcessor && this.publishProcessor.isAllPublishable();
    }

    protected isAllPendingDelete(): boolean {
        return this.publishProcessor && this.publishProcessor.isAllPendingDelete();
    }

    open(): void {
        this.publishProcessor.setIgnoreDependantItemsChanged(false);
        this.stateBar.markChecking(true);
        CreateIssueDialog.get().reset();

        super.open();
    }

    close(): void {
        super.close();
        this.publishProcessor.reset();
        this.stateBar.reset();
        CreateIssueDialog.get().reset();
    }

    private markAllAsReady() {
        const ids: ContentId[] = this.publishProcessor.getContentIsProgressIds();
        this.lockControls();
        this.stateBar.markChecking(true);

        new MarkAsReadyRequest(ids).sendAndParse()
            .then(() => showFeedback(i18n('notify.item.markedAsReady.multiple', ids.length)))
            .catch(DefaultErrorHandler.handle)
            .finally(() => {
                this.stateBar.markChecking(false);
                this.unlockControls();
            });
    }

    protected lockControls() {
        super.lockControls();
        this.stateBar.setEnabled(false);
        this.getButtonRow().getActionMenu().setDropdownHandleEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.stateBar.setEnabled(true);
        this.getButtonRow().getActionMenu().setDropdownHandleEnabled(this.getTotalInProgressWithoutInvalid() > 0);
    }
}

export class PublishDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(mainAction: Action, menuActions: Action[], useDefault?: boolean): MenuButton {
        const menuButton: MenuButton = super.makeActionMenu(mainAction, menuActions, useDefault);
        this.addAccessibilityToMarkAsReadyTotalElement();
        return menuButton;
    }

    setTotalInProgress(totalInProgress: number) {
        this.toggleClass('has-items-in-progress', totalInProgress > 0);
        this.getMenuActions()[0].setLabel(i18n('action.markAsReadyTotal', totalInProgress));
    }

    private addAccessibilityToMarkAsReadyTotalElement(): void{
        const markAsReadyMenuItem: MenuItem = this.actionMenu.getMenuItem(this.getMenuActions()[0]);
        AccessibilityHelper.tabIndex(markAsReadyMenuItem);
    }
}
