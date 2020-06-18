import * as Q from 'q';
import {i18n} from 'lib-admin-ui/util/Messages';
import {DefaultErrorHandler} from 'lib-admin-ui/DefaultErrorHandler';
import {SaveSortedContentAction} from './action/SaveSortedContentAction';
import {SortContentTreeGrid} from './SortContentTreeGrid';
import {SortContentTabMenu} from './SortContentTabMenu';
import {ContentGridDragHandler} from './ContentGridDragHandler';
import {OpenSortDialogEvent} from './OpenSortDialogEvent';
import {OrderChildContentRequest} from '../resource/OrderChildContentRequest';
import {OrderChildMovements} from '../resource/order/OrderChildMovements';
import {OrderContentRequest} from '../resource/OrderContentRequest';
import {Content} from '../content/Content';
import {ContentSummaryAndCompareStatus} from '../content/ContentSummaryAndCompareStatus';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {DialogButton} from 'lib-admin-ui/ui/dialog/DialogButton';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {H6El} from 'lib-admin-ui/dom/H6El';
import {ModalDialog, ModalDialogConfig} from 'lib-admin-ui/ui/dialog/ModalDialog';

export class SortContentDialog
    extends ModalDialog {

    private sortAction: SaveSortedContentAction;

    private parentContent: ContentSummaryAndCompareStatus;

    private contentGrid: SortContentTreeGrid;

    private sortContentMenu: SortContentTabMenu;

    private curChildOrder: ChildOrder;

    private prevChildOrder: ChildOrder;

    private gridDragHandler: ContentGridDragHandler;

    private gridLoadedHandler: () => void;

    private saveButton: DialogButton;

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

            const header = new H6El();
            header.setHtml(i18n('dialog.sort.preface'));
            this.appendChildToHeader(header);

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
    }

    close() {
        this.remove();
        this.contentGrid.unLoaded(this.gridLoadedHandler);
        super.close();
        this.contentGrid.reset();
        this.gridDragHandler.clearContentMovements();
    }

    getContent(): ContentSummaryAndCompareStatus {
        return this.parentContent;
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
        this.parentContent = event.getContent();
        this.curChildOrder = this.getParentChildOrder();
        this.prevChildOrder = null;
        this.sortContentMenu.selectNavigationItemByOrder(this.curChildOrder);

        if (!this.parentContent.hasChildren()) {
            this.contentGrid.getEl().setAttribute('data-content', event.getContent().getPath().toString());
            this.contentGrid.addClass('no-content');
        } else {
            this.contentGrid.removeClass('no-content');
            this.contentGrid.getEl().removeAttribute('data-content');
        }

        this.open();
    }

    private handleSortOrderChanged() {
        const newOrder: ChildOrder = this.sortContentMenu.getSelectedNavigationItem().getSelectedChildOrder();

        if (!this.curChildOrder.equals(newOrder)) {
            this.setSortOrder(newOrder);
        }
    }

    private setSortOrder(newOrder: ChildOrder) {
        if (!newOrder.isManual()) {
            this.curChildOrder = newOrder;
            this.contentGrid.setChildOrder(this.curChildOrder);
            this.contentGrid.reload();
            this.gridDragHandler.clearContentMovements();
        } else {
            this.prevChildOrder = this.curChildOrder;
            this.curChildOrder = newOrder;
            this.contentGrid.setChildOrder(this.curChildOrder);
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
            .setContentId(this.parentContent.getContentId())
            .setChildOrder(this.curChildOrder)
            .sendAndParse();
    }

    private setManualReorder(): Q.Promise<Content> {
        const order: ChildOrder = this.hasChangedPrevChildOrder() ? this.prevChildOrder : null;
        const movements: OrderChildMovements = this.gridDragHandler.getContentMovements();

        return new OrderChildContentRequest()
            .setSilent(false)
            .setManualOrder(true)
            .setContentId(this.parentContent.getContentId())
            .setChildOrder(order)
            .setContentMovements(movements)
            .sendAndParse();
    }

    private getParentChildOrder(): ChildOrder {
        if (this.parentContent && this.parentContent.getContentSummary()) {
            return this.parentContent.getContentSummary().getChildOrder();
        }

        return null;
    }
}
