import {PropertyEvent} from '@enonic/lib-admin-ui/data/PropertyEvent';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {IsAuthenticatedRequest} from '@enonic/lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {LoginResult} from '@enonic/lib-admin-ui/security/auth/LoginResult';
import {Principal} from '@enonic/lib-admin-ui/security/Principal';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
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
import {DialogStateBar} from './DialogStateBar';
import {DialogStateEntry} from './DialogStateEntry';

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    private currentUser: Principal;

    protected publishProcessor: PublishProcessor;

    protected publishScheduleForm: PublishScheduleForm;

    protected scheduleFormPropertySet: PropertySet;

    protected scheduleFormToggle: ButtonEl;

    protected stateBar: DialogStateBar;

    private invalidErrorEntry: DialogStateEntry;

    private inProgressErrorEntry: DialogStateEntry;

    private noPermissionsErrorEntry: DialogStateEntry;

    private isLoading: boolean = false;

    protected constructor(config: Omit<DependantItemsWithProgressDialogConfig, 'controls'>) {
        super({
            ...config,
            controls: true,
        });

        this.loadCurrentUser().catch(DefaultErrorHandler.handle);
    }

    protected createItemList(): PublishDialogItemList {
        return new PublishDialogItemList();
    }

    protected getItemList(): PublishDialogItemList {
        return super.getItemList() as PublishDialogItemList;
    }

    protected createDependantList(): PublishDialogDependantList {
        const observer = this.createObserverConfig();
        return new PublishDialogDependantList(observer);
    }

    protected getDependantList(): PublishDialogDependantList {
        return super.getDependantList() as PublishDialogDependantList;
    }

    protected initElements(): void {
        super.initElements();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());

        this.initStateBar();

        this.scheduleFormPropertySet = new PropertySet();
        this.publishScheduleForm = new PublishScheduleForm(this.scheduleFormPropertySet);
        this.publishScheduleForm.hide();

        this.scheduleFormToggle = this.publishScheduleForm.createExternalToggle();

        this.publishScheduleForm.layout(false);
        this.scheduleFormPropertySet.onChanged((event: PropertyEvent) => {
            this.updateControls();
        });
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.publishScheduleForm.setVisible(visible);
            this.updateControls();
            this.notifyResize();
        });
    }

    protected initStateBar(): void {
        this.stateBar = new DialogStateBar({
            failText: i18n('dialog.publish.error.loadFailed'),
            resolvedText: i18n('dialog.publish.error.resolved'),
            edit: {
                applyHandler: () => {
                    this.getDependantList().saveExclusions();
                    this.markEditing(false);
                },
                cancelHandler: () => {
                    this.getDependantList().restoreExclusions();
                    this.markEditing(false);
                },
            }
        });

        this.invalidErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.invalid'),
            icon: 'icon-state-invalid',
            actionButtons: [{
                label: i18n('dialog.publish.exclude'),
                handler: () => {
                    this.stateBar.markChecking(true);
                    this.publishProcessor.excludeInvalid();
                },
            }],
        });

        const allowContentUpdate = CONFIG.isTrue('allowContentUpdate');
        this.inProgressErrorEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.publish.error.inProgress'),
            icon: 'icon-state-in-progress',
            actionButtons: [{
                label: i18n('dialog.publish.exclude'),
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

    setKeepDependencies(keepDependencies: boolean): this {
        this.publishProcessor.setKeepDependencies(keepDependencies);
        return this;
    }

    getButtonRow(): DropdownButtonRow {
        return super.getButtonRow() as DropdownButtonRow;
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingStarted((checking) => this.handleLoadStarted(checking));
        this.publishProcessor.onLoadingFinished(() => this.handleLoadFinished());
        this.publishProcessor.onLoadingFailed(() => this.handleLoadFailed());
        this.publishProcessor.onItemsChanged(() => {
            if (!this.isLoading) {
                this.handleLoadFinished();
            }
        });

        this.handleIssueGlobalEvents();

        this.getDependantList().onSelectionChanged((original) => {
            this.stateBar.markEditing(!original);
            this.markEditing(!original);
        });

        this.getDependantList().onVisibleUpdated(() => {
            this.refreshControls();
        });

        this.excludedToggler.onActiveChanged(loadExcluded => this.publishProcessor.updateLoadExcluded(loadExcluded));
    }

    private handleLoadStarted(checking: boolean): void {
        this.isLoading = true;
        this.lockControls();
        if (checking) {
            this.setSubTitle(i18n('dialog.publish.resolving'));
            this.stateBar.markChecking(true);
            this.stateBar.reset();
        }
    }

    private handleLoadFinished(): void {
        this.isLoading = false;
        this.updateChildItemsToggler();

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
        this.isLoading = false;
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
        this.scheduleFormToggle.setEnabled(this.publishProcessor.hasSchedulable() && canPublish);
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

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]): this {
        if (!this.isProgressBarEnabled()) {
            this.setItems(contents, true);
        }

        return this;
    }

    setItems(items: ContentSummaryAndCompareStatus[], silent?: boolean): void {
        const canBeSilent = !!silent && !this.isIgnoreItemsChanged();

        if (canBeSilent) {
            this.setIgnoreItemsChanged(true);
        }

        this.setListItems(items, silent);

        if (canBeSilent) {
            this.setIgnoreItemsChanged(false);
        }
    }

    protected countTotal(): number {
        return this.publishProcessor.countTotal();
    }

    protected getDependantIds(withExcluded?: boolean): ContentId[] {
        return this.publishProcessor.getVisibleDependantIds(withExcluded);
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
        return !this.publishProcessor?.containsInvalidItems();
    }

    protected isAllPublishable(): boolean {
        return !!this.publishProcessor?.isAllPublishable();
    }

    protected isSomePublishable(): boolean {
        return !!this.publishProcessor?.isSomePublishable();
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

    protected lockControls(): void {
        super.lockControls();
        this.stateBar.setEnabled(false);
    }

    protected unlockControls(): void {
        super.unlockControls();
        this.stateBar.setEnabled(true);
    }
}
