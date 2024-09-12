import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import {Body} from '@enonic/lib-admin-ui/dom/Body';
import {DivEl} from '@enonic/lib-admin-ui/dom/DivEl';
import {IssueStatus, IssueStatusFormatter} from '../IssueStatus';
import {TabMenuItem} from '@enonic/lib-admin-ui/ui/tab/TabMenuItem';
import {TabMenu} from '@enonic/lib-admin-ui/ui/tab/TabMenu';
import {ValueChangedEvent} from '@enonic/lib-admin-ui/ValueChangedEvent';
import {NavigatorEvent} from '@enonic/lib-admin-ui/ui/NavigatorEvent';
import {DropdownHandle} from '@enonic/lib-admin-ui/ui/button/DropdownHandle';

export class IssueStatusSelector
    extends TabMenu {

    private value: IssueStatus;

    private valueChangedListeners: ((event: ValueChangedEvent) => void)[] = [];

    private dropdownHandle: DropdownHandle;

    constructor() {
        super('issue-status-selector');

        this.initElements();
        this.initListeners();
    }

    protected initElements() {
        this.initNavigationItems();
        this.initIcon();
        this.initDropdownHandle();
    }

    private initNavigationItems() {
        IssueStatusFormatter.getStatusNames().forEach(name => {
            const menuItem: TabMenuItem = TabMenuItem.create()
                .setLabel(i18n(`field.issue.status.${name}`))
                .setAddLabelTitleAttribute(false)
                .build();

            this.addNavigationItem(menuItem);
        });
        this.getMenuEl().whenRendered(() => {
            this.getTabMenuButtonEl().getEl().setWidthPx(this.getMenuEl().getEl().getWidth());
        });
    }

    private initIcon() {
        const icon = new DivEl('issue-icon');
        icon.onClicked(() => {
            const enabled = this.isEnabled();
            if (enabled) {
                this.toggleMenu();
            }
        });
        this.prependChild(icon);
    }

    private initDropdownHandle() {
        this.dropdownHandle = new DropdownHandle();
        this.appendChild(this.dropdownHandle);
    }

    protected hideMenu() {
        super.hideMenu();
        this.dropdownHandle.up();
    }

    protected initListeners() {
        this.onNavigationItemSelected((event: NavigatorEvent) => {
            const item = event.getItem() as TabMenuItem;
            const status = item ? IssueStatus[item.getIndex()] : null;
            if (status != null) {
                this.setValue(item.getIndex() as IssueStatus);
            }
        });

        this.handleClickOutside();
    }

    getValue(): IssueStatus {
        return this.value;
    }

    setValue(value: IssueStatus, silent?: boolean): IssueStatusSelector {
        if (IssueStatus[value] != null) {
            const tabIndex = value as number;
            this.selectNavigationItem(tabIndex, true);

            this.removeClass(IssueStatusFormatter.getStatusNames().join(' '));
            this.addClass(IssueStatusFormatter.parseStatusName(value));

            if (!silent && value !== this.value) {
                this.notifyValueChanged(
                    new ValueChangedEvent(IssueStatusFormatter.formatStatus(this.value), IssueStatusFormatter.formatStatus(value)));
            }
            this.value = value;
        }
        return this;
    }

    protected showMenu() {
        if (this.getSelectedNavigationItem().isVisibleInMenu()) {
            this.resetItemsVisibility();
            this.getSelectedNavigationItem().setVisibleInMenu(false);
        }

        let menu = this.getMenuEl();
        let entry = menu.getParentElement().getParentElement();
        let list = entry.getParentElement();
        let offset = entry.getEl().getOffsetTopRelativeToParent() -
                     (list.getEl().getOffsetTopRelativeToParent() + list.getEl().getPaddingTop() + list.getEl().getScrollTop());
        let height = menu.getEl().getHeightWithoutPadding();

        if (offset > height) {
            menu.addClass('upward');
        } else {
            menu.removeClass('upward');
        }

        super.showMenu();

        this.dropdownHandle.down();
    }

    protected setButtonLabel(value: string): IssueStatusSelector {
        this.getTabMenuButtonEl().setLabel(value, false);
        return this;
    }

    private handleClickOutside() {
        const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
            if (this.isVisible()) {
                for (let element = event.target; element; element = (element as HTMLElement).parentNode) {
                    if (element === this.getHTMLElement()) {
                        return;
                    }
                }
                this.hideMenu();
            }
        };

        this.onRemoved(() => {
            Body.get().unMouseDown(mouseClickListener);
        });

        this.onAdded(() => {
            Body.get().onMouseDown(mouseClickListener);
        });
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

}
