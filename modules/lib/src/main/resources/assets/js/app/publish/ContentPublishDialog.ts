import {AEl} from '@enonic/lib-admin-ui/dom/AEl';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {Element} from '@enonic/lib-admin-ui/dom/Element';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {AutosizeTextInput} from '@enonic/lib-admin-ui/ui/text/AutosizeTextInput';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import * as Q from 'q';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {ContentId} from '../content/ContentId';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {PublishContentRequest} from '../resource/PublishContentRequest';
import {ContentPublishDialogAction} from './ContentPublishDialogAction';

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

    private scheduleAction: Action;

    private message: string;

    protected constructor() {
        super({
            title: i18n('dialog.publish'),
            class: 'publish-dialog',
            buttonRow: new DropdownButtonRow(),
            processingLabel: `${i18n('field.progress.publishing')}...`,
            processHandler: () => new ContentPublishPromptEvent({model: []}).fire(),
        } satisfies DependantItemsWithProgressDialogConfig);

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

    protected initActions(): void {
        this.publishAction = new ContentPublishDialogAction(this.doPublish.bind(this, false));

        this.scheduleAction = new Action('action.schedule')
            .setIconClass('schedule-action')
            .onExecuted((action: Action) => this.doPublish(true))
            .setVisible(false);
    }

    protected initElements() {
        this.initActions();

        super.initElements();

        this.publishSubTitle = new ContentPublishDialogSubTitle();

        this.addAction(this.scheduleAction);

        this.publishScheduleForm.onFormVisibilityChanged((visible) => {
            this.publishAction.setVisible(!visible);
            this.scheduleAction.setVisible(visible);
        });

        const menuButton = this.getButtonRow().makeActionMenu(this.publishAction);
        this.actionButton = menuButton.getActionButton();
    }

    protected initListeners() {
        super.initListeners();

        this.publishProcessor.onLoadingFailed(() => {
            this.setSubTitleMessage('');
        });
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.publishSubTitle.getLinkEl());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setSubTitleEl(this.publishSubTitle);

            this.scheduleFormToggle.addClass('force-enabled');
            this.getButtonRow().addElement(this.scheduleFormToggle, true);

            this.prependChildToContentPanel(this.publishScheduleForm);

            this.prependChildToContentPanel(this.stateBar);

            return rendered;
        });
    }

    close() {
        super.close();

        this.publishScheduleForm.setFormVisible(false);
        this.resetSubTitleMessage();
        this.message = null;
    }

    setIncludeChildItems(include: boolean, exceptedIds?: ContentId[]): ContentPublishDialog {
        const hasExceptedIds = exceptedIds != null && exceptedIds.length > 0;
        const idExcepted = (id: ContentId) => exceptedIds.some(exceptedId => exceptedId.equals(id));
        let noIdsIncluded = true;

        this.getItemList().getItemViews().forEach(itemView => {
            if (itemView.hasChildrenItems()) {
                const isIdIncluded: boolean = (hasExceptedIds && idExcepted(itemView.getContentId())) ? !include : include;
                itemView.toggleIncludeChildren(isIdIncluded);

                if (isIdIncluded && noIdsIncluded) {
                    noIdsIncluded = false;
                }
            }
        });

        if (noIdsIncluded) {
            // do reload dependencies manually if no children included to update buttons
            this.publishProcessor.reloadPublishDependencies({resetDependantItems: true});
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
        const isScheduleValid = this.isScheduleFormValid();

        this.publishAction.setEnabled(canPublish);
        this.scheduleAction.setEnabled(canPublish && isScheduleValid);
        this.publishSubTitle.setVisible(this.isSomePublishable());

        super.updateControls(itemsToPublish);
    }

    protected updateButtonCount(actionString: string, itemsToPublish: number) {
        const labelWithNumber: (num: number, label: string) => string = (num, label) => `${label}${num > 1 ? ` (${num})` : ''}`;

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

    getLinkEl(): AEl {
        return this.message;
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren<Element>(this.message, this.input);
            return rendered;
        });
    }
}
