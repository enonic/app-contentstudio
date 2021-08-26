import * as Q from 'q';
import {showError} from 'lib-admin-ui/notify/MessageBus';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {Action} from 'lib-admin-ui/ui/Action';
import {ContentDeleteDialogAction} from './ContentDeleteDialogAction';
import {ConfirmValueDialog} from './ConfirmValueDialog';
import {ContentDeletePromptEvent} from '../browse/ContentDeletePromptEvent';
import {DependantItemsWithProgressDialog, DependantItemsWithProgressDialogConfig} from '../dialog/DependantItemsWithProgressDialog';
import {DeleteDialogItemList} from './DeleteDialogItemList';
import {ResolveDependenciesRequest} from '../resource/ResolveDependenciesRequest';
import {ResolveDependenciesResult} from '../resource/ResolveDependenciesResult';
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

export class ContentDeleteDialog
    extends DependantItemsWithProgressDialog {

    private yesCallback: (exclude?: CompareStatus[]) => void;

    private noCallback: () => void;

    private totalItemsToDelete: number;

    private markDeletedAction: Action;

    private deleteConfirmationDialog?: ConfirmValueDialog;

    private statusLine: StatusLine;

    private resolveDependenciesResult: ResolveDependenciesResult;

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

        this.statusLine = new StatusLine();
    }

    protected postInitElements(): void {
        super.postInitElements();

        this.statusLine
            .setIconClass('icon-link')
            .setMainText(i18n('dialog.delete.hasInbound.part1'))
            .setSecondaryText(i18n('dialog.delete.hasInbound.part2'))
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
        return this.resolveDependenciesResult?.hasIncomingDependency(id);
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
            namesAndIconView.setIconToolTip(i18n('dialog.delete.hasInbound.tooltip'));
        });
    }

    private manageDescendants() {
        this.showLoadMask();
        this.lockControls();

        this.loadDescendantIds().then(() => {
            return this.resolveItemsWithInboundRefs().then(() => {
                return this.loadDescendants(0, 20).then((descendants: ContentSummaryAndCompareStatus[]) => {
                    this.setDependantItems(descendants);
                    this.manageInstantDeleteStatus(this.getItemList().getItems());
                    return Q(null);
                }).finally(() => {
                    this.notifyResize();
                    this.hideLoadMask();
                    this.unlockControls();
                    this.countItemsToDeleteAndUpdateButtonCounter();
                    this.updateTabbable();
                    this.actionButton.giveFocus();
                });
            });
        }).catch((reason: any) => {
            DefaultErrorHandler.handle(reason);
        });
    }

    private resolveItemsWithInboundRefs(): Q.Promise<void> {
        return new ResolveDependenciesRequest(this.resolvedIds).sendAndParse().then((result: ResolveDependenciesResult) => {
            this.resolveDependenciesResult = result;
            (<DeleteDialogDependantList>this.getDependantList()).setResolveDependenciesResult(result);

            const itemsWithInboundRefs: ContentId[] =
                this.dependantIds.filter((id: ContentId) => this.hasInboundRef(id.toString()));
            this.dependantIds = this.dependantIds.filter((contentId: ContentId) => !this.hasInboundRef(contentId.toString()));
            this.dependantIds.unshift(...itemsWithInboundRefs);

            if (result.getIncomingDependenciesCount().size !== 0) {
                this.statusLine.show();
                this.updateItemViewsWithInboundDependencies(
                    this.getItemList().getItemViews().concat(this.getDependantList().getItemViews()));
            }

            return Q(null);
        });
    }

    protected resolveDescendants(): Q.Promise<ContentId[]> {
        const ids: ContentId[] = this.getItemList().getItems().map(content => content.getContentId());
        return new ResolveDeleteRequest(ids).sendAndParse().then(result => result.getContentIds());
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

    setContentToDelete(contents: ContentSummaryAndCompareStatus[]): ContentDeleteDialog {
        this.manageContentToDelete(contents);
        this.manageInstantDeleteStatus(contents);
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
