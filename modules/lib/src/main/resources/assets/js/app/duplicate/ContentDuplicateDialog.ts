import * as Q from 'q';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {ContentDuplicateDialogAction} from './ContentDuplicateDialogAction';
import {ContentDuplicatePromptEvent} from '../browse/ContentDuplicatePromptEvent';
import {DialogTogglableItemList, TogglableStatusSelectionItem} from '../dialog/DialogTogglableItemList';
import {DuplicateContentRequest} from '../resource/DuplicateContentRequest';
import {ContentWizardPanelParams} from '../wizard/ContentWizardPanelParams';
import {ContentEventsProcessor} from '../ContentEventsProcessor';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ManagedActionExecutor} from '@enonic/lib-admin-ui/managedaction/ManagedActionExecutor';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {ContentAppBarTabId} from '../ContentAppBarTabId';
import {ContentSummary} from '../content/ContentSummary';
import {ContentDuplicateParams} from '../resource/ContentDuplicateParams';

export class ContentDuplicateDialog
    extends DependantItemsWithProgressDialog
    implements ManagedActionExecutor {

    private yesCallback: () => void;

    private noCallback: () => void;

    private totalItemsToDuplicate: number;

    private messageId: string;

    private openTabAfterDuplicate: boolean;

    private duplicateAction: ContentDuplicateDialogAction;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig> {
                title: i18n('dialog.duplicate'),
                class: 'content-duplicate-dialog',
                dependantsDescription: i18n('dialog.duplicate.dependants'),
                processingLabel: `${i18n('field.progress.duplicating')}...`,
                processHandler: () => new ContentDuplicatePromptEvent([]).fire()
            }
        );
    }

    protected initElements() {
        super.initElements();

        this.duplicateAction = new ContentDuplicateDialogAction();
        this.actionButton = this.addAction(this.duplicateAction, true, true);
    }

    protected initListeners() {
        super.initListeners();

        this.duplicateAction.onExecuted(this.doDuplicate.bind(this, false));
        this.initItemListListeners();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    private initItemListListeners() {
        const reloadDependenciesDebounced = AppHelper.debounce(() => {
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
        return <ContentSummaryAndCompareStatus[]>this.getItemList().getItemViews()
            .filter(view => view.includesChildren())
            .map(view => view.getBrowseItem());
    }

    protected manageDescendants() {
        this.showLoadMask();
        this.lockControls();

        this.loadDescendantIds().then(() => {
            return this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
            }).finally(() => {
                this.hideLoadMask();
                this.unlockControls();
                this.countItemsToDuplicateAndUpdateButtonCounter();
                this.updateTabbable();
                this.actionButton.giveFocus();
            });
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
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

            this.removeClickIgnoredElement(NotifyManager.get().getNotification(this.messageId));
            NotifyManager.get().hide(this.messageId);

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
            .then((taskId: TaskId) => {
                this.pollTask(taskId);
                return this.checkFinished();
            })
            .catch((reason) => {
                this.close();
                if (reason && reason.message) {
                    showError(reason.message);
                }
            });

        if (this.openTabAfterDuplicate) {

            const duplicatedPromise = this.checkDuplicated(itemToDuplicate.getContentSummary());

            Q.all([taskIsFinishedPromise, duplicatedPromise]).spread((isFinished: boolean, duplicatedContent: ContentSummary) => {
                if (isFinished) {
                    this.openTabOnDuplicate(duplicatedContent);
                }
            });
        }
    }

    private checkFinished(): Q.Promise<Boolean> {

        const deferred = Q.defer<Boolean>();

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

        const deferred = Q.defer<ContentSummary>();

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

    protected getWizardParams(content: ContentSummary): ContentWizardPanelParams {
        const tabId: ContentAppBarTabId = ContentAppBarTabId.forEdit(content.getContentId().toString());
        return new ContentWizardPanelParams()
            .setTabId(tabId)
            .setContentTypeName(content.getType())
            .setContentId(content.getContentId());
    }

    protected openTabOnDuplicate(content: ContentSummary) { // used in studio plus
        ContentEventsProcessor.openWizardTab(this.getWizardParams(content));
    }

    private countItemsToDuplicateAndUpdateButtonCounter() {
        this.actionButton.getAction().setLabel(i18n('action.duplicate'));

        this.totalItemsToDuplicate = this.countTotal();
        this.updateButtonCount(i18n('action.duplicate'), this.totalItemsToDuplicate);
    }

    private createDuplicateRequest(): DuplicateContentRequest {
        const contentDuplicateParams: ContentDuplicateParams[] =
            this.getItemList().getItemViews().map((item: TogglableStatusSelectionItem) =>
                new ContentDuplicateParams(item.getContentId()).setIncludeChildren(item.includesChildren()));

        return new DuplicateContentRequest(contentDuplicateParams);
    }

    protected createItemList(): ListBox<ContentSummaryAndCompareStatus> {
        return new DialogTogglableItemList(true);
    }

    protected getItemList(): DialogTogglableItemList {
        return <DialogTogglableItemList>super.getItemList();
    }
}
