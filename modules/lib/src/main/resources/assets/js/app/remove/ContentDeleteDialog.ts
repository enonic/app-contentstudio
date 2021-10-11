import * as Q from 'q';
import {showError, showSuccess} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentDeleteDialogAction} from './ContentDeleteDialogAction';
import {ConfirmValueDialog} from './ConfirmValueDialog';
import {ContentDeletePromptEvent} from '../browse/ContentDeletePromptEvent';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {DeleteDialogItemList} from './DeleteDialogItemList';
import {DeleteContentRequest} from '../resource/DeleteContentRequest';
import {CompareStatus} from '../content/CompareStatus';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {MenuButton} from 'lib-admin-ui/ui/button/MenuButton';
import {DropdownButtonRow} from 'lib-admin-ui/ui/dialog/DropdownButtonRow';
import {TaskId} from 'lib-admin-ui/task/TaskId';
import {ResolveDeleteRequest} from '../resource/ResolveDeleteRequest';
import {ContentId} from '../content/ContentId';
import {StatusLine} from './StatusLine';
import {ContentAppBarTabId} from '../ContentAppBarTabId';
import {ContentWizardPanelParams} from '../wizard/ContentWizardPanelParams';
import {ContentEventsProcessor} from '../ContentEventsProcessor';
import {ToggleSearchPanelWithDependenciesGlobalEvent} from '../browse/ToggleSearchPanelWithDependenciesGlobalEvent';
import {StatusSelectionItem} from '../dialog/StatusSelectionItem';
import {ContentSummary} from '../content/ContentSummary';
import {ContentSummaryAndCompareStatusViewer} from '../content/ContentSummaryAndCompareStatusViewer';
import {NamesAndIconView} from 'lib-admin-ui/app/NamesAndIconView';
import {DialogDependantList} from '../dialog/DependantItemsDialog';
import {ListBox} from 'lib-admin-ui/ui/selector/list/ListBox';
import {DeleteDialogDependantList} from './DeleteDialogDependantList';
import {ResolveContentForDeleteResult} from '../resource/ResolveContentForDeleteResult';
import {ArchiveContentRequest} from '../resource/ArchiveContentRequest';
import {ResourceRequest} from 'lib-admin-ui/rest/ResourceRequest';
import {ContentTreeGridDeselectAllEvent} from '../browse/ContentTreeGridDeselectAllEvent';

enum ActionType {
    DELETE, ARCHIVE
}

export class ContentDeleteDialog
    extends DependantItemsWithProgressDialog {

    private yesCallback: (exclude?: CompareStatus[]) => void;

    private noCallback: () => void;

    private totalItemsToDelete: number;

    private archiveAction: Action;

    private deleteNowAction: ContentDeleteDialogAction;

    private confirmExecutionDialog?: ConfirmValueDialog;

    private statusLine: StatusLine;

    private resolveDependenciesResult: ResolveContentForDeleteResult;

    constructor() {
        super(<DependantItemsWithProgressDialogConfig>{
                title: i18n('dialog.archive'),
                class: 'delete-dialog',
                dialogSubName: i18n('dialog.archive.subname'),
                dependantsDescription: i18n('dialog.archive.dependants'),
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

        this.archiveAction = new Action(i18n('dialog.archive.action'));
        this.archiveAction.onExecuted(this.archive.bind(this));

        this.deleteNowAction = new ContentDeleteDialogAction();
        this.deleteNowAction.onExecuted(this.delete.bind(this, false, true));

        const menuButton = this.getButtonRow().makeActionMenu(this.archiveAction, [this.deleteNowAction]);
        this.actionButton = menuButton.getActionButton();

        this.statusLine = new StatusLine();
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.statusLine
            .setIconClass('icon-link')
            .setMainText(i18n('dialog.archive.hasInbound.part1'))
            .setSecondaryText(i18n('dialog.archive.hasInbound.part2'))
            .hide();
    }

    getButtonRow(): ContentDeleteDialogButtonRow {
        return <ContentDeleteDialogButtonRow>super.getButtonRow();
    }

    protected initListeners() {
        super.initListeners();

        this.getItemList().onItemsRemoved(this.onListItemsRemoved.bind(this));

        const itemsAddedHandler = (items: ContentSummaryAndCompareStatus[], itemList: ListBox<ContentSummaryAndCompareStatus>) => {
            if (this.resolveDependenciesResult) {
                this.updateItemViewsWithInboundDependencies(
                    items.map((item: ContentSummaryAndCompareStatus) => <StatusSelectionItem>itemList.getItemView(item)));
            }
        };

        this.getItemList().onItemsAdded((items: ContentSummaryAndCompareStatus[]) => itemsAddedHandler(items, this.getItemList()));
        this.getDependantList().onItemsAdded(
            (items: ContentSummaryAndCompareStatus[]) => itemsAddedHandler(items, this.getDependantList()));
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.addCancelButtonToBottom();
            this.prependChildToContentPanel(this.statusLine);

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

    protected createDependantList(): DialogDependantList {
        return new DeleteDialogDependantList();
    }

    protected getDependantList(): DialogDependantList {
        return <DialogDependantList>super.getDependantList();
    }

    private handleItemClick(contentSummary: ContentSummary) {
        const tabId: ContentAppBarTabId = ContentAppBarTabId.forBrowse(contentSummary.getId());

        const wizardParams: ContentWizardPanelParams = new ContentWizardPanelParams()
            .setTabId(tabId)
            .setContentTypeName(contentSummary.getType())
            .setContentId(contentSummary.getContentId());

        const win: Window = ContentEventsProcessor.openWizardTab(wizardParams);

        setTimeout(() => {
            new ToggleSearchPanelWithDependenciesGlobalEvent(contentSummary, true).fire(win);
        }, 1000);
    }

    private updateItemViewsWithInboundDependencies(itemViews: StatusSelectionItem[]) {
        itemViews
            .filter((itemView: StatusSelectionItem) => this.hasInboundRef(itemView.getBrowseItem().getId()))
            .filter((itemView: StatusSelectionItem) => !itemView.hasClass('has-inbound'))
            .forEach((itemView: StatusSelectionItem) => this.updateItemViewWithInboundDependencies(itemView));
    }

    private hasInboundRef(id: string): boolean {
        return this.resolveDependenciesResult?.hasInboundDependency(id);
    }

    private updateItemViewWithInboundDependencies(itemView: StatusSelectionItem) {
        itemView.addClass('has-inbound');
        itemView.getViewer().whenRendered(() => {
            const namesAndIconView: NamesAndIconView =
                (<ContentSummaryAndCompareStatusViewer>itemView.getViewer()).getNamesAndIconView();
            namesAndIconView.whenRendered(() => {
                namesAndIconView.getFirstChild().onClicked(() => {
                    this.handleItemClick((<ContentSummaryAndCompareStatus>itemView.getBrowseItem()).getContentSummary());
                });
            });

            namesAndIconView.setIconClass('icon-link');
            namesAndIconView.setIconToolTip(i18n('dialog.archive.hasInbound.tooltip'));
        });
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
            });

        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    private resolveItemsWithInboundRefs() {
        (<DeleteDialogDependantList>this.getDependantList()).setResolveDependenciesResult(this.resolveDependenciesResult);

        const itemsWithInboundRefs: ContentId[] =
            this.dependantIds.filter((id: ContentId) => this.hasInboundRef(id.toString()));
        this.dependantIds = this.dependantIds.filter((contentId: ContentId) => !this.hasInboundRef(contentId.toString()));
        this.dependantIds.unshift(...itemsWithInboundRefs);

        if (this.resolveDependenciesResult.hasInboundDependencies()) {
            this.statusLine.show();
            this.updateItemViewsWithInboundDependencies(
                this.getItemList().getItemViews().concat(this.getDependantList().getItemViews()));
        }
    }

    protected resolveDescendants(): Q.Promise<ContentId[]> {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());
        return new ResolveDeleteRequest(ids).sendAndParse().then((result: ResolveContentForDeleteResult) => {
            this.resolveDependenciesResult = result;
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

    private archive() {
        this.executeAction(ActionType.ARCHIVE);
    }

    private delete() {
        this.executeAction(ActionType.DELETE);
    }

    private executeAction(type: ActionType) {
        if (this.totalItemsToDelete > 1 || this.isAnySiteToBeDeleted()) {
            this.confirmAndExecute(type);
        } else {
            this.executeNow(type);
        }
    }

    private confirmAndExecute(type: ActionType) {
        const totalItemsToProcess: number = this.totalItemsToDelete;
        const yesCallback: () => void = this.createConfirmExecutionCallback(type);

        this.close();

        if (!this.confirmExecutionDialog) {
            this.confirmExecutionDialog = new ConfirmValueDialog();
        }

        this.confirmExecutionDialog
            .setHeaderText(type === ActionType.DELETE ? i18n('dialog.confirmDelete') : i18n('dialog.confirmArchive'))
            .setSubheaderText(type === ActionType.DELETE ? i18n('dialog.confirmDelete.subname') : i18n('dialog.confirmArchive.subname'))
            .setValueToCheck('' + totalItemsToProcess)
            .setYesCallback(yesCallback)
            .open();
    }

    private createConfirmExecutionCallback(type: ActionType): () => void {
        const content = this.getItemList().getItems().slice(0);
        const descendants = this.getDependantList().getItems().slice(0);

        return () => {
            // Manually manage content and dependants without any requests
            this.manageContentToDelete(content);
            this.setDependantItems(descendants);
            this.countItemsToDeleteAndUpdateButtonCounter();
            this.open();
            this.executeNow(type);
        };
    }

    private executeNow(type: ActionType) {
        if (this.yesCallback) {
            this.yesCallback();
        }

        this.lockControls();

        const request: ResourceRequest<TaskId> = this.createExecutionRequest(type);

        new ContentTreeGridDeselectAllEvent().fire();

        this.progressManager.setSuppressNotifications(type === ActionType.ARCHIVE);

        request.sendAndParse()
            .then((taskId: TaskId) => {
                this.pollTask(taskId);
            })
            .then(() => {
                if (type === ActionType.ARCHIVE) {
                    const msg: string = this.totalItemsToDelete > 1 ? i18n('dialog.archive.success.multiple', this.totalItemsToDelete) :
                                        i18n('dialog.archive.success.single', this.getItemList().getItems()[0].getDisplayName());
                    showSuccess(msg);
                }
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
        this.deleteNowAction.setLabel(i18n('dialog.deleteNow'));

        this.totalItemsToDelete = this.countTotal();
        this.updateButtonCount(i18n('dialog.archive.action'), this.totalItemsToDelete);
        this.deleteNowAction.setLabel(this.totalItemsToDelete > 1 ?
                                      i18n('dialog.deleteNow') + ' (' + this.totalItemsToDelete + ')' :
                                      i18n('dialog.deleteNow'));
    }

    private createExecutionRequest(type: ActionType): ResourceRequest<TaskId> {
        return type === ActionType.DELETE ? this.createDeleteRequest() : this.createArchiveRequest();
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

    close() {
        super.close();

        this.statusLine.hide();
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
