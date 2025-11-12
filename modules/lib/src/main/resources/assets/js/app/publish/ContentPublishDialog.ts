import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {StringHelper} from '@enonic/lib-admin-ui/util/StringHelper';
import * as Q from 'q';
import {ContentPublishPromptEvent} from '../browse/ContentPublishPromptEvent';
import {ContentId} from '../content/ContentId';
import {BasePublishDialog} from '../dialog/BasePublishDialog';
import {ContentDialogSubTitle} from '../dialog/ContentDialogSubTitle';
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

    private publishSubTitle: ContentDialogSubTitle;

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

        this.publishSubTitle = new ContentDialogSubTitle({
            placeholderText: i18n('dialog.publish.messagePlaceholder'),
            hintText: i18n('dialog.publish.messageHint')
        });

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
        const containsOnlyScheduled = this.publishProcessor.containsOnlyScheduledItems();

        this.publishAction.setLabel(labelWithNumber(itemsToPublish, containsOnlyScheduled ? i18n('action.updateScheduled') : i18n('action.publishNow')));
        this.scheduleAction.setLabel(labelWithNumber(itemsToPublish, i18n('action.schedule')));
        this.scheduleFormToggle.setEnabled(this.publishProcessor.hasSchedulable());
    }

    protected onDependantsChanged(): void {
        super.onDependantsChanged();

        this.updateButtonCount(null, this.countTotal());
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
}

