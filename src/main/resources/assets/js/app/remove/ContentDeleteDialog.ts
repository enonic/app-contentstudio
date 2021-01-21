import * as Q from 'q';
import {showError, showWarning} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {NotifyManager} from 'lib-admin-ui/notify/NotifyManager';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentDeleteDialogAction} from './ContentDeleteDialogAction';
import {ConfirmValueDialog} from './ConfirmValueDialog';
import {ContentDeletePromptEvent} from '../browse/ContentDeletePromptEvent';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {DeleteDialogItemList} from './DeleteDialogItemList';
import {DeleteItemViewer} from './DeleteItemViewer';
import {ResolveDependenciesRequest} from '../resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from '../resource/ResolveDependenciesResult';
import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {CompareStatus} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';
import {DropdownButtonRow} from 'lib-admin-ui/ui/dialog/DropdownButtonRow';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ContentId} from 'lib-admin-ui/content/ContentId';
import {ResolveDeleteRequest} from '../resource/ResolveDeleteRequest';

export class ContentDeleteDialog
    extends DependantItemsWithProgressDialog {

    private yesCallback: (exclude?: CompareStatus[]) => void;

    private noCallback: () => void;

    private totalItemsToDelete: number;

    private messageId: string;

    private markDeletedAction: Action;

    private deleteConfirmationDialog?: ConfirmValueDialog;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
                title: i18n('dialog.delete'),
                class: 'delete-dialog',
                dialogSubName: i18n('dialog.delete.subname'),
                dependantsDescription: i18n('dialog.delete.dependants'),
                showDependantList: true,
                processingLabel: `${i18n('field.progress.deleting')}...`,
                buttonRow: new ContentDeleteDialogButtonRow(),
                processHandler: () => {
                    new ContentDeletePromptEvent([]).fire();
                },
                confirmation: {}
            }
        );
    }

    protected initElements() {
        super.initElements();

        this.markDeletedAction = new Action(i18n('dialog.delete.markDeleted'));
        this.markDeletedAction.onExecuted(this.doDelete.bind(this, false, false));

        const deleteNowAction = new ContentDeleteDialogAction();
        deleteNowAction.onExecuted(this.doDelete.bind(this, false, true));

        const menuButton = this.getButtonRow().makeActionMenu(deleteNowAction, [this.markDeletedAction]);
        this.actionButton = menuButton.getActionButton();
    }

    getButtonRow(): ContentDeleteDialogButtonRow {
        return <ContentDeleteDialogButtonRow>super.getButtonRow();
    }

    protected initListeners() {
        super.initListeners();

        this.getItemList().onItemsRemoved(this.onListItemsRemoved.bind(this));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    private onListItemsRemoved() {
        if (this.isIgnoreItemsChanged()) {
            return;
        }

        this.updateSubTitle();

        this.manageDescendants();
    }

    protected createItemList(): DeleteDialogItemList {
        return new DeleteDialogItemList();
    }

    protected getItemList(): DeleteDialogItemList {
        return <DeleteDialogItemList>super.getItemList();
    }

    protected manageInboundDependencies(contents: ContentSummaryAndCompareStatus[]) {
        new ResolveDependenciesRequest(contents.map(content => content.getContentId())).sendAndParse().then(
            (result: ResolveDependenciesResult) => {

                const dependencyCount = result.getIncomingDependenciesCount();

                if (!Object.keys(dependencyCount).length) {
                    return;
                }

                this.messageId = showWarning(
                    i18n('dialog.delete.dependency.warning'), false);

                this.addClickIgnoredElement(NotifyManager.get().getNotification(this.messageId));

                this.getItemList().getItemViews().forEach((itemView) => {
                    const contentId = (<ContentSummaryAndCompareStatus>itemView.getBrowseItem()).getContentId().toString();

                    if (dependencyCount.hasOwnProperty(contentId)) {
                        (<DeleteItemViewer>itemView.getViewer()).setInboundDependencyCount(dependencyCount[contentId]);
                    }

                });
            });
    }

    protected manageDescendants() {
        this.showLoadMask();
        this.lockControls();

        this.loadDescendantIds().then(() => {
            return this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
                this.manageInstantDeleteStatus(this.getItemList().getItems());
            }).finally(() => {
                this.notifyResize();
                this.hideLoadMask();
                this.unlockControls();
                this.countItemsToDeleteAndUpdateButtonCounter();
                this.updateTabbable();
                this.actionButton.giveFocus();
            });
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    protected createResolveDescendantsRequest(): ResolveDeleteRequest {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());
        return new ResolveDeleteRequest(ids);
    }

    manageContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        this.updateSubTitle();

        return this;
    }

    private manageInstantDeleteStatus(items: ContentSummaryAndCompareStatus[]) {
        const allOffline = this.isEveryOffline(items);
        const allPendingDelete = this.isEveryPendingDelete(items);

        this.markDeletedAction.setEnabled(!allOffline && !allPendingDelete);
    }

    close() {
        super.close();
        if (this.messageId) {

            this.removeClickIgnoredElement(NotifyManager.get().getNotification(this.messageId));
            NotifyManager.get().hide(this.messageId);

            this.messageId = '';
        }
    }

    setContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.manageContentToDelete(contents);
        this.manageInstantDeleteStatus(contents);
        this.manageInboundDependencies(contents);
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

    private doDelete(ignoreConfirmation: boolean = false, isInstantDelete: boolean) {
        if (!ignoreConfirmation && (this.totalItemsToDelete > 1 || this.isAnySiteToBeDeleted())) {
            const totalItemsToDelete = this.totalItemsToDelete;
            const deleteRequest = this.createDeleteRequest(isInstantDelete);
            const content = this.getItemList().getItems().slice(0);
            const descendants = this.getDependantList().getItems().slice(0);
            const yesCallback = () => {
                // Manually manage content and dependants without any requests
                this.manageContentToDelete(content);
                this.setDependantItems(descendants);
                this.countItemsToDeleteAndUpdateButtonCounter();
                this.open();
                this.doDelete(true, isInstantDelete);
            };

            this.close();

            if (!this.deleteConfirmationDialog) {
                this.initDeleteConfirmationDialog();
            }

            this.deleteConfirmationDialog
                .setValueToCheck('' + totalItemsToDelete)
                .setYesCallback(yesCallback)
                .open();
        } else {
            if (this.yesCallback) {
                isInstantDelete ? this.yesCallback([]) : this.yesCallback();
            }

            this.lockControls();

            this.createDeleteRequest(isInstantDelete)
                .sendAndParse()
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
    }

    private countItemsToDeleteAndUpdateButtonCounter() {
        this.actionButton.setLabel(i18n('dialog.deleteNow'));

        this.totalItemsToDelete = this.countTotal();
        this.updateButtonCount(i18n('dialog.deleteNow'), this.totalItemsToDelete);
    }

    private createDeleteRequest(isInstantDelete: boolean): DeleteContentRequest {
        let deleteRequest = new DeleteContentRequest();

        this.getItemList().getItems().forEach((item) => {
            deleteRequest.addContentPath(item.getContentSummary().getPath());
        });

        deleteRequest.setDeleteOnline(isInstantDelete);

        return deleteRequest;
    }

    private doAnyHaveChildren(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.some((item: ContentSummaryAndCompareStatus) => {
            return item.getContentSummary().hasChildren();
        });
    }

    private isEveryOffline(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.every((item: ContentSummaryAndCompareStatus) => {
            return item.getCompareStatus() === CompareStatus.NEW;
        });
    }

    private isEveryPendingDelete(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.every((item: ContentSummaryAndCompareStatus) => {
            return item.getCompareStatus() === CompareStatus.PENDING_DELETE;
        });
    }

    private updateSubTitle() {
        let items = this.getItemList().getItems();

        if (!this.doAnyHaveChildren(items)) {
            super.setSubTitle('');
        } else {
            super.setSubTitle(i18n('dialog.delete.subname'));
        }
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

    private initDeleteConfirmationDialog() {
        this.deleteConfirmationDialog = new ConfirmValueDialog();
        this.deleteConfirmationDialog
            .setHeaderText(i18n('dialog.confirmDelete'))
            .setSubheaderText((i18n('dialog.confirmDelete.subname')));
    }

}

export class ContentDeleteDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(mainAction: Action, menuActions: Action[], useDefault: boolean = true): MenuButton {
        super.makeActionMenu(mainAction, menuActions, useDefault);

        return <MenuButton>this.actionMenu.addClass('delete-dialog-menu');
    }

}
