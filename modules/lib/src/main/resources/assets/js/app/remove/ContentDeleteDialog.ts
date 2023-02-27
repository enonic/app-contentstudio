import {DefaultErrorHandler} from '@enonic/lib-admin-ui/DefaultErrorHandler';
import {showError} from '@enonic/lib-admin-ui/notify/MessageBus';
import {NotifyManager} from '@enonic/lib-admin-ui/notify/NotifyManager';
import {ResourceRequest} from '@enonic/lib-admin-ui/rest/ResourceRequest';
import {TaskId} from '@enonic/lib-admin-ui/task/TaskId';
import {TaskState} from '@enonic/lib-admin-ui/task/TaskState';
import {Action} from '@enonic/lib-admin-ui/ui/Action';
import {MenuButton} from '@enonic/lib-admin-ui/ui/button/MenuButton';
import {DropdownButtonRow} from '@enonic/lib-admin-ui/ui/dialog/DropdownButtonRow';
import {ListBox} from '@enonic/lib-admin-ui/ui/selector/list/ListBox';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import * as Q from 'q';
import {ContentDeletePromptEvent} from '../browse/ContentDeletePromptEvent';
import {ContentTreeGridDeselectAllEvent} from '../browse/ContentTreeGridDeselectAllEvent';
import {CompareStatus} from '../content/CompareStatus';
import {ContentId} from '../content/ContentId';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ArchiveCheckableItem} from '../dialog/ArchiveCheckableItem';
import {ArchiveSelectableItem} from '../dialog/ArchiveSelectableItem';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {DialogStateBar} from '../dialog/DialogStateBar';
import {DialogStateEntry} from '../dialog/DialogStateEntry';
import {ContentServerChangeItem} from '../event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../event/ContentServerEventsHandler';
import {ArchiveContentRequest} from '../resource/ArchiveContentRequest';
import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {ResolveContentForDeleteResult} from '../resource/ResolveContentForDeleteResult';
import {ResolveDeleteRequest} from '../resource/ResolveDeleteRequest';
import {ConfirmValueDialog} from './ConfirmValueDialog';
import {ContentDeleteDialogAction} from './ContentDeleteDialogAction';
import {DeleteDialogDependantList} from './DeleteDialogDependantList';
import {DeleteDialogItemList} from './DeleteDialogItemList';

enum ActionType {
    DELETE = 'delete',
    ARCHIVE = 'archive',
}

export class ContentDeleteDialog
    extends DependantItemsWithProgressDialog {

    private yesCallback: (exclude?: CompareStatus[]) => void;

    private noCallback: () => void;

    private totalItemsToDelete: number;

    private archiveAction: Action;

    private deleteNowAction: ContentDeleteDialogAction;

    private menuButton: MenuButton;

    private confirmExecutionDialog?: ConfirmValueDialog;

    private stateBar: DialogStateBar;

    private inboundErrorsEntry: DialogStateEntry;

    private resolveDependenciesResult: ResolveContentForDeleteResult;

    private referenceIds: ContentId[];

    private actionInProgressType: ActionType;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
            title: i18n('dialog.archive'),
            class: 'content-delete-dialog',
            dialogSubName: i18n('dialog.archive.subname'),
            dependantsTitle: i18n('dialog.archive.dependants'),
            showDependantList: true,
            processingLabel: `${i18n('field.progress.deleting')}...`,
            buttonRow: new ContentDeleteDialogButtonRow(),
            processHandler: () => new ContentDeletePromptEvent([]).fire(),
            confirmation: {}
        });
    }

    protected initElements() {
        super.initElements();

        this.archiveAction = new Action(i18n('dialog.archive.action'));
        this.archiveAction.onExecuted(this.archive.bind(this));

        this.deleteNowAction = new ContentDeleteDialogAction();
        this.deleteNowAction.onExecuted(this.delete.bind(this, false, true));

        this.menuButton = this.getButtonRow().makeActionMenu(this.archiveAction, [this.deleteNowAction]);
        this.actionButton = this.menuButton.getActionButton();

        this.stateBar = new DialogStateBar({hideIfResolved: true});
        this.inboundErrorsEntry = this.stateBar.addErrorEntry({
            text: i18n('dialog.archive.warning.text'),
            actionButtons: [{
                label: i18n('dialog.archive.warning.ignore'),
                markIgnored: true,
            }],
        });
    }

    getButtonRow(): ContentDeleteDialogButtonRow {
        return <ContentDeleteDialogButtonRow>super.getButtonRow();
    }

    protected initListeners() {
        super.initListeners();

        this.getItemList().onItemsRemoved(() => this.onListItemsRemoved());

        const itemsAddedHandler = (items: ContentSummaryAndCompareStatus[], itemList: ListBox<ContentSummaryAndCompareStatus>) => {
            if (this.resolveDependenciesResult) {
                this.updateItemViewsWithInboundDependencies(items.map(item => itemList.getItemView(item) as ArchiveCheckableItem));
            }
        };

        this.getItemList().onItemsAdded(items => itemsAddedHandler(items, this.getItemList()));
        this.getDependantList().onItemsAdded(items => itemsAddedHandler(items, this.getDependantList()));

        this.progressManager.onProgressComplete((task: TaskState) => {
            if (this.actionInProgressType === ActionType.ARCHIVE && task === TaskState.FINISHED) {
                const msg: string = this.totalItemsToDelete > 1 ? i18n('dialog.archive.success.multiple', this.totalItemsToDelete) :
                                    i18n('dialog.archive.success.single', this.getItemList().getItems()[0].getDisplayName());
                NotifyManager.get().showSuccess(msg);
            }
        });

        this.stateBar.onResolvedStateChange(resolved => this.toggleControls(resolved));

        const handleRefsChange = (items: ContentSummaryAndCompareStatus[] | ContentServerChangeItem[]): void => {
            if (!this.isOpen()) {
                return;
            }
            const contentIds = items.map(item => item.getContentId());
            const referringWasUpdated = this.referenceIds.find(id => contentIds.some(contentId => contentId.equals(id)));
            if (referringWasUpdated) {
                this.refreshInboundRefs();
            }
        };

        ContentServerEventsHandler.getInstance().onContentUpdated(handleRefsChange);
        ContentServerEventsHandler.getInstance().onContentDeleted(handleRefsChange);
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();
            this.prependChildToContentPanel(this.stateBar);

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
        return super.getItemList() as DeleteDialogItemList;
    }

    protected createDependantList(): DeleteDialogDependantList {
        const observer = this.createObserverConfig();
        return new DeleteDialogDependantList(observer);
    }

    protected getDependantList(): DeleteDialogDependantList {
        return super.getDependantList() as DeleteDialogDependantList;
    }

    private updateItemViewsWithInboundDependencies(itemViews: (ArchiveCheckableItem | ArchiveSelectableItem)[]) {
        itemViews.forEach((itemView: ArchiveCheckableItem) => {
            const hasInbound = this.hasInboundRef(itemView.getItem().getId());
            itemView.setHasInbound(hasInbound);
        });
    }

    private hasInboundRef(id: string): boolean {
        return this.resolveDependenciesResult?.hasInboundDependency(id);
    }

    private refreshInboundRefs(): Q.Promise<void> {
        return this.resolveDescendants()
            .then(() => this.resolveItemsWithInboundRefs(true))
            .then(() => {
                if (!this.resolveDependenciesResult.hasInboundDependencies()) {
                    this.unlockMenu();
                }
            }).catch(DefaultErrorHandler.handle);
    }

    private manageDescendants() {
        this.showLoadMask();
        this.lockControls();

        this.loadDescendantIds().then(() => {
            this.resolveItemsWithInboundRefs();

            return this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                this.setDependantItems(descendants);
                return Q(null);
            }).finally(() => {
                this.notifyResize();
                this.hideLoadMask();
                this.unlockControls();
                this.countItemsToDeleteAndUpdateButtonCounter();
                this.updateTabbable();
                this.actionButton.giveFocus();

                const hasInboundDeps = this.resolveDependenciesResult.hasInboundDependencies();
                if (hasInboundDeps) {
                    this.lockMenu();

                }
            });
        }).catch((reason: unknown) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    private resolveItemsWithInboundRefs(forceUpdate?: boolean): void {
        this.getDependantList().setResolveDependenciesResult(this.resolveDependenciesResult);

        const itemsWithInboundRefs: ContentId[] =
            this.dependantIds.filter((id: ContentId) => this.hasInboundRef(id.toString()));
        this.dependantIds = this.dependantIds.filter((contentId: ContentId) => !this.hasInboundRef(contentId.toString()));
        this.dependantIds.unshift(...itemsWithInboundRefs);

        const inboundCount = this.resolveDependenciesResult.getInboundDependencies().length;
        this.updateWarningLine(inboundCount);

        const hasInboundDeps = this.resolveDependenciesResult.hasInboundDependencies();

        if (hasInboundDeps || forceUpdate) {
            const views = [...this.getItemList().getItemViews(), ...this.getDependantList().getItemViews()];
            this.updateItemViewsWithInboundDependencies(views);
        }
    }

    private resolveReferanceIds(): void {
        this.referenceIds = this.resolveDependenciesResult.getInboundDependencies().reduce((prev, curr) => {
            return prev.concat(curr.getInboundDependencies());
        }, [] as ContentId[]);
    }

    private updateWarningLine(inboundCount: number): void {
        const dependenciesExist = inboundCount > 0;

        if (dependenciesExist) {
            this.stateBar.markChecking(true);
        }

        this.inboundErrorsEntry.updateCount(inboundCount);

        if (dependenciesExist) {
            setTimeout(() => {
                this.stateBar.markChecking(false);
            }, 1000);
        }
    }

    protected resolveDescendants(): Q.Promise<ContentId[]> {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());
        return new ResolveDeleteRequest(ids).sendAndParse().then((result: ResolveContentForDeleteResult) => {
            this.resolveDependenciesResult = result;
            this.resolveReferanceIds();
            return result.getContentIds();
        });
    }

    manageContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.setIgnoreItemsChanged(true);
        this.setListItems(contents);
        this.setIgnoreItemsChanged(false);
        this.updateSubTitle();

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

    private archive() {
        this.executeAction(ActionType.ARCHIVE);
    }

    private delete() {
        this.executeAction(ActionType.DELETE);
    }

    private executeAction(type: ActionType) {
        this.actionInProgressType = type;

        if (this.totalItemsToDelete > 1 || this.isAnySiteToBeDeleted()) {
            this.confirmAndExecute();
        } else {
            this.executeNow();
        }
    }

    private confirmAndExecute() {
        const totalItemsToProcess: number = this.totalItemsToDelete;
        const yesCallback: () => void = this.createConfirmExecutionCallback();

        this.close();

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

    private executeNow() {
        if (this.yesCallback) {
            this.yesCallback();
        }

        this.lockControls();

        const request: ResourceRequest<TaskId> = this.createExecutionRequest();

        new ContentTreeGridDeselectAllEvent().fire();

        this.progressManager.setSuppressNotifications(this.actionInProgressType === ActionType.ARCHIVE);

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

    private countItemsToDeleteAndUpdateButtonCounter() {
        this.actionButton.getAction().setLabel(i18n('dialog.archive.action'));

        this.totalItemsToDelete = this.countTotal();
        this.updateButtonCount(i18n('dialog.archive.action'), this.totalItemsToDelete);
        this.deleteNowAction.setLabel(this.totalItemsToDelete > 1 ?
                                      i18n('dialog.delete') + ' (' + this.totalItemsToDelete + ')' :
                                      i18n('dialog.delete'));
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

        return archiveContentRequest;
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
        const items: ContentSummaryAndCompareStatus[] = this.getItemList().getItems();

        super.setSubTitle(this.doAnyHaveChildren(items) ? i18n('dialog.archive.subname') : '');
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

    protected lockControls(): void {
        super.lockControls();
        this.lockMenu();
        this.stateBar.setEnabled(false);
    }

    protected unlockControls(): void {
        super.unlockControls();
        this.unlockMenu();
        this.stateBar.setEnabled(true);
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

    close() {
        super.close();

        this.stateBar.reset();
        this.resolveDependenciesResult = null;
    }
}

export class ContentDeleteDialogButtonRow
    extends DropdownButtonRow {

    makeActionMenu(mainAction: Action, menuActions: Action[], useDefault: boolean = true): MenuButton {
        super.makeActionMenu(mainAction, menuActions, useDefault);

        return <MenuButton>this.actionMenu.addClass('delete-dialog-menu');
    }

}
