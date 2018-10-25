import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {ContentDuplicateDialogAction} from './ContentDuplicateDialogAction';
import {ContentDuplicatePromptEvent} from '../browse/ContentDuplicatePromptEvent';
import {DialogTogglableItemList} from '../dialog/DialogTogglableItemList';
import {DuplicatableId, DuplicateContentRequest} from '../resource/DuplicateContentRequest';
import {ContentWizardPanelParams} from '../wizard/ContentWizardPanelParams';
import {ContentEventsProcessor} from '../ContentEventsProcessor';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import ManagedActionExecutor = api.managedaction.ManagedActionExecutor;
import ListBox = api.ui.selector.list.ListBox;
import i18n = api.util.i18n;
import TaskState = api.task.TaskState;
import AppBarTabId = api.app.bar.AppBarTabId;
import ContentSummary = api.content.ContentSummary;

export class ContentDuplicateDialog
    extends DependantItemsWithProgressDialog
    implements ManagedActionExecutor {

    private yesCallback: () => void;

    private noCallback: () => void;

    private totalItemsToDuplicate: number;

    private messageId: string;

    private openTabAfterDuplicate: boolean;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig> {
                title: i18n('dialog.duplicate'),
                showDependantList: false,
                dependantsDescription: i18n('dialog.duplicate.dependants'),
                processingLabel: `${i18n('field.progress.duplicating')}...`,
                processHandler: () => new ContentDuplicatePromptEvent([]).fire()
            }
        );

        this.addClass('content-duplicate-dialog');

        const duplicateAction = new ContentDuplicateDialogAction();
        duplicateAction.onExecuted(this.doDuplicate.bind(this, false));
        this.actionButton = this.addAction(duplicateAction, true, true);

        this.addCancelButtonToBottom();

        this.initItemListListeners();
    }

    private initItemListListeners() {
        const reloadDependenciesDebounced = api.util.AppHelper.debounce(() => {
            if (this.getItemList().hasActiveTogglers()) {
                this.manageDescendants();
            } else {
                this.clearDependantItems();
            }
        }, 100, false);

        this.getItemList().onItemsRemoved(reloadDependenciesDebounced);
        this.getItemList().onItemsAdded(reloadDependenciesDebounced);
        this.getItemList().onChildrenListChanged(reloadDependenciesDebounced);
    }

    protected getContentsToLoad(): ContentSummaryAndCompareStatus[] {
        return this.getItemList().getItemViews().filter(view => view.includesChildren()).map(view => view.getBrowseItem().getModel());
    }

    protected manageDescendants() {
        this.loadMask.show();
        this.lockControls();

        this.loadDescendantIds().then(() => {
            this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
                this.countItemsToDuplicateAndUpdateButtonCounter();
            }).finally(() => {
                this.loadMask.hide();
                this.unlockControls();
                this.updateTabbable();
                this.actionButton.giveFocus();
            });
        }).catch((reason: any) => {
            api.DefaultErrorHandler.handle(reason);
        });
    }

    manageContentToDuplicate(contents: ContentSummaryAndCompareStatus[]): ContentDuplicateDialog {
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        return this;
    }

    clearDependantItems() {
        super.clearDependantItems();
        this.countItemsToDuplicateAndUpdateButtonCounter();
    }

    close() {
        super.close();
        if (this.messageId) {

            this.removeClickIgnoredElement(api.notify.NotifyManager.get().getNotification(this.messageId));
            api.notify.NotifyManager.get().hide(this.messageId);

            this.messageId = '';
        }
    }

    setContentToDuplicate(contents: ContentSummaryAndCompareStatus[]): ContentDuplicateDialog {
        this.manageContentToDuplicate(contents);
        this.manageDescendants();

        return this;
    }

    setYesCallback(callback: () => void): ContentDuplicateDialog {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentDuplicateDialog {
        this.noCallback = callback;
        return this;
    }

    setOpenTabAfterDuplicate(value: boolean): ContentDuplicateDialog {
        this.openTabAfterDuplicate = value;
        return this;
    }

    private doDuplicate(ignoreConfirmation: boolean = false) {
        if (this.yesCallback) {
            this.yesCallback();
        }

        this.lockControls();

        const itemToDuplicate = this.getItemList().getItems()[0];

        const taskIsFinishedPromise = this.createDuplicateRequest()
            .sendAndParse()
            .then((taskId: api.task.TaskId) => {
                this.pollTask(taskId);
                return this.checkFinished();
            })
            .catch((reason) => {
                this.close();
                if (reason && reason.message) {
                    api.notify.showError(reason.message);
                }
            });

        if (this.openTabAfterDuplicate) {

            const duplicatedPromise = this.checkDuplicated(itemToDuplicate.getContentSummary());

            wemQ.all([taskIsFinishedPromise, duplicatedPromise]).spread((isFinished: boolean, duplicatedContent: ContentSummary) => {
                if (isFinished) {
                    this.openTab(duplicatedContent);
                }
            });
        }
    }

    private checkFinished(): wemQ.Promise<Boolean> {

        let deferred = wemQ.defer<Boolean>();

        const handler = (taskState: TaskState) => {
            if (taskState === TaskState.FINISHED) {
                deferred.resolve(true);
            }
            this.unProgressComplete(handler);
        };

        this.onProgressComplete(handler);

        return deferred.promise;
    }

    private checkDuplicated(itemToDuplicate: ContentSummary) {

        let deferred = wemQ.defer<ContentSummary>();

        const serverEvents = ContentServerEventsHandler.getInstance();

        const handler = (data: ContentSummaryAndCompareStatus[]) => {

            data.forEach((value: ContentSummaryAndCompareStatus) => {
                const createdContent = value.getContentSummary();
                const createdPath = createdContent.getPath();

                const path = itemToDuplicate.getPath();

                const isDuplicatedContent = createdPath.getParentPath().equals(path.getParentPath());

                if (isDuplicatedContent) {

                    serverEvents.unContentDuplicated(handler);

                    deferred.resolve(createdContent);
                }
            });

            // Remove handler in case some items have error
        };
        serverEvents.onContentDuplicated(handler);
        setTimeout(() => serverEvents.unContentDuplicated(handler), 300000);

        return deferred.promise;
    }

    private openTab(content: ContentSummary) {
        let tabId = AppBarTabId.forEdit(content.getContentId().toString());

        let wizardParams = new ContentWizardPanelParams()
            .setTabId(tabId)
            .setContentTypeName(content.getType())
            .setContentId(content.getContentId());

        ContentEventsProcessor.openWizardTab(wizardParams, tabId);
    }

    private countItemsToDuplicateAndUpdateButtonCounter() {
        this.actionButton.setLabel(i18n('action.duplicate'));

        this.totalItemsToDuplicate = this.countTotal();
        this.updateButtonCount(i18n('action.duplicate'), this.totalItemsToDuplicate);
    }

    private createDuplicateRequest(): DuplicateContentRequest {
        const duplicatableIds: DuplicatableId[] = this.getItemList().getItemViews().map(
            item => (<DuplicatableId>{contentId: item.getContentId(), includeChildren: item.includesChildren()}));

        return new DuplicateContentRequest(duplicatableIds);
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new DialogTogglableItemList(true);
    }

    protected getItemList(): DialogTogglableItemList {
        return <DialogTogglableItemList>super.getItemList();
    }
}
