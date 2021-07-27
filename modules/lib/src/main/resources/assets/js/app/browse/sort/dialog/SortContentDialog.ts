import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {SaveSortedContentAction} from '../../action/SaveSortedContentAction';
import {SortContentTreeGrid} from '../SortContentTreeGrid';
import {SortContentTabMenu} from '../menu/SortContentTabMenu';
import {ContentGridDragHandler} from '../../ContentGridDragHandler';
import {OpenSortDialogEvent} from '../../OpenSortDialogEvent';
import {OrderChildContentRequest} from '../../../resource/OrderChildContentRequest';
import {OrderChildMovements} from '../../../resource/order/OrderChildMovements';
import {OrderContentRequest} from '../../../resource/OrderContentRequest';
import {Content} from '../../../content/Content';
import {ContentSummaryAndCompareStatus} from '../../../content/ContentSummaryAndCompareStatus';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {DialogButton} from 'lib-admin-ui/ui/dialog/DialogButton';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {SortContentTabMenuItem} from '../menu/SortContentTabMenuItem';
import {ProjectContext} from '../../../project/ProjectContext';
import {ContentsExistRequest} from '../../../resource/ContentsExistRequest';
import {ContentsExistResult} from '../../../resource/ContentsExistResult';
import {ContentSummaryAndCompareStatusFetcher} from '../../../resource/ContentSummaryAndCompareStatusFetcher';
import {RestoreInheritRequest} from '../../../resource/RestoreInheritRequest';
import {ContentInheritType} from '../../../content/ContentInheritType';
import {ChildOrder} from '../../../resource/order/ChildOrder';

export class SortContentDialog
    extends ModalDialog {

    private sortAction: SaveSortedContentAction;

    private selectedContent: ContentSummaryAndCompareStatus;

    private contentGrid: SortContentTreeGrid;

    private sortContentMenu: SortContentTabMenu;

    private gridDragHandler: ContentGridDragHandler;

    private gridLoadedHandler: () => void;

    private saveButton: DialogButton;

    private subHeader: H6El;

    constructor() {
        super(<ModalDialogConfig>{
            title: i18n('dialog.sort'),
            class: 'sort-content-dialog'
        });
    }

    protected initElements() {
        super.initElements();

        this.initTabMenu();
        this.sortContentMenu = new SortContentTabMenu();
        this.contentGrid = new SortContentTreeGrid();
        this.gridDragHandler = new ContentGridDragHandler(this.contentGrid);
        this.sortAction = new SaveSortedContentAction(this);
        this.saveButton = this.addAction(this.sortAction);
        this.subHeader = new H6El();
    }

    protected postInitElements() {
        super.postInitElements();

        this.setElementToFocusOnShow(this.sortContentMenu.getDropdownHandle());
    }

    protected initListeners() {
        super.initListeners();

        this.sortContentMenu.onSortOrderChanged(() => {
            this.handleSortOrderChanged();
        });

        this.gridDragHandler.onPositionChanged(() => {
            this.sortContentMenu.selectManualSortingItem();
        });

        this.sortAction.onExecuted(() => {
            this.handleSortApplied();
        });

        this.gridLoadedHandler = () => {
            this.notifyResize();
            this.contentGrid.getGrid().resizeCanvas();
        };

        OpenSortDialogEvent.on((event) => {
            this.handleOpenSortDialogEvent(event);
        });
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.saveButton.addClass('save-button');
            this.sortContentMenu.show();

            this.appendChildToHeader(this.sortContentMenu);
            this.appendChildToHeader(this.subHeader);

            this.contentGrid.getEl().addClass('sort-content-grid');
            this.appendChildToContentPanel(this.contentGrid);
            this.addCancelButtonToBottom();

            return rendered;
        });
    }

    show() {
        super.show();
        this.contentGrid.onLoaded(this.gridLoadedHandler);
        this.contentGrid.reload();
        this.sortContentMenu.focus();
        this.saveButton.setEnabled(false);
    }

    close() {
        this.remove();
        this.contentGrid.unLoaded(this.gridLoadedHandler);
        super.close();
        this.contentGrid.reset();
        this.gridDragHandler.clearContentMovements();
        this.sortContentMenu.deselectNavigationItem();
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.selectedContent;
    }

    private initTabMenu() {
        const menu: TabMenu = new TabMenu();
        const tabMenuItem: TabMenuItem = (new TabMenuItemBuilder().setLabel(i18n('field.sortType'))).build();
        tabMenuItem.setActive(true);
        menu.addNavigationItem(tabMenuItem);
        menu.selectNavigationItem(0);
        menu.show();
    }

    private handleSortApplied() {
        this.saveSortOrder().catch(DefaultErrorHandler.handle).done(this.onAfterSetOrder.bind(this));
    }

    private saveSortOrder(): Q.Promise<any> {
        this.showLoadingSpinner();

        if (this.getSelectedOrder().isManual()) {
            return this.saveManualOrder();
        } else if (this.sortContentMenu.isInheritedItemSelected()) {
            return this.saveInheritedOrder();
        } else {
            return this.saveContentChildOrder();
        }
    }

    private handleOpenSortDialogEvent(event: OpenSortDialogEvent) {
        this.selectedContent = event.getContent();
        this.contentGrid.setContentId(this.selectedContent.getContentId());
        this.toggleInheritedSortingOption();
        this.updateSubHeaderText();
        this.toggleGridVisibility();
        this.open();
    }

    private toggleInheritedSortingOption() {
        if (this.selectedContent.isSortInherited()) {
            this.handleSortInherited();
        } else {
            this.sortContentMenu.selectNavigationItemByOrder(this.getParentChildOrder());
            this.addInheritedOptionIfParentExists();
        }
    }

    private addInheritedOptionIfParentExists() {
        const parentProject: string = ProjectContext.get().getProject().getParent();

        if (parentProject) {
            this.fetchParentLayerContent().then((parentLayerContent: ContentSummaryAndCompareStatus) => {
                if (!parentLayerContent) {
                    this.sortContentMenu.removeInheritedItem();
                } else {
                   this.addInheritedItemByOrder(parentLayerContent.getContentSummary().getChildOrder());
                }
            }).catch(DefaultErrorHandler.handle);
        } else {
            this.sortContentMenu.removeInheritedItem();
        }
    }

    private fetchParentLayerContent(): Q.Promise<any> {
        const parentProject: string = ProjectContext.get().getProject().getParent();

       return new ContentsExistRequest([this.selectedContent.getId()])
            .setRequestProjectName(parentProject)
            .sendAndParse()
            .then((result: ContentsExistResult) => {
                if (!!result.getContentsExistMap()[this.selectedContent.getId()]) {
                    return ContentSummaryAndCompareStatusFetcher.fetch(this.selectedContent.getContentId(), parentProject);
                } else {
                    return Q(null);
                }
            });
    }

    private handleSortInherited() {
        this.addInheritedItemByOrder(this.selectedContent.getContentSummary().getChildOrder());
        this.sortContentMenu.selectInheritedSortingItem();
    }

    private addInheritedItemByOrder(order: ChildOrder) {
        const item: SortContentTabMenuItem = this.sortContentMenu.getItemByOrder(order);
        this.sortContentMenu.addInheritedItem(order, item.getLabel(), item.getSelectedIconClass());
    }

    private toggleGridVisibility() {
        if (!this.selectedContent.hasChildren()) {
            this.contentGrid.getEl().setAttribute('data-content', this.selectedContent.getPath().toString());
            this.contentGrid.addClass('no-content');
        } else {
            this.contentGrid.removeClass('no-content');
            this.contentGrid.getEl().removeAttribute('data-content');
        }
    }

    private handleSortOrderChanged() {
        const newOrder: ChildOrder = this.getSelectedOrder();

        this.saveButton.setEnabled(this.isOrderChanged());
        this.saveButton.giveFocus();
        this.contentGrid.setChildOrder(newOrder);
        this.contentGrid.toggleClass('inherited', this.sortContentMenu.isInheritedItemSelected());
        this.updateSubHeaderText();

        if (!newOrder.isManual()) {
            this.contentGrid.reload();
            this.gridDragHandler.clearContentMovements();
        }
    }

    private isOrderChanged(): boolean {
        return !this.getParentChildOrder().equals(this.getSelectedOrder()) ||
               this.selectedContent.isSortInherited() !== this.sortContentMenu.isInheritedItemSelected() ||
               this.sortContentMenu.isManualItemSelected() && this.gridDragHandler.getContentMovements().getReorderChildren().length > 0;
    }

    private onAfterSetOrder() {
        this.hideLoadingSpinner();
        this.close();
    }

    private showLoadingSpinner() {
        this.saveButton.addClass('spinner');
    }

    private hideLoadingSpinner() {
        this.saveButton.removeClass('spinner');
    }

    private saveContentChildOrder(): Q.Promise<Content> {
        return new OrderContentRequest()
            .setSilent(false)
            .setContentId(this.selectedContent.getContentId())
            .setChildOrder(this.getSelectedOrder())
            .sendAndParse();
    }

    private saveManualOrder(): Q.Promise<Content> {
        const movements: OrderChildMovements = this.gridDragHandler.getContentMovements();

        return new OrderChildContentRequest()
            .setSilent(false)
            .setManualOrder(true)
            .setContentId(this.selectedContent.getContentId())
            .setChildOrder(this.getSelectedOrder())
            .setContentMovements(movements)
            .sendAndParse();
    }

    private saveInheritedOrder(): Q.Promise<any> {
        return new RestoreInheritRequest()
            .setContentId(this.selectedContent.getContentId())
            .setInherit([ContentInheritType.SORT])
            .sendAndParse();
    }

    private getSelectedOrder(): ChildOrder {
        return this.sortContentMenu.getSelectedNavigationItem().getOrder();
    }

    private getParentChildOrder(): ChildOrder {
        if (this.selectedContent && this.selectedContent.getContentSummary()) {
            return this.selectedContent.getContentSummary().getChildOrder();
        }

        return null;
    }

    private updateSubHeaderText() {
        if (this.sortContentMenu.isInheritedItemSelected()) {
            this.subHeader.setHtml(i18n('dialog.sort.preface.inherited'));
        } else {
            this.subHeader.setHtml(i18n('dialog.sort.preface'));
        }
    }
}
