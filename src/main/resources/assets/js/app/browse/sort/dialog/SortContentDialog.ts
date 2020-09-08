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
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {DialogButton} from 'lib-admin-ui/ui/dialog/DialogButton';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';
import {SortContentTabMenuItem} from '../menu/SortContentTabMenuItem';

export class SortContentDialog
    extends ModalDialog {

    private sortAction: SaveSortedContentAction;

    private selectedContent: ContentSummaryAndCompareStatus;

    private contentGrid: SortContentTreeGrid;

    private sortContentMenu: SortContentTabMenu;

    private curChildOrder: ChildOrder;

    private prevChildOrder: ChildOrder;

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
            this.saveButton.giveFocus();
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
        this.contentGrid.reload(this.selectedContent);
        this.sortContentMenu.focus();
    }

    close() {
        this.remove();
        this.contentGrid.unLoaded(this.gridLoadedHandler);
        super.close();
        this.contentGrid.reset();
        this.contentGrid.removeClass('inherited');
        this.gridDragHandler.clearContentMovements();
        this.sortContentMenu.deselectNavigationItem();
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.selectedContent;
    }

    private initTabMenu() {
        const menu: TabMenu = new TabMenu();
        const tabMenuItem: TabMenuItem = (<TabMenuItemBuilder>new TabMenuItemBuilder().setLabel(i18n('field.sortType'))).build();
        tabMenuItem.setActive(true);
        menu.addNavigationItem(tabMenuItem);
        menu.selectNavigationItem(0);
        menu.show();
    }

    private handleSortApplied() {
        if (this.curChildOrder.equals(this.getParentChildOrder()) && !this.curChildOrder.isManual()) {
            this.close();
        } else {
            this.saveSortOrder().catch(DefaultErrorHandler.handle).done(this.onAfterSetOrder.bind(this));
        }
    }

    private saveSortOrder(): Q.Promise<Content> {
        this.showLoadingSpinner();

        if (this.curChildOrder.isManual()) {
            return this.setManualReorder();
        } else {
            return this.setContentChildOrder();
        }
    }

    private handleOpenSortDialogEvent(event: OpenSortDialogEvent) {
        this.selectedContent = event.getContent();
        this.prevChildOrder = null;

        this.toggleInheritedSortingOption();
        this.toggleGridVisibility();

        this.open();
    }

    private toggleInheritedSortingOption() {
        this.curChildOrder = this.getParentChildOrder();

        if (this.selectedContent.isSortInherited()) {
            this.handleSortInherited();
        } else {
            this.sortContentMenu.removeInheritedItem();
            this.subHeader.setHtml(i18n('dialog.sort.preface'));
            this.sortContentMenu.selectNavigationItemByOrder(this.curChildOrder);
        }
    }

    private handleSortInherited() {
        const order: ChildOrder = this.selectedContent.getContentSummary().getChildOrder();
        const item: SortContentTabMenuItem = this.sortContentMenu.getItemByOrder(order);
        this.sortContentMenu.addInheritedItem();
        this.contentGrid.addClass('inherited');
        this.sortContentMenu.selectInheritedSortingItem(order, item.getLabel(), item.getSelectedIconClass());
        this.subHeader.setHtml(i18n('dialog.sort.preface.inherited'));
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
        const newOrder: ChildOrder = this.sortContentMenu.getSelectedNavigationItem().getOrder();

        if (!this.curChildOrder.equals(newOrder)) {
            this.setSortOrder(newOrder);
        }
    }

    private setSortOrder(newOrder: ChildOrder) {
        if (!newOrder.isManual()) {
            this.curChildOrder = newOrder;
            this.contentGrid.setChildOrder(this.curChildOrder);
            this.contentGrid.reload(this.selectedContent);
            this.gridDragHandler.clearContentMovements();
            if (this.selectedContent.isSortInherited()) {
                this.contentGrid.addClass('inherited');
            }
        } else {
            this.prevChildOrder = this.curChildOrder;
            this.curChildOrder = newOrder;
            this.contentGrid.setChildOrder(this.curChildOrder);
            this.contentGrid.removeClass('inherited');
        }
    }

    private onAfterSetOrder() {
        this.hideLoadingSpinner();
        this.close();
    }

    private hasChangedPrevChildOrder(): boolean {
        return this.prevChildOrder && !this.prevChildOrder.equals(this.getParentChildOrder());
    }

    private showLoadingSpinner() {
        this.saveButton.addClass('spinner');
    }

    private hideLoadingSpinner() {
        this.saveButton.removeClass('spinner');
    }

    private setContentChildOrder(): Q.Promise<Content> {
        return new OrderContentRequest()
            .setSilent(false)
            .setContentId(this.selectedContent.getContentId())
            .setChildOrder(this.curChildOrder)
            .sendAndParse();
    }

    private setManualReorder(): Q.Promise<Content> {
        const order: ChildOrder = this.hasChangedPrevChildOrder() ? this.prevChildOrder : null;
        const movements: OrderChildMovements = this.gridDragHandler.getContentMovements();

        return new OrderChildContentRequest()
            .setSilent(false)
            .setManualOrder(true)
            .setContentId(this.selectedContent.getContentId())
            .setChildOrder(order)
            .setContentMovements(movements)
            .sendAndParse();
    }

    private getParentChildOrder(): ChildOrder {
        if (this.selectedContent && this.selectedContent.getContentSummary()) {
            return this.selectedContent.getContentSummary().getChildOrder();
        }

        return null;
    }
}
