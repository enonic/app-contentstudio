import {PropertyEvent} from '@enonic/lib-admin-ui/data/PropertyEvent';
import {PropertySet} from '@enonic/lib-admin-ui/data/PropertySet';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {ButtonEl} from '@enonic/lib-admin-ui/dom/ButtonEl';
import {showFeedback} from '@enonic/lib-admin-ui/notify/MessageBus';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import Q from 'q';
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
import {AuthContext} from '@enonic/lib-admin-ui/auth/AuthContext';
import {SelectionStatusBarElement} from '../ui2/dialog/SelectionStatusBar';
import {PublishItemsListElement} from '../ui2/list/PublishItemsList';

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    protected publishProcessor: PublishProcessor;

    protected publishScheduleForm: PublishScheduleForm;

    protected scheduleFormPropertySet: PropertySet;

    protected scheduleFormToggle: ButtonEl;

    protected statusBar: SelectionStatusBarElement;

    private isLoading: boolean = false;

    protected constructor(config: Omit<DependantItemsWithProgressDialogConfig, 'controls'>) {
        super({
            ...config,
            controls: true,
        });
    }

    protected createItemList(): PublishDialogItemList | PublishItemsListElement {
        return new PublishDialogItemList();
    }

    protected getItemList(): PublishDialogItemList | PublishItemsListElement {
        return super.getItemList() as PublishDialogItemList | PublishItemsListElement;
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
        const allowContentUpdate = CONFIG.isTrue('allowContentUpdate');

        this.statusBar = new SelectionStatusBarElement({
            loading: true,
            onApply: () => {
                this.getDependantList().saveExclusions();
                this.statusBar.setEditing(false);
                this.markEditing(false);
            },
            onCancel: () => {
                this.getDependantList().restoreExclusions();
                this.statusBar.setEditing(false);
                this.markEditing(false);
            },
            errors: {
                inProgress: {
                    count: this.publishProcessor.getInProgressCount(),
                    disabled: !this.publishProcessor.canExcludeInProgress(),
                    onExclude: () => {
                        this.publishProcessor.excludeInProgress();
                    },
                    onMarkAsReady: allowContentUpdate ? () => {
                        this.markAllAsReady();
                    } : undefined,
                },
                invalid: {
                    count: this.publishProcessor.getInvalidCount(),
                    disabled: !this.publishProcessor.canExcludeInvalid(),
                    onExclude: () => {
                        this.publishProcessor.excludeInvalid();
                    },
                },
                noPermissions: {
                    count: this.publishProcessor.getNotPublishableCount(),
                    disabled: !this.publishProcessor.canExcludeNotPublishable(),
                    onExclude: () => {
                        this.publishProcessor.excludeNotPublishable();
                    },
                },

            },
        });
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
            this.statusBar.setEditing(!original);
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
            this.statusBar.setLoading(true);
            this.statusBar.reset();
        }
    }

    private handleLoadFinished(): void {
        this.isLoading = false;
        this.updateChildItemsToggler();

        // updateCount
        const itemsToPublish = this.countTotal();

        this.updateSubTitle();
        this.updateButtonCount(null, itemsToPublish);
        this.unlockControls();
        this.updateControls(itemsToPublish);

        if (this.isVisible()) {
            this.statusBar.setLoading(false);
        }
    }

    private handleLoadFailed() {
        this.isLoading = false;
        this.statusBar.setFailed(true);
        this.scheduleFormToggle.setEnabled(false);
    }

    private updateChildItemsToggler() {
        const ids: ContentId[] = this.getContentToPublishIds();

        const itemList = this.getItemList();
        // TODO: Enonic UI - Implement for PublishItemsListElement
        if (itemList instanceof PublishDialogItemList) {
            new HasUnpublishedChildrenRequest(ids).sendAndParse().then((children) => {
                const toggleable = children.getResult().some(requestedResult => requestedResult.getHasChildren());
                itemList.setContainsToggleable(toggleable);

                children.getResult().forEach((requestedResult) => {
                    const item = itemList.getItemViewById(requestedResult.getId());

                    if (item) {
                        item.setTogglerActive(requestedResult.getHasChildren());
                    }
                });
            });
        }
    }

    protected updateSubTitle() {
        const isAllValid = this.areItemsAndDependantsValid();
        const hasInProgress = this.containsItemsInProgress();
        const isNeedPublish = this.publishProcessor.isCheckPublishable();
        const isAllPublishable = this.isAllPublishable();

        if ((!isNeedPublish || isAllPublishable) && isAllValid && !hasInProgress) {
            this.statusBar.reset();
        } else {
            this.statusBar.setErrorCount('invalid', this.publishProcessor.getInvalidCount());
            this.statusBar.setErrorCount('inProgress', this.publishProcessor.getInProgressCount());
            this.statusBar.setErrorCount('noPermissions', this.publishProcessor.getNotPublishableCount());

            this.statusBar.setErrorDisabled('invalid', !this.publishProcessor.canExcludeInvalid());
            this.statusBar.setErrorDisabled('inProgress', !this.publishProcessor.canExcludeInProgress());
            this.statusBar.setErrorDisabled('noPermissions', !this.publishProcessor.canExcludeNotPublishable());
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

        return issue.getCreator() === AuthContext.get().getUser().getKey().toString();
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
        this.statusBar.setLoading(true);
        CreateIssueDialog.get().reset();

        super.open();
    }

    close(): void {
        super.close();
        this.publishProcessor.reset();
        this.statusBar.reset();
        CreateIssueDialog.get().reset();
    }

    protected async markAllAsReady(): Promise<void> {
        this.lockControls();

        const ids: ContentId[] = this.publishProcessor.getContentIsProgressIds();

        return await new MarkAsReadyRequest(ids).sendAndParse()
            .then(() => showFeedback(i18n('notify.item.markedAsReady.multiple', ids.length)))
            .catch(e => {
                DefaultErrorHandler.handle(e);
                this.statusBar.setLoading(false);
                this.unlockControls();
            });
    }

    protected lockControls(): void {
        super.lockControls();
        this.statusBar.setLoading(false);
    }

    protected unlockControls(): void {
        super.unlockControls();
        this.statusBar.setLoading(true);
    }
}
