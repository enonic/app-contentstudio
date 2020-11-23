import * as Q from 'q';
import {Element} from 'lib-admin-ui/dom/Element';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {StringHelper} from 'lib-admin-ui/util/StringHelper';
import {Body} from 'lib-admin-ui/dom/Body';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {DivEl} from 'lib-admin-ui/dom/DivEl';
import {AEl} from 'lib-admin-ui/dom/AEl';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {ContentPublishDialogAction} from './ContentPublishDialogAction';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {PublishContentRequest} from '../resource/PublishContentRequest';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {Action} from 'lib-admin-ui/ui/Action';
import {KeyHelper} from 'lib-admin-ui/ui/KeyHelper';
import {TaskState} from 'lib-admin-ui/task/TaskState';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {AutosizeTextInput} from 'lib-admin-ui/ui/text/AutosizeTextInput';
import {DropdownButtonRow} from 'lib-admin-ui/ui/dialog/DropdownButtonRow';
import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';
import {MarkAsReadyRequest} from '../resource/MarkAsReadyRequest';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';

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

    private markAllAsReadyAction: Action;

    private publishSubTitle: ContentPublishDialogSubTitle;

    private scheduleAction: Action;

    private message: string;

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.publish'),
            class: 'publish-dialog grey-header',
            dependantsDescription: i18n('dialog.publish.dependants'),
            buttonRow: new ContentPublishDialogButtonRow(),
            processingLabel: `${i18n('field.progress.publishing')}...`,
            processHandler: () => new ContentPublishPromptEvent({model: []}).fire()
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

        this.scheduleAction = new Action('action.schedule')
            .setIconClass('schedule-action')
            .onExecuted((action: Action) => this.doPublish(true));

        this.markAllAsReadyAction = new Action(i18n('action.markAsReady')).onExecuted(this.markAllAsReady.bind(this));
    }

    protected initElements() {
        super.initElements();

        this.publishSubTitle = new ContentPublishDialogSubTitle();

        this.addAction(this.scheduleAction);

        this.publishScheduleForm.layout(false);

        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.publishAction.setVisible(!visible);
            this.scheduleAction.setVisible(visible);
        });

        const menuButton: MenuButton = this.getButtonRow().makeActionMenu(this.publishAction, [this.markAllAsReadyAction]);
        this.actionButton = menuButton.getActionButton();
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingFailed(() => {
            this.setSubTitleMessage('');
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setSubTitleEl(this.publishSubTitle);

            this.scheduleFormToggle.addClass('force-enabled');
            this.getButtonRow().addElement(this.scheduleFormToggle, true);

            this.prependChildToContentPanel(this.publishScheduleForm);

            this.prependChildToContentPanel(this.publishIssuesStateBar);

            return rendered;
        });
    }

    getButtonRow(): ContentPublishDialogButtonRow {
        return <ContentPublishDialogButtonRow>super.getButtonRow();
    }

    open() {
        this.publishScheduleForm.setFormVisible(false);

        super.open();
    }

    close() {
        super.close();

        this.resetSubTitleMessage();
        this.message = null;
    }

    setContentToPublish(contents: ContentSummaryAndCompareStatus[]): ContentPublishDialog {
        return <ContentPublishDialog>super.setContentToPublish(contents);
    }

    setIncludeChildItems(include: boolean, exceptedIds?: ContentId[]): ContentPublishDialog {
        const hasExceptedIds = exceptedIds != null && exceptedIds.length > 0;
        const idExcepted = (id: ContentId) => exceptedIds.some(exceptedId => exceptedId.equals(id));

        let noIdsIncluded: boolean = true;
        this.getItemList().getItemViews().forEach(itemView => {
            const toggler = itemView.getIncludeChildrenToggler();
            if (toggler) {
                const idIncluded = (hasExceptedIds && idExcepted(itemView.getContentId())) ? !include : include;
                toggler.toggle(idIncluded);
                if (idIncluded && noIdsIncluded) {
                    noIdsIncluded = false;
                }
            }
        });

        if (noIdsIncluded) {
            // do reload dependencies manually if no children included to update buttons
            this.publishProcessor.reloadPublishDependencies(true);
        }

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
            .setMessage(!StringHelper.isBlank(publishMessage) ? publishMessage : undefined)
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

        publishRequest.sendAndParse().then((taskId: TaskId) => {
            this.pollTask(taskId);
        }).catch((reason) => {
            this.unlockControls();
            this.close();
            if (reason && reason.message) {
                showError(reason.message);
            }
        });
    }


    protected updateSubTitle(itemsToPublish: number = this.countTotal()) {
        this.setSubTitle('');

        if (itemsToPublish === 0) {
            this.setSubTitle(i18n('dialog.publish.noItems'));
            return;
        }

        if (this.message) {
            this.setSubTitleMessage(this.message);
            this.message = null;
        }

        super.updateSubTitle(itemsToPublish);
    }


    protected updateControls(itemsToPublish: number = this.countTotal()) {
        const canPublish = this.publishProcessor.areAllConditionsSatisfied(itemsToPublish);
        const scheduleValid = this.isScheduleFormValid();

        this.toggleAction(canPublish && scheduleValid);

        this.publishSubTitle.setVisible(!this.isAllPendingDelete());
        this.getButtonRow().setTotalInProgress(this.publishProcessor.getItemsTotalInProgress());

        super.updateControls(itemsToPublish);
    }

    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: Function = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

        this.publishAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.publishNow')));
        this.scheduleAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.schedule')));
    }

    protected lockControls() {
        super.lockControls();
        this.scheduleAction.setEnabled(false);
    }

    protected unlockControls() {
        super.unlockControls();
        this.scheduleAction.setEnabled(true);
    }

    setSubTitle(text: string) {
        this.publishSubTitle.setMessage(text.trim());
    }

    setSubTitleMessage(message: string) {
        this.publishSubTitle.setValue(message);
    }

    resetSubTitleMessage() {
        this.publishSubTitle.resetValue();
    }

    private markAllAsReady() {
        const ids: ContentId[] = this.publishProcessor.getContentIsProgressIds();

        new MarkAsReadyRequest(ids).sendAndParse().catch(DefaultErrorHandler.handle);
    }
}

export class ContentPublishDialogSubTitle
    extends DivEl {
    private input: AutosizeTextInput;
    private message: AEl;

    constructor() {
        super('publish-dialog-sub-title');
        this.input = new AutosizeTextInput();
        this.input.setPlaceholder(i18n('dialog.publish.messagePlaceholder'));
        this.input.setVisible(false);

        this.message = new AEl();
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
        this.toggleInput(true, false);
    }

    resetValue() {
        this.input.reset();
        this.input.resetBaseValues();
    }

    setMessage(text: string) {
        this.message.setHtml(text || i18n('dialog.publish.messageHint'));
        this.toggleClass('custom-message', !!text);
    }

    private toggleInput(visible: boolean, focus: boolean = true) {
        if (visible) {
            this.message.hide();
            this.input.show();
            if (focus) {
                this.input.giveFocus();
            }
        } else {
            this.input.reset();
            this.input.hide();
            this.message.show();
        }
    }

    private initListeners() {
        const keyDownHandler = (event: KeyboardEvent) => {
            const isTextInputFocused = document.activeElement &&
                                       (document.activeElement.tagName.toUpperCase() === 'INPUT' ||
                                        document.activeElement.tagName.toUpperCase() === 'TEXTAREA');

            const isPublishMessageInputFocused = this.input.getHTMLElement() === document.activeElement;

            if (isTextInputFocused && !isPublishMessageInputFocused) {
                // don't hijack focus from other inputs
                return;
            }

            const isLetterOrNumber: boolean = !event.altKey && !event.ctrlKey && KeyHelper.isAlphaNumeric(event);

            if (!isPublishMessageInputFocused && isLetterOrNumber) {
                this.toggleInput(true);
            } else if (isPublishMessageInputFocused) {
                if (KeyHelper.isEscKey(event)) {
                    event.stopImmediatePropagation();
                    this.toggleInput(false);
                } else if (KeyHelper.isEnterKey(event)) {
                    event.stopImmediatePropagation();
                    this.input.giveBlur();
                }
            }
        };

        const clickHandler = (event: MouseEvent) => {
            if (this.input.isVisible()
                && StringHelper.isBlank(this.input.getValue())
                && event.target !== this.input.getHTMLElement()) {

                this.toggleInput(false);
            }
        };

        this.onShown(() => {
            Body.get().onKeyDown(keyDownHandler);
        });
        this.onHidden(() => Body.get().unKeyDown(keyDownHandler));

        this.input.onShown(() => Body.get().onClicked(clickHandler));
        this.input.onHidden(() => Body.get().unClicked(clickHandler));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<Element>(this.message, this.input);
            return rendered;
        });
    }
}

export class ContentPublishDialogButtonRow
    extends DropdownButtonRow {

    setTotalInProgress(totalInProgress: number) {
        this.toggleClass('has-items-in-progress', totalInProgress > 0);
        this.getMenuActions()[0].setLabel(i18n('action.markAsReadyTotal', totalInProgress));
    }
}
