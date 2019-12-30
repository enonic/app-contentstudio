import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {ValueChangedEvent} from 'lib-admin-ui/ValueChangedEvent';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {KeyHelper} from 'lib-admin-ui/ui/KeyHelper';
import {Access, ACCESS_OPTIONS, AccessOption} from './Access';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {NavigatorEvent} from 'lib-admin-ui/ui/NavigatorEvent';

export class AccessSelector
    extends TabMenu {

    private value: Access;
    private valueChangedListeners: { (event: ValueChangedEvent): void }[] = [];

    constructor() {
        super('access-selector');

        ACCESS_OPTIONS.forEach((option: AccessOption) => {
            let menuItem = (<TabMenuItemBuilder>new TabMenuItemBuilder().setLabel(option.name).setAddLabelTitleAttribute(
                false)).build();
            this.addNavigationItem(menuItem);
        });

        this.initEventHandlers();
    }

    initEventHandlers() {
        this.onNavigationItemSelected((event: NavigatorEvent) => {
            let item: TabMenuItem = <TabMenuItem> event.getItem();
            this.setValue(ACCESS_OPTIONS[item.getIndex()].value);
        });

        this.getTabMenuButtonEl().onKeyDown((event: KeyboardEvent) => {
            if (!this.isEnabled()) {
                return;
            }

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
    }

    getValue(): Access {
        return this.value;
    }

    setValue(value: Access, silent?: boolean): AccessSelector {
        let option = ACCESS_OPTIONS.filter((accessOption: AccessOption) => accessOption.value === value)[0];
        if (option) {
            this.selectNavigationItem(ACCESS_OPTIONS.indexOf(option));
            if (!silent) {
                this.notifyValueChanged(new ValueChangedEvent(Access[this.value], Access[value]));
            }
            this.value = value;
        }
        return this;
    }

    protected setButtonLabel(value: string): AccessSelector {
        this.getTabMenuButtonEl().setLabel(value, false);
        return this;
    }

    showMenu() {

        if (this.getSelectedNavigationItem().isVisibleInMenu()) {
            this.resetItemsVisibility();
            this.getSelectedNavigationItem().setVisibleInMenu(false);
        }

        const menu = this.getMenuEl();
        const entry = menu.getParentElement().getParentElement();
        const list = entry.getParentElement();

        const entryTop = entry.getEl().getBoundingClientRect().top;
        const listBottom = list.getEl().getBoundingClientRect().bottom;
        const height = menu.getEl().getHeight();

        if (entryTop + height > listBottom) {
            menu.addClass('upward');
        } else {
            menu.removeClass('upward');
        }

        super.showMenu();

        this.focus();
    }

    onValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: ValueChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(event: ValueChangedEvent) {
        this.valueChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

    giveFocusToMenu(): boolean {
        const focused = super.giveFocusToMenu();
        return focused || (this.getSize() > 1 && this.focusNextTab());
    }

    isKeyNext(event: KeyboardEvent) {
        return KeyHelper.isArrowDownKey(event);
    }

    isKeyPrevious(event: KeyboardEvent) {
        return KeyHelper.isArrowUpKey(event);
    }

    returnFocusFromMenu(): boolean {
        return this.focus();
    }

    focus(): boolean {
        return this.getTabMenuButtonEl().focus();
    }
}
