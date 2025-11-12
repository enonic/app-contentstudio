import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {MenuButton, MenuButtonConfig} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentDeletePromptEvent} from '../browse/ContentDeletePromptEvent';
import {ContentTreeGridDeselectAllEvent} from '../browse/ContentTreeGridDeselectAllEvent';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ContentDialogSubTitle} from '../dialog/ContentDialogSubTitle';
import {DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {ArchiveContentRequest} from '../resource/ArchiveContentRequest';
import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {ResolveDeleteRequest} from '../resource/ResolveDeleteRequest';
import {ConfirmValueDialog} from './ConfirmValueDialog';
import {ContentDeleteDialogAction} from './ContentDeleteDialogAction';
import {DependantItemsWithReferencesDialog} from '../dialog/DependantItemsWithReferencesDialog';
import {Body} from '@enonic/lib-admin-ui/dom/Body';

enum ActionType {
    DELETE = 'delete',
    ARCHIVE = 'archive',
}

export class ContentDeleteDialog
    extends DependantItemsWithReferencesDialog {

    private yesCallback: (exclude?: CompareStatus[]) => void;

    private noCallback: () => void;

    private totalItemsToDelete: number;

    private archiveAction: Action;

    private deleteNowAction: ContentDeleteDialogAction;

    private menuButton: MenuButton;

    private confirmExecutionDialog?: ConfirmValueDialog;

    private actionInProgressType: ActionType;

    private messageSubTitle: ContentDialogSubTitle;

    private archiveMessage: string;

    constructor() {
        super({
            title: i18n('dialog.archive'),
            class: 'content-delete-dialog',
            dialogSubName: i18n('dialog.archive.subname'),
            dependantsTitle: i18n('dialog.archive.dependants'),
            processingLabel: `${i18n('field.progress.deleting')}...`,
            buttonRow: new ContentDeleteDialogButtonRow(),
            processHandler: () => new ContentDeletePromptEvent([]).fire(),
            confirmation: {},
        } satisfies DependantItemsWithProgressDialogConfig);
    }

    protected initElements(): void {
        super.initElements();

        this.archiveAction = new Action(i18n('dialog.archive.action'));
        this.archiveAction.onExecuted(this.archive.bind(this));

        this.deleteNowAction = new ContentDeleteDialogAction();
        this.deleteNowAction.onExecuted(this.delete.bind(this, false, true));

        this.menuButton = this.getButtonRow().makeActionMenu({
            defaultAction: this.archiveAction,
            menuActions: [this.deleteNowAction]
        });
        this.actionButton = this.menuButton.getActionButton();

        this.messageSubTitle = new ContentDialogSubTitle({
            placeholderText: i18n('dialog.archive.message.placeholder'),
            hintText: i18n('dialog.archive.message.hint')
        });
    }

    getButtonRow(): ContentDeleteDialogButtonRow {
        return super.getButtonRow() as ContentDeleteDialogButtonRow;
    }

    protected initListeners() {
        super.initListeners();

        this.progressManager.onProgressComplete((task: TaskState) => {
            if (this.actionInProgressType === ActionType.ARCHIVE && task === TaskState.FINISHED) {
                this.messageSubTitle.setMessage('');

                const msg: string = this.totalItemsToDelete > 1 ? i18n('dialog.archive.success.multiple', this.totalItemsToDelete) :
                                    i18n('dialog.archive.success.single', this.getItemList().getItems()[0].getDisplayName());
                NotifyManager.get().showSuccess(msg);
            }
        });
    }

    protected createResolveRequest(ids: ContentId[]): ResolveDeleteRequest {
        return new ResolveDeleteRequest(ids);
    }

    manageContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);

        return this;
    }

    setContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.manageContentToDelete(contents);
        this.manageDescendants();

        return this;
    }

    setYesCallback(callback: () => void): ContentDeleteDialog {
        this.yesCallback = callback;
        return this;
    }

    setNoCallback(callback: () => void): ContentDeleteDialog {
        this.noCallback = callback;
        return this;
    }

    updateProgressLabel(): void {
        const label = this.actionInProgressType === ActionType.DELETE ?
                      `${i18n('field.progress.deleting')}...` :
                      `${i18n('field.progress.archiving')}...`;
        this.setProcessingLabel(label);
    }

    private archive(): void {
        this.archiveMessage = this.messageSubTitle.getValue();
        this.executeAction(ActionType.ARCHIVE);
    }

    private delete(): void {
        this.executeAction(ActionType.DELETE);
    }

    private executeAction(type: ActionType): void {
        this.actionInProgressType = type;

        if (this.totalItemsToDelete > 1 || this.isAnySiteToBeDeleted()) {
            this.confirmAndExecute();
        } else {
            this.executeNow();
        }
    }

    private confirmAndExecute(): void {
        const totalItemsToProcess: number = this.totalItemsToDelete;
        const yesCallback: () => void = this.createConfirmExecutionCallback();

        const lastFocusedElement = Body.get().getFocusedElement();
        if (lastFocusedElement) {
            Body.get().setFocusedElement(null);
        }

        this.close();

        if (lastFocusedElement) {
            Body.get().setFocusedElement(lastFocusedElement);
        }

        if (!this.confirmExecutionDialog) {
            this.confirmExecutionDialog = new ConfirmValueDialog();
        }

        this.confirmExecutionDialog
            .setHeaderText(this.actionInProgressType === ActionType.DELETE ? i18n('dialog.confirmDelete') : i18n('dialog.confirmArchive'))
            .setSubheaderText(this.actionInProgressType === ActionType.DELETE ? i18n('dialog.confirmDelete.subname') : i18n(
                'dialog.confirmArchive.subname'))
            .setValueToCheck('' + totalItemsToProcess)
            .setYesCallback(yesCallback)
            .open();
    }

    private createConfirmExecutionCallback(): () => void {
        const content = this.getItemList().getItems().slice(0);
        const descendants = this.getDependantList().getItems().slice(0);

        return () => {
            // Manually manage content and dependants without any requests
            this.manageContentToDelete(content);
            this.setDependantItems(descendants);
            this.countItemsToDeleteAndUpdateButtonCounter();
            this.open();
            this.executeNow();
        };
    }

    private executeNow(): void {
        if (this.yesCallback) {
            this.yesCallback();
        }

        this.lockControls();

        const request: ResourceRequest<TaskId> = this.createExecutionRequest();

        new ContentTreeGridDeselectAllEvent().fire();

        const isArchiveAction = this.actionInProgressType === ActionType.ARCHIVE;
        this.progressManager.setSuppressNotifications(isArchiveAction);

        this.setHeading(i18n(isArchiveAction ? 'dialog.archive' : 'dialog.delete'));
        this.setSubTitle(i18n(isArchiveAction ? 'dialog.archiving' : 'dialog.deleting', this.countTotal()));

        this.updateProgressLabel();

        request.sendAndParse()
            .then((taskId: TaskId) => {
                this.pollTask(taskId);
            })
            .catch((reason) => {
                this.close();
                if (reason && reason.message) {
                    showError(reason.message);
                }
            });
    }

    private countItemsToDeleteAndUpdateButtonCounter(): void {
        this.actionButton.getAction().setLabel(i18n('dialog.archive.action'));

        this.totalItemsToDelete = this.countTotal();
        this.updateButtonCount(i18n('dialog.archive.action'), this.totalItemsToDelete);
        this.deleteNowAction.setLabel(
            `${i18n('action.delete')} ${this.totalItemsToDelete > 1 ? '(' + this.totalItemsToDelete + ')' : ''}`
        );
    }

    private createExecutionRequest(): ResourceRequest<TaskId> {
        return this.actionInProgressType === ActionType.DELETE ? this.createDeleteRequest() : this.createArchiveRequest();
    }

    private createDeleteRequest(): DeleteContentRequest {
        const deleteRequest: DeleteContentRequest = new DeleteContentRequest();

        this.getItemList().getItems().forEach((item: ContentSummaryAndCompareStatus) => {
            deleteRequest.addContentPath(item.getContentSummary().getPath());
        });

        deleteRequest.setDeleteOnline(true);

        return deleteRequest;
    }

    private createArchiveRequest(): ArchiveContentRequest {
        const archiveContentRequest: ArchiveContentRequest = new ArchiveContentRequest();

        this.getItemList().getItems().forEach((item: ContentSummaryAndCompareStatus) => {
            archiveContentRequest.addContentId(item.getContentId());
        });

        archiveContentRequest.setArchiveMessage(this.archiveMessage);

        return archiveContentRequest;
    }

    private doAnyHaveChildren(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.some((item: ContentSummaryAndCompareStatus) => {
            return item.getContentSummary().hasChildren();
        });
    }

    private isAnySiteToBeDeleted(): boolean {
        let result = this.getItemList().getItems().some((item: ContentSummaryAndCompareStatus) => {
            return item.getContentSummary().isSite();
        });

        if (result) {
            return true;
        }

        let dependantList = this.getDependantList();
        if (dependantList.getItemCount() > 0) {
            return dependantList.getItems().some((descendant: ContentSummaryAndCompareStatus) => {
                return descendant.getContentSummary().isSite();
            });
        } else {
            return false;
        }
    }

    protected handleDescendantsLoaded(): void {
        super.handleDescendantsLoaded();

        this.countItemsToDeleteAndUpdateButtonCounter();
    }

    protected lockMenu(): void {
        this.archiveAction.setEnabled(false);
        this.deleteNowAction.setEnabled(false);
        this.menuButton.setDropdownHandleEnabled(false);
    }

    protected unlockMenu(): void {
        this.archiveAction.setEnabled(true);
        this.deleteNowAction.setEnabled(true);
        this.menuButton.setDropdownHandleEnabled(true);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.setSubTitleEl(this.messageSubTitle);

            return rendered;
        });
    }

    setSubTitle(text: string) {
        this.messageSubTitle.setMessage(text.trim());
    }

}

export class ContentDeleteDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(menuButtonConfig: MenuButtonConfig, useDefault: boolean = true): MenuButton {
        super.makeActionMenu(menuButtonConfig, useDefault);

        return this.actionMenu.addClass('delete-dialog-menu') as MenuButton;
    }

}
