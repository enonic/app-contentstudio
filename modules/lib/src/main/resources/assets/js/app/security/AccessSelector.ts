import {AppHelper} from '@enonic/lib-admin-ui/util/AppHelper';
import {type TabMenuItem, TabMenuItemBuilder} from '@enonic/lib-admin-ui/ui/tab/TabMenuItem';
import {KeyHelper} from '@enonic/lib-admin-ui/ui/KeyHelper';
import {type AccessOption} from './Access';
import {TabMenu} from '@enonic/lib-admin-ui/ui/tab/TabMenu';
import {type NavigatorEvent} from '@enonic/lib-admin-ui/ui/NavigatorEvent';
import {AccessChangedEvent} from './AccessChangedEvent';

export class AccessSelector
    extends TabMenu {

    private value: string;
    private options: AccessOption[];
    private valueChangedListeners: ((event: AccessChangedEvent) => void)[] = [];

    constructor(options: AccessOption[], cls?: string) {
        super(`access-selector ${cls || ''}`.trim());

        this.options = options;

        this.options.forEach((option: AccessOption) => {
            const menuItem = (new TabMenuItemBuilder()
                .setLabel(option.displayName)
                .setAddLabelTitleAttribute(false))
                .build();

            this.addNavigationItem(menuItem);
        });

        this.initEventHandlers();
    }

    initEventHandlers() {
        this.onNavigationItemSelected((event: NavigatorEvent) => {
            const item: TabMenuItem = event.getItem() as TabMenuItem;
            this.setValue(this.options[item.getIndex()].id);
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

    getValue(): string {
        return this.value;
    }

    setValue(value: string, silent?: boolean): AccessSelector {
        this.selectNavigationItem(this.options.findIndex((option) => option.id === value));

        if (!silent) {
            this.notifyValueChanged(new AccessChangedEvent(this.value, value));
        }

        this.value = value;

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
