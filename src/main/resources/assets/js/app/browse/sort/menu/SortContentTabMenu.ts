import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {SortContentTabMenuItem} from './SortContentTabMenuItem';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {DropdownHandle} from 'lib-admin-ui/ui/button/DropdownHandle';
import {KeyHelper} from 'lib-admin-ui/ui/KeyHelper';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {InheritedSortContentTabMenuItem} from './InheritedSortContentTabMenuItem';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AscDescSortContentTabMenuItem} from './AscDescSortContentTabMenuItem';
import {ManualSortContentTabMenuItem} from './ManualSortContentTabMenuItem';

export class SortContentTabMenu
    extends TabMenu {

    private sortOrderChangedListeners: {():void}[] = [];

    private dropdownHandle: DropdownHandle;

    private inheritedItem: InheritedSortContentTabMenuItem;

    private sortManualItem: SortContentTabMenuItem;

    private iconClass: string;

    constructor() {
        super('sort-tab-menu');

        this.iconClass = '';

        this.addNavigationItems(this.createNavigationItems());

        this.dropdownHandle = new DropdownHandle();
        this.appendChild(this.dropdownHandle);
        this.dropdownHandle.up();

        this.initEventHandlers();

        this.selectNavigationItem(0);
    }

    private createNavigationItems(): SortContentTabMenuItem[] {
        const items: SortContentTabMenuItem[] = [];

        this.sortManualItem = new ManualSortContentTabMenuItem();
        this.inheritedItem = new InheritedSortContentTabMenuItem();

        items.push(
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.MODIFIED_TIME).setLabel(i18n('field.sortType.modified')).build(),
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.CREATED_TIME).setLabel(i18n('field.sortType.created')).build(),
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.DISPLAY_NAME).setLabel(
                i18n('field.sortType.displayName')).build(),
            AscDescSortContentTabMenuItem.create().setFieldName(QueryField.PUBLISH_FIRST).setLabel(i18n('field.sortType.publish')).build(),
            this.sortManualItem
        );

        return items;
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
            const selectedItem: SortContentTabMenuItem = this.getSelectedNavigationItem();

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
            item.giveFocusToPrevElem();
        } else if (KeyHelper.isArrowRightKey(event)) {
            item.giveFocusToNextElem();
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

    getNavigationItems(): SortContentTabMenuItem[] {
        return <SortContentTabMenuItem[]>super.getNavigationItems();
    }

    addNavigationItems(items: SortContentTabMenuItem[]) {
        if (items) {
            items.forEach((item: SortContentTabMenuItem) => {
                this.addNavigationItem(item);
            });
        }
    }

    selectNavigationItemByOrder(order: ChildOrder) {
        if (order.isManual()) {
            this.selectNavigationItem(this.sortManualItem.getIndex());
            return;
        }

        this.getNavigationItems().some((item: SortContentTabMenuItem, index) => {
            if (item.hasChildOrder(order)) {
                this.selectNavigationItem(index);
                return true;
            }
            return false;
        });
    }

    getItemByOrder(order: ChildOrder): SortContentTabMenuItem {
        if (order.isManual()) {
            return this.sortManualItem;
        }

        return this.getNavigationItems().find((item: SortContentTabMenuItem) => {
            return item.hasChildOrder(order);
        });
    }

    selectManualSortingItem() {
        this.selectNavigationItem(this.sortManualItem.getIndex());
    }

    selectInheritedSortingItem() {
        this.selectNavigationItem(this.inheritedItem.getIndex());
    }

    addInheritedItem(order: ChildOrder, label: string, iconClass: string) {
        this.inheritedItem.setOrder(order, label, iconClass);

        if (!this.getNavigationItems().some((item: SortContentTabMenuItem) => item === this.inheritedItem)) {
            this.addNavigationItem(this.inheritedItem);
        }
    }

    removeInheritedItem() {
        if (this.getNavigationItems().some((item: SortContentTabMenuItem) => item === this.inheritedItem)) {
            this.removeNavigationItem(this.inheritedItem);
        }
    }

    isInheritedItemSelected(): boolean {
        return this.inheritedItem === this.getSelectedNavigationItem();
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

    getDropdownHandle(): DropdownHandle {
        return this.dropdownHandle;
    }

}
