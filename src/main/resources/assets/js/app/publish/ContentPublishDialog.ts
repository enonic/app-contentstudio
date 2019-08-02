import {PublishDialogDependantList} from './PublishDialogDependantList';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {PublishDialogItemList} from './PublishDialogItemList';
import {CreateIssueDialog} from '../issue/view/CreateIssueDialog';
import {PublishProcessor} from './PublishProcessor';
import {IssueServerEventsHandler} from '../issue/event/IssueServerEventsHandler';
import {Issue} from '../issue/Issue';
import {ContentPublishDialogAction} from './ContentPublishDialogAction';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {PublishContentRequest} from '../resource/PublishContentRequest';
import {HasUnpublishedChildrenRequest} from '../resource/HasUnpublishedChildrenRequest';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {CompareStatus} from '../content/CompareStatus';
import {PublishIssuesStateBar} from './PublishIssuesStateBar';
import {PublishScheduleForm} from './PublishScheduleForm';
import ContentId = api.content.ContentId;
import ListBox = api.ui.selector.list.ListBox;
import MenuButton = api.ui.button.MenuButton;
import Action = api.ui.Action;
import Principal = api.security.Principal;
import DropdownButtonRow = api.ui.dialog.DropdownButtonRow;
import i18n = api.util.i18n;
import KeyHelper = api.ui.KeyHelper;
import PropertyEvent = api.data.PropertyEvent;
import TaskState = api.task.TaskState;

/**
 * ContentPublishDialog manages list of initially checked (initially requested) items resolved via ResolvePublishDependencies command.
 * Resolved items are converted into array of SelectionPublishItem<ContentPublishItem> items and stored in selectionItems property.
 * Dependant items number will change depending on includeChildren checkbox state as
 * resolved dependencies usually differ in that case.
 */
export class ContentPublishDialog
    extends BasePublishDialog {

    private static INSTANCE: ContentPublishDialog;

    private publishAction: Action;

    private publishProcessor: PublishProcessor;

    private currentUser: Principal;

    private publishSubTitle: ContentPublishDialogSubTitle;

    private publishScheduleForm: PublishScheduleForm;

    private scheduleAction: api.ui.Action;

    private scheduleFormPropertySet: api.data.PropertySet;

    private publishIssuesStateBar: PublishIssuesStateBar;

    private message: string;

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.publish'),
            class: 'publish-dialog',
            dependantsDescription: i18n('dialog.publish.dependants'),
            processingLabel: `${i18n('field.progress.publishing')}...`,
            processHandler: () => new ContentPublishPromptEvent({model: []}).fire(),
            buttonRow: new ContentPublishDialogButtonRow()
        });

        this.onProgressComplete((taskState) => {
            switch (taskState) {
            case TaskState.FINISHED:
            case TaskState.FAILED:
                this.setSubTitleMessage('');
                break;
            }
        });
    }

    public static get(): ContentPublishDialog {
        if (!ContentPublishDialog.INSTANCE) {
            ContentPublishDialog.INSTANCE = new ContentPublishDialog();
        }

        return ContentPublishDialog.INSTANCE;
    }

    protected initActions() {
        super.initActions();

        this.publishAction = new ContentPublishDialogAction(this.doPublish.bind(this, false));

        this.scheduleAction = new api.ui.Action('action.schedule')
            .onExecuted((action: Action) => this.doPublish(true));
    }

    protected initElements() {
        super.initElements();

        this.publishSubTitle = new ContentPublishDialogSubTitle();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());

        this.actionButton = this.addAction(this.publishAction);
        this.addAction(this.scheduleAction);

        this.scheduleFormPropertySet = new api.data.PropertySet();
        this.publishScheduleForm = new PublishScheduleForm(this.scheduleFormPropertySet);
        this.publishScheduleForm.setScheduleNote(i18n('dialog.schedule.subname'));
        this.publishScheduleForm.layout(false);
        this.scheduleFormPropertySet.onChanged((event: PropertyEvent) => {
            this.updateControls();
        });
        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.updateControls();
            this.publishAction.setVisible(!visible);
            this.scheduleAction.setVisible(visible);
        });

        this.publishIssuesStateBar = new PublishIssuesStateBar();

        this.loadCurrentUser();
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(CreateIssueDialog.get());

        this.lockControls();
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingStarted(this.handleLoadStarted.bind(this));
        this.publishProcessor.onLoadingFinished(this.handleLoadFinished.bind(this));
        this.publishProcessor.onLoadingFailed(this.handleLoadFailed.bind(this));

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

        if (this.publishProcessor.containsInvalidDependants() || !this.isAllPublishable()) {
            this.setDependantListVisible(true);
        }

        this.hideLoadMask();
        this.updateShowScheduleDialogButton();

        const itemsToPublish: number = this.countTotal();
        this.updateSubTitle(itemsToPublish);
        this.updateButtonCount(null, itemsToPublish);
        this.updateControls(itemsToPublish);
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

    private handleLoadFailed() {
        this.setSubTitleMessage('');
        this.publishIssuesStateBar.showLoadFailed();
        this.publishIssuesStateBar.addClass('has-issues');
        this.toggleAction(false);
        this.hideLoadMask();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setSubTitleEl(this.publishSubTitle);

            this.prependChildToContentPanel(this.publishScheduleForm);

            this.prependChildToContentPanel(this.publishIssuesStateBar);

            return rendered;
        });
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

    protected createDependantList(): PublishDialogDependantList {
        return new PublishDialogDependantList();
    }

    protected getDependantList(): PublishDialogDependantList {
        return <PublishDialogDependantList>super.getDependantList();
    }

    getButtonRow(): ContentPublishDialogButtonRow {
        return <ContentPublishDialogButtonRow>super.getButtonRow();
    }

    open() {
        this.publishProcessor.resetExcludedIds();
        this.publishProcessor.setIgnoreDependantItemsChanged(false);

        CreateIssueDialog.get().reset();

        this.publishScheduleForm.setFormVisible(false);

        this.reloadPublishDependencies();

        super.open();
    }

    close() {
        super.close();
        this.getItemList().clearExcludeChildrenIds();
        this.resetSubTitleMessage();
        this.message = null;

        CreateIssueDialog.get().reset();
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

    public getContentToPublishIds(): ContentId[] {
        return this.publishProcessor.getContentToPublishIds();
    }

    public getExcludedIds(): ContentId[] {
        return this.publishProcessor.getExcludedIds();
    }

    public isAllPublishable(): boolean {
        return this.publishProcessor && this.publishProcessor.isAllPublishable();
    }

    private reloadPublishDependencies() {
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

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]): ContentPublishDialog {
        if (this.isProgressBarEnabled()) {
            return this;
        }
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        return this;
    }

    setIncludeChildItems(include: boolean, exceptedIds?: ContentId[]): ContentPublishDialog {
        const hasExceptedIds = exceptedIds != null && exceptedIds.length > 0;
        const idExcepted = (id: ContentId) => exceptedIds.some(exceptedId => exceptedId.equals(id));

        this.getItemList().getItemViews()
            .forEach(itemView => {
                const hasToggler = itemView.getIncludeChildrenToggler() != null;
                if (hasToggler) {
                    const isIncluded = (hasExceptedIds && idExcepted(itemView.getContentId())) ? !include : include;
                    itemView.getIncludeChildrenToggler().toggle(isIncluded);
                }
            });
        return this;
    }

    setMessage(message: string): ContentPublishDialog {
        this.message = message;
        return this;
    }

    private doPublish(scheduled: boolean = false) {

        this.lockControls();
        this.publishProcessor.setIgnoreDependantItemsChanged(true);

        this.setSubTitle(i18n('dialog.publish.publishing', this.countTotal()));

        const selectedIds = this.getContentToPublishIds();
        const publishMessage = this.publishSubTitle.getValue();

        const publishRequest = new PublishContentRequest()
            .setIds(selectedIds)
            .setMessage(!api.util.StringHelper.isBlank(publishMessage) ? publishMessage : undefined)
            .setExcludedIds(this.getExcludedIds())
            .setExcludeChildrenIds(this.getItemList().getExcludeChildrenIds());

        if (scheduled) {
            const publishSet = this.scheduleFormPropertySet.getPropertySet('publish');
            const from = publishSet.getLocalDateTime('from', 0);
            if (from) {
                publishRequest.setPublishFrom(from.toDate());
            }

            const to = publishSet.getLocalDateTime('to', 0);
            if (to) {
                publishRequest.setPublishTo(to.toDate());
            }
        }

        publishRequest.sendAndParse().then((taskId: api.task.TaskId) => {
            this.pollTask(taskId);
        }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                api.notify.showError(reason.message);
            }
        });
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new PublishDialogItemList();
    }

    protected getItemList(): PublishDialogItemList {
        return <PublishDialogItemList>super.getItemList();
    }

    private updateSubTitle(itemsToPublish: number) {
        this.setSubTitle('');

        if (itemsToPublish === 0) {
            this.setSubTitle(i18n('dialog.publish.noItems'));
            return;
        }

        this.setSubTitleMessage(this.message);

        const allValid: boolean = this.areItemsAndDependantsValid();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        const allPublishable: boolean = this.isAllPublishable();

        if (allPublishable && allValid && !containsItemsInProgress) {
            this.publishIssuesStateBar.removeClass('has-issues');
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

    private updateControls(itemsToPublish: number = this.countTotal()) {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const allPublishable: boolean = this.isAllPublishable();
        const containsItemsInProgress: boolean = this.containsItemsInProgress();
        const canPublish: boolean = itemsToPublish > 0 && allValid && allPublishable && !containsItemsInProgress;
        const scheduleValid = !this.publishScheduleForm.isFormVisible() || this.publishScheduleForm.isFormValid();

        this.toggleAction(canPublish && scheduleValid);

        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
    }

    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: Function = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

        this.publishAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.publishNow')));
        this.scheduleAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.schedule')));
    }

    protected doScheduledAction() {
        this.doPublish(true);
    }

    protected isScheduleButtonAllowed(): boolean {
        return this.isAllPublishable() && this.areSomeItemsOffline();
    }

    private areSomeItemsOffline(): boolean {
        let summaries: ContentSummaryAndCompareStatus[] = this.getItemList().getItems();
        return summaries.some((summary) => summary.getCompareStatus() === CompareStatus.NEW);
    }

    private areItemsAndDependantsValid(): boolean {
        return !this.publishProcessor.containsInvalidItems();
    }

    private containsItemsInProgress(): boolean {
        return this.publishProcessor.containsItemsInProgress();
    }

    protected lockControls() {
        super.lockControls();
        this.scheduleAction.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.scheduleAction.setEnabled(true);
    }

    setSubTitle(text: string, escapeHtml?: boolean) {
        this.publishSubTitle.setMessage(text.trim(), escapeHtml);
    }

    setSubTitleMessage(message: string) {
        this.publishSubTitle.setValue(message);
    }

    resetSubTitleMessage() {
        this.publishSubTitle.resetValue();
    }
}

export class ContentPublishDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(mainAction: Action, menuActions: Action[], useDefault: boolean = true): MenuButton {
        super.makeActionMenu(mainAction, menuActions, useDefault);

        return <MenuButton>this.actionMenu.addClass('publish-dialog-menu');
    }

}

export class ContentPublishDialogSubTitle
    extends api.dom.DivEl {
    private input: api.ui.text.AutosizeTextInput;
    private message: api.dom.AEl;

    constructor() {
        super('publish-dialog-sub-title');
        this.input = new api.ui.text.AutosizeTextInput();
        this.input.setPlaceholder(i18n('dialog.publish.messagePlaceholder'));
        this.input.setVisible(false);

        this.message = new api.dom.AEl();
        this.message.setHtml(i18n('dialog.publish.messageHint'));
        this.message.onClicked((event: MouseEvent) => {
            event.stopImmediatePropagation();
            event.preventDefault();

            this.toggleInput(true);
        });

        this.initListeners();
    }

    getValue(): string {
        return this.input.getValue();
    }

    setValue(text: string) {
        if (!text) {
            return;
        }
        this.input.setValue(text);
        this.toggleInput(true);
    }

    resetValue() {
        this.input.reset();
        this.input.resetBaseValues();
    }

    setMessage(text: string, escapeHtml?: boolean) {
        this.message.setHtml(text || i18n('dialog.publish.messageHint'), escapeHtml);
        this.toggleClass('custom-message', !!text);
    }

    private toggleInput(visible: boolean) {
        if (visible) {
            this.message.hide();
            this.input.show();
            this.input.giveFocus();
        } else {
            this.input.reset();
            this.input.hide();
            this.message.show();
        }
    }

    private initListeners() {
        const keyDownHandler = (event: KeyboardEvent) => {
            const isLetterOrNumber: boolean = !event.altKey && !event.ctrlKey &&
                                              (KeyHelper.isNumber(event) || KeyHelper.isAlpha(event));
            const isInputVisible = this.input.isVisible();

            if (!isInputVisible && isLetterOrNumber) {
                this.toggleInput(true);
            } else if (isInputVisible && KeyHelper.isEscKey(event)) {
                event.stopImmediatePropagation();
                this.toggleInput(false);
            }
        };

        const clickHandler = (event: MouseEvent) => {
            if (this.input.isVisible()
                && api.util.StringHelper.isBlank(this.input.getValue())
                && event.target !== this.input.getHTMLElement()) {

                this.toggleInput(false);
            }
        };

        this.onShown(() => {
            api.dom.Body.get().onKeyDown(keyDownHandler);
            this.toggleInput(false);
        });
        this.onHidden(() => api.dom.Body.get().unKeyDown(keyDownHandler));

        this.input.onShown(() => api.dom.Body.get().onClicked(clickHandler));
        this.input.onHidden(() => api.dom.Body.get().unClicked(clickHandler));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<api.dom.Element>(this.message, this.input);
            return rendered;
        });
    }
}
