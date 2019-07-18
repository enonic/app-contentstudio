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
import Principal = api.security.Principal;
import DropdownButtonRow = api.ui.dialog.DropdownButtonRow;
import i18n = api.util.i18n;
import DateTimeRange = api.form.inputtype.time.DateTimeRange;
import FormItem = api.form.FormItem;
import KeyHelper = api.ui.KeyHelper;
import PropertyEvent = api.data.PropertyEvent;

/**
 * ContentPublishDialog manages list of initially checked (initially requested) items resolved via ResolvePublishDependencies command.
 * Resolved items are converted into array of SelectionPublishItem<ContentPublishItem> items and stored in selectionItems property.
 * Dependant items number will change depending on includeChildren checkbox state as
 * resolved dependencies usually differ in that case.
 */
export class ContentPublishDialog
    extends BasePublishDialog {

    private publishAction: Action;

    private publishProcessor: PublishProcessor;

    private currentUser: Principal;

    private publishSubTitle: ContentPublishDialogSubTitle;

    private scheduleFormView: api.form.FormView;

    private scheduleFormWrapper: api.dom.DivEl;

    private showScheduleFormAction: api.ui.Action;

    private scheduleAction: api.ui.Action;

    private scheduleFormPropertySet: api.data.PropertySet;

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

    protected initActions() {
        super.initActions();

        this.showScheduleFormAction = new api.ui.Action(i18n('dialog.publish.addSchedule'))
            .onExecuted((action: Action) => {
                this.setScheduleFormVisible(true);
                this.toggleAction(this.isScheduleFormValid());
            });

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

        const form = new api.form.FormBuilder().addFormItem(this.createRangeFormItem()).build();
        this.scheduleFormPropertySet = new api.data.PropertySet();

        this.scheduleFormWrapper = new api.dom.DivEl('schedule-form-wrapper');
        const removeButton = new api.dom.AEl('remove-button');
        removeButton.onClicked((event: MouseEvent) => {
            event.preventDefault();
            event.stopImmediatePropagation();

            this.setScheduleFormVisible(false);
            this.updateControls(this.countTotal());
        });

        this.scheduleFormView = new api.form.FormView(api.form.FormContext.create().build(), form, this.scheduleFormPropertySet);

        this.scheduleFormPropertySet.onChanged((event: PropertyEvent) => {
            this.scheduleFormView.validate(false, true);
            const isFormValid = this.isScheduleFormValid();

            this.toggleAction(isFormValid);
        });

        const note = new api.dom.H6El('schedule-note').setHtml(i18n('dialog.schedule.subname'), false);

        this.scheduleFormWrapper.appendChildren<api.dom.Element>(note, this.scheduleFormView, removeButton);

        this.loadCurrentUser();
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
            this.toggleAction(false);
            this.hideLoadMask();
        });

        this.handleIssueGlobalEvents();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setSubTitleEl(this.publishSubTitle);

            this.prependChildToContentPanel(this.scheduleFormWrapper);
            this.scheduleFormView.layout(false);
            this.scheduleFormView.displayValidationErrors(true);

            const scheduleButton = new api.ui.button.ActionButton(this.showScheduleFormAction);
            this.prependChildToContentPanel(scheduleButton);

            return rendered;
        });
    }

    protected createRangeFormItem(): FormItem {
        return new api.form.InputBuilder()
            .setName('publish')
            .setInputType(DateTimeRange.getName())
            .setOccurrences(new api.form.OccurrencesBuilder().setMinimum(1).setMaximum(1).build())
            .setInputTypeConfig({
                labelStart: i18n('field.onlineFrom'),
                labelEnd: i18n('field.onlineTo')
            })
            .setMaximizeUIInputWidth(true)
            .build();
    }

    private setScheduleFormVisible(flag: boolean) {
        this.scheduleFormWrapper.setVisible(flag);
        this.showScheduleFormAction.setVisible(!flag);

        this.scheduleAction.setVisible(flag);
        this.publishAction.setVisible(!flag);

        if (!flag) {
            this.scheduleFormPropertySet.reset();
            this.scheduleFormView.reset();
        }
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

        this.setScheduleFormVisible(false);

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

    private doPublish(scheduled: boolean = false) {

        this.lockControls();
        this.publishProcessor.setIgnoreDependantItemsChanged(true);

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

    private updateSubTitle() {
        const allValid: boolean = this.areItemsAndDependantsValid();

        this.toggleClass('invalid', !allValid || !this.isAllPublishable());
    }

    private updateControls(itemsToPublish: number) {
        const allValid: boolean = this.areItemsAndDependantsValid();
        const allPublishable: boolean = this.isAllPublishable();
        const canPublish: boolean = itemsToPublish > 0 && allValid && allPublishable;
        const scheduleValid = !this.scheduleAction.isVisible() || this.isScheduleFormValid();

        this.toggleAction(canPublish && scheduleValid);

        this.getButtonRow().focusDefaultAction();
        this.updateTabbable();
    }

    private isScheduleFormValid() {
        const isFormValid = this.scheduleFormView.isValid();
        const dateSet = this.scheduleFormPropertySet.getProperty('publish').getPropertySet();
        if (!isFormValid || !dateSet) {
            return false;
        }
        const from = dateSet.getProperty('from', 0);
        const to = dateSet.getProperty('to', 0);
        return from && from.hasNonNullValue() || to && to.hasNonNullValue();
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

    protected lockControls() {
        super.lockControls();
        this.scheduleAction.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.scheduleAction.setEnabled(true);
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
