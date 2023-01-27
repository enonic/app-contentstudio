import {PropertyEvent} from '@enonic/lib-admin-ui/data/PropertyEvent';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {Issue} from '../issue/Issue';
import {CreateIssueDialog} from '../issue/view/CreateIssueDialog';
import {PublishDialogDependantList} from '../publish/PublishDialogDependantList';
import {PublishDialogItemList} from '../publish/PublishDialogItemList';
import {PublishProcessor} from '../publish/PublishProcessor';
import {PublishScheduleForm} from '../publish/PublishScheduleForm';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import {MarkAsReadyRequest} from '../resource/MarkAsReadyRequest';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from './DependantItemsWithProgressDialog';
import {DialogErrorsStateBar} from './DialogErrorsStateBar';
import {DialogErrorStateEntry} from './DialogErrorStateEntry';

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    private currentUser: Principal;

    protected publishProcessor: PublishProcessor;

    protected publishScheduleForm: PublishScheduleForm;

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
            actionButtons: [{
                label: i18n('dialog.publish.exclude.invalid'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeInvalid();
                },
            }],
        });

        const allowContentUpdate = CONFIG.isTrue('allowContentUpdate');
        this.inProgressErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.inProgress'),
            iconClass: 'icon-state-in-progress',
            actionButtons: [{
                label: i18n('dialog.publish.exclude.inProgress'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeInProgress();
                },
            }, ...(!allowContentUpdate ? [] : [{
                label: i18n('action.markAsReady'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.markAllAsReady();
                },
            }])],
        });

        this.noPermissionsErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.noPermissions'),
            actionButtons: [{
                label: i18n('dialog.publish.exclude.noPermissions'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeNotPublishable();
                },
            }],
        });

        this.stateBar.markChecking(true);
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(CreateIssueDialog.get());

        this.lockControls();
    }

    getButtonRow(): DropdownButtonRow {
        return super.getButtonRow() as DropdownButtonRow;
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

        if (this.isVisible()) {
            this.stateBar.markChecking(false);
        }
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
            this.invalidErrorEntry.updateCount(this.publishProcessor.getInvalidCount());
            this.invalidErrorEntry.markNonInteractive(!this.publishProcessor.canExcludeInvalid());

            this.inProgressErrorEntry.updateCount(this.publishProcessor.getInProgressCount());
            this.inProgressErrorEntry.markNonInteractive(!this.publishProcessor.canExcludeInProgress(), 0);

            this.noPermissionsErrorEntry.updateCount(this.publishProcessor.getNotPublishableCount());
            this.noPermissionsErrorEntry.markNonInteractive(!this.publishProcessor.canExcludeNotPublishable());
        }
    }

    protected updateControls(itemsToPublish: number = this.countTotal()) {
        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();

        const canPublish: boolean = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        this.scheduleFormToggle.getEl().setDisabled(this.publishProcessor.isAllPendingDelete() || !canPublish);
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

    protected async markAllAsReady(): Promise<void> {
        this.lockControls();

        const ids: ContentId[] = this.publishProcessor.getContentIsProgressIds();

        return await new MarkAsReadyRequest(ids).sendAndParse()
            .then(() => showFeedback(i18n('notify.item.markedAsReady.multiple', ids.length)))
            .catch(e => {
                DefaultErrorHandler.handle(e);
                this.stateBar.markChecking(false);
                this.unlockControls();
            });
    }

    protected lockControls() {
        super.lockControls();
        this.stateBar.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.stateBar.setEnabled(true);
    }
}
