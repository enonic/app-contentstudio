import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {ContentPublishDialogAction} from './ContentPublishDialogAction';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {PublishContentRequest} from '../resource/PublishContentRequest';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import ContentId = api.content.ContentId;
import Action = api.ui.Action;
import i18n = api.util.i18n;
import KeyHelper = api.ui.KeyHelper;
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

    private publishSubTitle: ContentPublishDialogSubTitle;

    private scheduleAction: api.ui.Action;

    private message: string;

    protected constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.publish'),
            class: 'publish-dialog grey-header',
            dependantsDescription: i18n('dialog.publish.dependants'),
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

        this.scheduleAction = new api.ui.Action('action.schedule')
            .setIconClass('schedule-action')
            .onExecuted((action: Action) => this.doPublish(true));
    }

    protected initElements() {
        super.initElements();

        this.publishSubTitle = new ContentPublishDialogSubTitle();

        this.addAction(this.scheduleAction);
        this.actionButton = this.addAction(this.publishAction, true);

        this.publishScheduleForm.layout(false);

        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.publishAction.setVisible(!visible);
            this.scheduleAction.setVisible(visible);
        });
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

        let anyIncluded: boolean;
        this.getItemList().getItemViews().forEach(itemView => {
            const toggler = itemView.getIncludeChildrenToggler();
            if (toggler) {
                const isIncluded = (hasExceptedIds && idExcepted(itemView.getContentId())) ? !include : include;
                toggler.toggle(isIncluded);
                if (isIncluded && !anyIncluded) {
                    anyIncluded = isIncluded;
                }
            }
        });

        if (!anyIncluded) {
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
        this.toggleInput(true, false);
    }

    resetValue() {
        this.input.reset();
        this.input.resetBaseValues();
    }

    setMessage(text: string, escapeHtml?: boolean) {
        this.message.setHtml(text || i18n('dialog.publish.messageHint'), escapeHtml);
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

            const isLetterOrNumber: boolean = !event.altKey && !event.ctrlKey &&
                                              (KeyHelper.isNumber(event) || KeyHelper.isAlpha(event));

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
                && api.util.StringHelper.isBlank(this.input.getValue())
                && event.target !== this.input.getHTMLElement()) {

                this.toggleInput(false);
            }
        };

        this.onShown(() => {
            api.dom.Body.get().onKeyDown(keyDownHandler);
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
