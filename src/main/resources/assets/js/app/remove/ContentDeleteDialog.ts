import '../../api.ts';
import {ContentDeleteDialogAction} from './ContentDeleteDialogAction';
import {ConfirmContentDeleteDialog} from './ConfirmContentDeleteDialog';
import {ContentDeletePromptEvent} from '../browse/ContentDeletePromptEvent';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {DeleteDialogItemList} from './DeleteDialogItemList';
import {DeleteItemViewer} from './DeleteItemViewer';
import CompareStatus = api.content.CompareStatus;
import ContentSummaryAndCompareStatus = api.content.ContentSummaryAndCompareStatus;
import i18n = api.util.i18n;
import NotifyManager = api.notify.NotifyManager;

export class ContentDeleteDialog
    extends DependantItemsWithProgressDialog {

    private instantDeleteCheckbox: api.ui.Checkbox;

    private yesCallback: (exclude?: CompareStatus[]) => void;

    private noCallback: () => void;

    private totalItemsToDelete: number;

    protected autoUpdateTitle: boolean = true;

    private messageId: string;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig> {
                title: i18n('dialog.delete'),
                dialogSubName: i18n('dialog.delete.subname'),
                dependantsDescription: i18n('dialog.delete.dependants'),
                processingLabel: `${i18n('field.progress.deleting')}...`,
                processHandler: () => {
                    new ContentDeletePromptEvent([]).fire();
                },
            }
        );

        this.addClass('delete-dialog');

        this.getItemList().onItemsRemoved(this.onListItemsRemoved.bind(this));

        let deleteAction = new ContentDeleteDialogAction();
        deleteAction.onExecuted(this.doDelete.bind(this, false));
        this.actionButton = this.addAction(deleteAction, true, true);

        this.addCancelButtonToBottom();

        this.instantDeleteCheckbox = api.ui.Checkbox.create().setLabelText(i18n('dialog.delete.instantly')).build();
        this.instantDeleteCheckbox.addClass('instant-delete-check');

        this.appendChild(this.instantDeleteCheckbox);
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
        new api.content.resource.ResolveDependenciesRequest(contents.map(content => content.getContentId())).sendAndParse().then(
            (result: api.content.resource.ResolveDependenciesResult) => {

                const dependencyCount = result.getIncomingDependenciesCount();

                if (!Object.keys(dependencyCount).length) {
                    return;
                }

                this.messageId = api.notify.showWarning(
                    i18n('dialog.delete.dependency.warning'), false);

                this.addClickIgnoredElement(NotifyManager.get().getNotification(this.messageId));

                this.getItemList().getItemViews().forEach((itemView) => {
                    const contentId = itemView.getBrowseItem().getModel().getContentId().toString();

                    if (dependencyCount.hasOwnProperty(contentId)) {
                        (<DeleteItemViewer>itemView.getViewer()).setInboundDependencyCount(dependencyCount[contentId]);
                    }

                });
            });
    }

    protected manageDescendants() {
        this.loadMask.show();
        this.lockControls();

        return this.loadDescendantIds().then(() => {
            this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
                this.manageInstantDeleteStatus(this.getItemList().getItems());
                this.countItemsToDeleteAndUpdateButtonCounter();
            }).finally(() => {
                this.notifyResize();
                this.loadMask.hide();
                this.unlockControls();
                this.updateTabbable();
                this.actionButton.giveFocus();
            });
        });
    }

    manageContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        this.updateSubTitle();

        return this;
    }

    private manageInstantDeleteStatus(items: ContentSummaryAndCompareStatus[]) {
        const isHidden = this.isEveryOffline(items);
        const isChecked = isHidden ? false : this.isEveryPendingDelete(items);

        // All Offline - hidden
        // All Pending Delete - hidden, checked
        // Any Online - unchecked
        this.instantDeleteCheckbox.setVisible(!isHidden && !isChecked);
        this.instantDeleteCheckbox.setChecked(isChecked, true);
    }

    close() {
        super.close();
        this.instantDeleteCheckbox.setChecked(false);
        if (this.messageId) {

            this.removeClickIgnoredElement(api.notify.NotifyManager.get().getNotification(this.messageId));
            api.notify.NotifyManager.get().hide(this.messageId);

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

    private doDelete(ignoreConfirmation: boolean = false) {
        if (!ignoreConfirmation && (this.totalItemsToDelete > 1 || this.isAnySiteToBeDeleted())) {
            const totalItemsToDelete = this.totalItemsToDelete;
            const deleteRequest = this.createDeleteRequest();
            const content = this.getItemList().getItems().slice(0);
            const descendants = this.getDependantList().getItems().slice(0);
            const instantDeleteStatus = this.instantDeleteCheckbox.isChecked();
            const yesCallback = () => {
                // Manually manage content and dependants without any requests
                this.manageContentToDelete(content);
                this.setDependantItems(descendants);
                this.instantDeleteCheckbox.setChecked(instantDeleteStatus);
                this.countItemsToDeleteAndUpdateButtonCounter();
                this.open();
                this.doDelete(true);
            };

            this.close();

            new ConfirmContentDeleteDialog({totalItemsToDelete, deleteRequest, yesCallback}).open();
        } else {
            if (this.yesCallback) {
                this.instantDeleteCheckbox.isChecked() ? this.yesCallback([]) : this.yesCallback();
            }

            this.lockControls();

            this.createDeleteRequest()
                .sendAndParse()
                .then((taskId: api.task.TaskId) => {
                    this.pollTask(taskId);
                })
                .catch((reason) => {
                    this.close();
                    if (reason && reason.message) {
                        api.notify.showError(reason.message);
                    }
                });
        }
    }

    private countItemsToDeleteAndUpdateButtonCounter() {
        this.actionButton.setLabel(i18n('action.delete'));

        this.totalItemsToDelete = this.countTotal();
        this.updateButtonCount(i18n('action.delete'), this.totalItemsToDelete);
    }

    private createDeleteRequest(): api.content.resource.DeleteContentRequest {
        let deleteRequest = new api.content.resource.DeleteContentRequest();

        this.getItemList().getItems().forEach((item) => {
            deleteRequest.addContentPath(item.getContentSummary().getPath());
        });

        deleteRequest.setDeleteOnline(this.instantDeleteCheckbox.isChecked());

        return deleteRequest;
    }

    private doAnyHaveChildren(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.some((item: ContentSummaryAndCompareStatus) => {
            return item.getContentSummary().hasChildren();
        });
    }

    private isEveryOffline(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.every((item: ContentSummaryAndCompareStatus) => {
            return this.isStatusOffline(item.getCompareStatus());
        });
    }

    private isEveryPendingDelete(items: ContentSummaryAndCompareStatus[]): boolean {
        return items.every((item: ContentSummaryAndCompareStatus) => {
            return this.isStatusPendingDelete(item.getCompareStatus());
        });
    }

    private isStatusOffline(status: CompareStatus): boolean {
        return status === CompareStatus.NEW;
    }

    private isStatusPendingDelete(status: CompareStatus): boolean {
        return status === CompareStatus.PENDING_DELETE;
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

}
