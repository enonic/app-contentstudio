import '../../api.ts';
import {SortContentTabMenuItem} from './SortContentTabMenuItem';
import {SortContentTabMenuItems} from './SortContentTabMenuItems';
import ChildOrder = api.content.order.ChildOrder;
import DropdownHandle = api.ui.button.DropdownHandle;
import KeyHelper = api.ui.KeyHelper;
import AppHelper = api.util.AppHelper;

export class SortContentTabMenu extends api.ui.tab.TabMenu {

    private sortOrderChangedListeners: {():void}[] = [];

    private navigationItems: SortContentTabMenuItems;

    private dropdownHandle: DropdownHandle;

    private iconClass: string;

    constructor() {
        super('sort-tab-menu');

        this.iconClass = '';

        this.navigationItems = new SortContentTabMenuItems();
        this.addNavigationItems(this.navigationItems.getAllItems());

        this.dropdownHandle = new DropdownHandle();
        this.appendChild(this.dropdownHandle);
        this.dropdownHandle.up();

        this.initEventHandlers();

        this.selectNavigationItem(0);
    }

    initEventHandlers() {
        this.dropdownHandle.onClicked(() => {
            if (this.isMenuVisible()) {
                this.hideMenu();
            } else {
                this.showMenu();
            }
        });

        this.dropdownHandle.onKeyDown((event: KeyboardEvent) => {

            if (KeyHelper.isArrowDownKey(event)) {
                if (this.isMenuVisible()) {
                    this.giveFocusToMenu();
                } else {
                    this.showMenu();
                }
                AppHelper.lockEvent(event);
            } else if (KeyHelper.isArrowUpKey(event)) {
                this.hideMenu();
                AppHelper.lockEvent(event);
            } else if (KeyHelper.isApplyKey(event)) {
                if (this.isMenuVisible()) {
                    this.hideMenu();
                } else {
                    this.showMenu();
                }
                AppHelper.lockEvent(event);
            } else if (KeyHelper.isEscKey(event)) {
                if (this.isMenuVisible()) {
                    this.hideMenu();
                    AppHelper.lockEvent(event);
                }
            }
        });

        this.onSortOrderChanged(() => {
            const selectedItem = this.getSelectedNavigationItem();

            if (this.iconClass) {
                this.getTabMenuButtonEl().getLabel().removeClass(this.iconClass);
            }
            this.iconClass = selectedItem.getSelectedIconClass();
            if (this.iconClass) {
                this.getTabMenuButtonEl().getLabel().addClass(this.iconClass);
            }

            this.getTabMenuButtonEl().setLabelTitle(selectedItem.getTooltip());
        });
    }

    handleMenuKeyDown(event: KeyboardEvent) {
        const item = <SortContentTabMenuItem>this.getFocusedTab();
        if (KeyHelper.isArrowLeftKey(event)) {
            item.giveFocusToAscending();
        } else if (KeyHelper.isArrowRightKey(event)) {
            item.giveFocusToDescending();
        } else {
            super.handleMenuKeyDown(event);
        }
        AppHelper.lockEvent(event);
    }

    returnFocusFromMenu(): boolean {
        return this.focus();
    }

    isKeyNext(event: KeyboardEvent) {
        return KeyHelper.isArrowDownKey(event);
    }

    isKeyPrevious(event: KeyboardEvent) {
        return KeyHelper.isArrowUpKey(event);
    }

    protected hideMenu() {
        super.hideMenu();
        this.dropdownHandle.up();

    }

    protected showMenu() {
        super.showMenu();
        this.dropdownHandle.down();
        this.focus();
    }

    selectNavigationItem(tabIndex: number) {
        super.selectNavigationItem(tabIndex);
        this.notifySortOrderChanged();
    }

    getSelectedNavigationItem(): SortContentTabMenuItem {
        return (<SortContentTabMenuItem>super.getSelectedNavigationItem());
    }

    getSortMenuNavigationItems(): SortContentTabMenuItems {
        return this.navigationItems;
    }

    addNavigationItems(items: SortContentTabMenuItem[]) {
        if (items) {
            items.forEach((item: SortContentTabMenuItem) => {
                this.addNavigationItem(item);
            });
        }
    }

    replaceNavigationItems(items: SortContentTabMenuItem[]) {
        this.removeNavigationItems();
        this.addNavigationItems(items);
    }

    selectNavigationItemByOrder(order: ChildOrder) {

        if (order.isManual()) {
            this.selectNavigationItem(this.navigationItems.getManualItemIndex());

            return;
        }

        const items = this.navigationItems.getAllItems();

        items.some((item, index) => {
            if (item.hasChildOrder(order)) {
                this.selectNavigationItem(index);
                return true;
            }
            return false;
        });
    }

    selectManualSortingItem() {
        this.selectNavigationItemByOrder(this.navigationItems.SORT_MANUAL_ITEM.getSelectedChildOrder());
    }

    onSortOrderChanged(listener: () => void) {
        this.sortOrderChangedListeners.push(listener);
    }

    unSortOrderChanged(listener: () => void) {
        this.sortOrderChangedListeners = this.sortOrderChangedListeners.filter((currentListener: () => void) => {
            return listener !== currentListener;
        });
    }

    private notifySortOrderChanged() {
        this.sortOrderChangedListeners.forEach((listener: () => void) => {
            listener.call(this);
        });
    }

    focus(): boolean {
        return this.dropdownHandle.giveFocus();
    }

}
