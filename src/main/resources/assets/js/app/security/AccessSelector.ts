import {AppHelper} from 'lib-admin-ui/util/AppHelper';
import {TabMenuItem, TabMenuItemBuilder} from 'lib-admin-ui/ui/tab/TabMenuItem';
import {KeyHelper} from 'lib-admin-ui/ui/KeyHelper';
import {Access, ACCESS_OPTIONS} from './Access';
import {TabMenu} from 'lib-admin-ui/ui/tab/TabMenu';
import {NavigatorEvent} from 'lib-admin-ui/ui/NavigatorEvent';
import {i18n} from 'lib-admin-ui/util/Messages';
import {AccessChangedEvent} from './AccessChangedEvent';

export class AccessSelector
    extends TabMenu {

    private value: Access;
    private valueChangedListeners: { (event: AccessChangedEvent): void }[] = [];

    constructor() {
        super('access-selector');

        ACCESS_OPTIONS.forEach((option: Access) => {
            let menuItem = (<TabMenuItemBuilder>new TabMenuItemBuilder()
                .setLabel(i18n(`security.access.${option}`))
                .setAddLabelTitleAttribute(false))
                .build();
            this.addNavigationItem(menuItem);
        });

        this.initEventHandlers();
    }

    initEventHandlers() {
        this.onNavigationItemSelected((event: NavigatorEvent) => {
            let item: TabMenuItem = <TabMenuItem> event.getItem();
            this.setValue(ACCESS_OPTIONS[item.getIndex()]);
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
        const option: Access = ACCESS_OPTIONS.filter((accessOption: Access) => accessOption === value)[0];
        if (option) {
            this.selectNavigationItem(ACCESS_OPTIONS.indexOf(option));
            if (!silent) {
                this.notifyValueChanged(new AccessChangedEvent(this.value, value));
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

    onValueChanged(listener: (event: AccessChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: AccessChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(event: AccessChangedEvent) {
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
