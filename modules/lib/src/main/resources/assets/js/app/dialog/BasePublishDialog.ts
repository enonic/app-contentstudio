import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from './DependantItemsWithProgressDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {PublishProcessor} from '../publish/PublishProcessor';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {Issue} from '../issue/Issue';
import {PublishDialogItemList} from '../publish/PublishDialogItemList';
import {PublishDialogDependantList} from '../publish/PublishDialogDependantList';
import {CreateIssueDialog} from '../issue/view/CreateIssueDialog';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import {PublishIssuesStateBar} from '../publish/PublishIssuesStateBar';
import {PublishScheduleForm} from '../publish/PublishScheduleForm';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {PropertyEvent} from 'lib-admin-ui/data/PropertyEvent';
import {Principal} from 'lib-admin-ui/security/Principal';
import {PropertySet} from 'lib-admin-ui/data/PropertySet';
import {ButtonEl} from 'lib-admin-ui/dom/ButtonEl';
import {IsAuthenticatedRequest} from 'lib-admin-ui/security/auth/IsAuthenticatedRequest';
import {DropdownButtonRow} from 'lib-admin-ui/ui/dialog/DropdownButtonRow';
import {MarkAsReadyRequest} from '../resource/MarkAsReadyRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
import {showFeedback} from 'lib-admin-ui/notify/MessageBus';

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    private currentUser: Principal;

    protected publishProcessor: PublishProcessor;

    protected publishIssuesStateBar: PublishIssuesStateBar;

    protected publishScheduleForm: PublishScheduleForm;

    protected markAllAsReadyAction: Action;

    protected scheduleFormPropertySet: PropertySet;

    protected scheduleFormToggle: ButtonEl;

    constructor(config: DependantItemsWithProgressDialogConfig) {
        super(config);

        this.loadCurrentUser();
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

    protected initElements() {
        this.initActions();

        super.initElements();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());

        this.publishIssuesStateBar = new PublishIssuesStateBar();

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

        this.publishProcessor.onLoadingStarted(this.handleLoadStarted.bind(this));
        this.publishProcessor.onLoadingFinished(this.handleLoadFinished.bind(this));
        this.publishProcessor.onLoadingFailed(this.handleLoadFailed.bind(this));
        this.publishProcessor.onItemsChanged(this.handleLoadFinished.bind(this));

        this.publishIssuesStateBar.onExcludeAllInProgressClicked(() => {
            this.publishProcessor.excludeItems(this.publishProcessor.getInProgressIdsWithoutInvalid());
        });

        this.publishIssuesStateBar.onExcludeAllInvalidClicked(() => {
            this.publishProcessor.excludeItems(this.publishProcessor.getInvalidIds());
        });

        this.handleIssueGlobalEvents();
    }

    private handleLoadStarted() {
        this.lockControls();
        this.showLoadMask();
        this.setSubTitle(i18n('dialog.publish.resolving'));
        this.publishIssuesStateBar.reset();
    }

    private handleLoadFinished() {
        const header: string = this.getDependantsHeader(this.getDependantList().isVisible());
        this.updateDependantsHeader(header);
        this.updateChildItemsToggler();

        if (this.publishProcessor.containsInvalidDependants() || this.publishProcessor.containsItemsInProgress() ||
            this.publishProcessor.isCheckPublishable() && !this.isAllPublishable()) {
            this.setDependantListVisible(true);
        }

        this.hideLoadMask();

        const itemsToPublish: number = this.countTotal();
        this.updateSubTitle(itemsToPublish);
        this.updateButtonCount(null, itemsToPublish);
        this.updateControls(itemsToPublish);
    }

    private handleLoadFailed() {
        this.publishIssuesStateBar.showLoadFailed();
        this.publishIssuesStateBar.addClass('has-issues');
        this.toggleAction(false);
        this.hideLoadMask();
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

    protected updateSubTitle(itemsToPublish: number = this.countTotal()) {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        const needPublish = this.publishProcessor.isCheckPublishable();
        const allPublishable: boolean = this.isAllPublishable();

        if ((!needPublish || allPublishable) && allValid && !containsItemsInProgress) {
            this.publishIssuesStateBar.removeClass('has-issues');
            this.publishIssuesStateBar.reset();
        } else {
            this.publishIssuesStateBar.addClass('has-issues');
            this.publishIssuesStateBar.setContainsInProgress(this.publishProcessor.getInProgressIdsWithoutInvalid().length > 0);
            this.publishIssuesStateBar.setTotalInProgress(this.publishProcessor.getTotalExcludableInProgress());
            this.publishIssuesStateBar.setTotalInvalid(this.publishProcessor.getTotalExcludableInvalid());
            this.publishIssuesStateBar.setContainsInvalid(!allValid);
            this.publishIssuesStateBar.setContainsNotPublishableVisible(!allPublishable);
        }
    }

    protected updateControls(itemsToPublish: number = this.countTotal()) {
        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();

        const canPublish: boolean = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        this.scheduleFormToggle.getEl().setDisabled(this.publishProcessor.isAllPendingDelete() || !canPublish);

        this.getButtonRow().setTotalInProgress(this.publishProcessor.getInProgressIdsWithoutInvalid().length);
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
        const allow = CONFIG.allowContentUpdate === 'true';
        this.markAllAsReadyAction = new Action(i18n('action.markAsReady')).onExecuted(this.markAllAsReady.bind(this)).setEnabled(allow);
    }

    protected toggleAction(enable: boolean) {
        this.toggleControls(enable);
        this.toggleClass('no-action', !enable);
    }

    private loadCurrentUser() {
        return new IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
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

    open() {
        this.publishProcessor.setIgnoreDependantItemsChanged(false);
        this.publishIssuesStateBar.reset();
        CreateIssueDialog.get().reset();

        super.open();
    }

    close() {
        super.close();
        this.publishProcessor.reset();
        CreateIssueDialog.get().reset();
    }

    private markAllAsReady() {
        const ids: ContentId[] = this.publishProcessor.getContentIsProgressIds();

        new MarkAsReadyRequest(ids).sendAndParse()
            .then(() => showFeedback(i18n('notify.item.markedAsReady.multiple', ids.length)))
            .catch(DefaultErrorHandler.handle);
    }
}

export class PublishDialogButtonRow
    extends DropdownButtonRow {

    setTotalInProgress(totalInProgress: number) {
        this.toggleClass('has-items-in-progress', totalInProgress > 0);
        this.getMenuActions()[0].setLabel(i18n('action.markAsReadyTotal', totalInProgress));
    }
}
