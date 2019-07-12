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
import ContentId = api.content.ContentId;
import ListBox = api.ui.selector.list.ListBox;
import MenuButton = api.ui.button.MenuButton;
import Action = api.ui.Action;
import ActionButton = api.ui.button.ActionButton;
import Principal = api.security.Principal;
import DropdownButtonRow = api.ui.dialog.DropdownButtonRow;
import DialogButton = api.ui.dialog.DialogButton;
import i18n = api.util.i18n;
import DateTimeRange = api.form.inputtype.time.DateTimeRange;
import FormItem = api.form.FormItem;
import KeyHelper = api.ui.KeyHelper;

/**
 * ContentPublishDialog manages list of initially checked (initially requested) items resolved via ResolvePublishDependencies command.
 * Resolved items are converted into array of SelectionPublishItem<ContentPublishItem> items and stored in selectionItems property.
 * Dependant items number will change depending on includeChildren checkbox state as
 * resolved dependencies usually differ in that case.
 */
export class ContentPublishDialog
    extends BasePublishDialog {

    private publishButton: ActionButton;

    private createIssueAction: Action;

    private publishAction: Action;

    private createIssueButton: DialogButton;

    private publishProcessor: PublishProcessor;

    private actionMenu: MenuButton;

    private currentUser: Principal;

    private publishSubTitle: ContentPublishDialogSubTitle;

    private scheduleFormView: api.form.FormView;

    private showScheduleFormAction: api.ui.Action;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.publish'),
            class: 'publish-dialog',
            dependantsDescription: i18n('dialog.publish.dependants'),
                processingLabel: `${i18n('field.progress.publishing')}...`,
                processHandler: () => {
                    new ContentPublishPromptEvent([]).fire();
                },
                buttonRow: new ContentPublishDialogButtonRow(),
            }
        );
    }

    protected initElements() {
        super.initElements();

        this.publishSubTitle = new ContentPublishDialogSubTitle();

        this.publishProcessor = new PublishProcessor(this.getItemList(), this.getDependantList());
        this.createIssueButton = this.addAction(this.createIssueAction);

        this.publishButton = this.actionButton = new api.ui.button.ActionButton(this.publishAction);

        const formBuilder = new api.form.FormBuilder().addFormItem(this.createRangeFormItem());
        const propertySet = new api.data.PropertyTree().getRoot();
        this.scheduleFormView = new api.form.FormView(api.form.FormContext.create().build(), formBuilder.build(), propertySet);
        this.scheduleFormView.setVisible(false);

        this.loadCurrentUser();
    }

    protected createRangeFormItem(): FormItem {
        return new api.form.InputBuilder()
            .setName('publish')
            .setInputType(DateTimeRange.getName())
            .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(0).setMaximum(1).build())
            .setInputTypeConfig({
                labelStart: i18n('field.onlineFrom'),
                labelEnd: i18n('field.onlineTo')
            })
            .setHelpText(i18n('field.onlineFrom.help'))
            .setMaximizeUIInputWidth(true)
            .build();
    }

    protected postInitElements() {
        super.postInitElements();

        this.addClickIgnoredElement(CreateIssueDialog.get());

        this.lockControls();
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingStarted(() => {
            this.lockControls();
            this.showLoadMask();

            // this.setSubTitle(i18n('dialog.publish.resolving'));
        });

        this.publishProcessor.onLoadingFinished(() => {
            const header: string = this.getDependantsHeader(this.getDependantList().isVisible());
            this.updateDependantsHeader(header);

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

            if (this.publishProcessor.containsInvalidDependants() || !this.isAllPublishable()) {
                this.setDependantListVisible(true);
            }

            this.hideLoadMask();

            this.updateShowScheduleDialogButton();

            const itemsToPublish: number = this.countTotal();
            this.updateSubTitle();
            this.updateButtonCount(null, itemsToPublish);
            this.updateControls(itemsToPublish);
        });

        this.publishProcessor.onLoadingFailed(() => {
            this.addClass('invalid');
            // this.setSubTitle(i18n('dialog.publish.error.loadFailed'));
            this.toggleAction(false);
            this.actionMenu.setVisible(false);
            this.createIssueButton.setVisible(true);
            this.hideLoadMask();
        });

        this.handleIssueGlobalEvents();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setSubTitleEl(this.publishSubTitle);

            this.prependChildToContentPanel(this.scheduleFormView);
            this.scheduleFormView.layout();

            const scheduleButton = new api.ui.button.ActionButton(this.showScheduleFormAction);
            this.prependChildToContentPanel(scheduleButton);

            this.addCancelButtonToBottom();

            this.createIssueButton.hide();
            this.createIssueButton.addClass('force-enabled');

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

    protected initActions() {
        super.initActions();

        this.showScheduleFormAction = new api.ui.Action('Add schedule');
        this.showScheduleFormAction.onExecuted((action: Action) => {
            this.scheduleFormView.setVisible(true);
            action.setVisible(false);
        });

        this.publishAction = new ContentPublishDialogAction(this.doPublish.bind(this, false));
        this.createIssueAction = new CreateIssueDialogAction(this.createIssue.bind(this));
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

        this.reloadPublishDependencies();

        super.open();
    }

    close() {
        super.close();
        this.getItemList().clearExcludeChildrenIds();

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

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]) {
        if (this.isProgressBarEnabled()) {
            return this;
        }
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        return this;
    }

    setIncludeChildItems(include: boolean, silent?: boolean) {
        this.getItemList().getItemViews()
            .filter(itemView => itemView.getIncludeChildrenToggler())
            .forEach(itemView => itemView.getIncludeChildrenToggler().toggle(include, silent)
            );
        return this;
    }

    private showCreateIssueDialog() {
        const createIssueDialog = CreateIssueDialog.get();

        createIssueDialog.enableBackButton();
        createIssueDialog.setItems(this.getItemList().getItems()/*idsToPublish, this.getItemList().getExcludeChildrenIds()*/);
        createIssueDialog.setExcludedIds(this.getExcludedIds());
        createIssueDialog.setExcludeChildrenIds(this.getItemList().getExcludeChildrenIds());

        createIssueDialog.lockPublishItems();
        createIssueDialog.open(this);

        this.mask();
    }

    private createIssue() {
        //TODO: implement action
        this.showCreateIssueDialog();
    }

    private doPublish(scheduled: boolean = false) {

        this.lockControls();
        this.publishProcessor.setIgnoreDependantItemsChanged(true);

        // this.setSubTitle(i18n('dialog.publish.publishing', this.countTotal()));

        const selectedIds = this.getContentToPublishIds();
        const publishMessage = this.publishSubTitle.getValue();

        const publishRequest = new PublishContentRequest()
            .setIds(selectedIds)
            .setMessage(!api.util.StringHelper.isBlank(publishMessage) ? publishMessage : undefined)
            .setExcludedIds(this.getExcludedIds())
            .setExcludeChildrenIds(this.getItemList().getExcludeChildrenIds());

        if (scheduled) {
            publishRequest.setPublishFrom(this.getFromDate());
            publishRequest.setPublishTo(this.getToDate());
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

    private updateSubTitle() {
        const allValid: boolean = this.areItemsAndDependantsValid();

        this.toggleClass('invalid', !allValid || !this.isAllPublishable());
    }

    private updateControls(itemsToPublish: number) {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const allPublishable: boolean = this.isAllPublishable();
        const canPublish: boolean = itemsToPublish > 0 && allValid && allPublishable;
        const showActionMenu: boolean = itemsToPublish > 0 && allPublishable;

        this.toggleAction(canPublish);
        this.actionMenu.setVisible(showActionMenu);
        this.createIssueButton.setVisible(!showActionMenu);

        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
    }

    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: Function = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

        this.publishAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.publish')));
        this.showScheduleAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.scheduleMore')));
        this.createIssueAction.setLabel(labelWithNumber(this.getItemList().getItemCount(), i18n('action.createIssueMore')));
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

    protected lockControls() {
        super.lockControls();
        this.publishButton.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.publishButton.setEnabled(true);
    }
}

export class ContentPublishDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(mainAction: Action, menuActions: Action[], useDefault: boolean = true): MenuButton {
        super.makeActionMenu(mainAction, menuActions, useDefault);

        return <MenuButton>this.actionMenu.addClass('publish-dialog-menu');
    }

}

export class CreateIssueDialogAction
    extends api.ui.Action {
    constructor(handler: () => wemQ.Promise<any> | void) {
        super(i18n('action.createIssueMore'));
        this.setIconClass('create-issue-action');
        this.onExecuted(handler);
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
        this.message.onClicked(() => {
            this.toggleInput(true);
        });

        this.initKeyDownHandler();
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

    private initKeyDownHandler() {
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

        this.onShown(() => {
            api.dom.Body.get().onKeyDown(keyDownHandler);
        });

        this.onHidden(() => {
            api.dom.Body.get().unKeyDown(keyDownHandler);
        });
    }

    public getValue(): string {
        return this.input.getValue();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<api.dom.Element>(this.message, this.input);
            return rendered;
        });
    }
}
