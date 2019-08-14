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
import DropdownButtonRow = api.ui.dialog.DropdownButtonRow;
import ContentId = api.content.ContentId;
import ListBox = api.ui.selector.list.ListBox;
import i18n = api.util.i18n;
import PropertyEvent = api.data.PropertyEvent;

export abstract class BasePublishDialog
    extends DependantItemsWithProgressDialog {

    private currentUser: api.security.Principal;

    protected publishProcessor: PublishProcessor;

    protected publishIssuesStateBar: PublishIssuesStateBar;

    protected publishScheduleForm: PublishScheduleForm;

    protected scheduleFormPropertySet: api.data.PropertySet;

    protected scheduleFormToggle: api.dom.ButtonEl;

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

        this.scheduleFormPropertySet = new api.data.PropertySet();
        this.publishScheduleForm = new PublishScheduleForm(this.scheduleFormPropertySet);

        this.scheduleFormToggle = this.publishScheduleForm.createExternalToggle();

        this.publishScheduleForm.layout(false);
        this.scheduleFormPropertySet.onChanged((event: PropertyEvent) => {
            this.updateControls();
        });
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.updateControls();
        });
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(CreateIssueDialog.get());

        this.lockControls();
    }

    protected shouldCheckPublish(): boolean {
        return true;
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingStarted(this.handleLoadStarted.bind(this));
        this.publishProcessor.onLoadingFinished(this.handleLoadFinished.bind(this));
        this.publishProcessor.onLoadingFailed(this.handleLoadFailed.bind(this));
        this.publishProcessor.onItemsChanged(this.handleLoadFinished.bind(this));

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

        if (this.publishProcessor.containsInvalidDependants() || this.shouldCheckPublish() && !this.isAllPublishable()) {
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
        const needPublish = this.shouldCheckPublish();
        const allPublishable: boolean = this.isAllPublishable();

        if ((!needPublish || allPublishable) && allValid && !containsItemsInProgress) {
            this.publishIssuesStateBar.removeClass('has-issues');
            this.publishIssuesStateBar.reset();
            return;
        }

        this.publishIssuesStateBar.addClass('has-issues');
        if (containsItemsInProgress) {
            this.publishIssuesStateBar.showContainsInProgress();
        }

        if (!allValid) {
            this.publishIssuesStateBar.showContainsInvalid();
        }

        if (!allPublishable) {
            this.publishIssuesStateBar.showContainsNotPublishable();
        }
    }

    protected updateControls(itemsToPublish: number = this.countTotal()) {
        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
    }

    protected isCanPublish(itemsToPublish: number): boolean {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const needPublishable = this.shouldCheckPublish();
        const allPublishable: boolean = this.isAllPublishable();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        return itemsToPublish > 0 && allValid && (!needPublishable || allPublishable) && !containsItemsInProgress;
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

    getButtonRow(): DropdownButtonRow {
        return <DropdownButtonRow>super.getButtonRow();
    }

    protected initActions() {
        // used in descendants
    }

    protected toggleAction(enable: boolean) {
        this.toggleControls(enable);
        this.toggleClass('no-action', !enable);
    }

    protected hasSubDialog(): boolean {
        return this.isMasked();
    }

    private loadCurrentUser() {
        return new api.security.auth.IsAuthenticatedRequest().sendAndParse().then((loginResult) => {
            this.currentUser = loginResult.getUser();
        });
    }

    private handleIssueGlobalEvents() {

        IssueServerEventsHandler.getInstance().onIssueCreated((issues: Issue[]) => {
            if (this.isVisible()) {
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

    protected reloadPublishDependencies() {
        if (this.isProgressBarEnabled()) {
            return;
        }

        this.publishProcessor.reloadPublishDependencies(true);
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

    open() {
        this.publishProcessor.resetExcludedIds();
        this.publishProcessor.setIgnoreDependantItemsChanged(false);

        CreateIssueDialog.get().reset();

        this.reloadPublishDependencies();

        super.open();
    }

    close() {
        super.close();
        this.getItemList().clearExcludeChildrenIds();

        CreateIssueDialog.get().reset();
    }
}
