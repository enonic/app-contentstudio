import {IssueStatus, IssueStatusFormatter} from '../IssueStatus';
import TabMenuItem = api.ui.tab.TabMenuItem;
import TabMenu = api.ui.tab.TabMenu;
import DivEl = api.dom.DivEl;
import i18n = api.util.i18n;

interface IssueOption {
    value: IssueStatus;
    name: string;
}

export class IssueStatusSelector
    extends TabMenu {

    private static OPTIONS: IssueOption[] = [
        {value: IssueStatus.OPEN, name: 'open'},
        {value: IssueStatus.CLOSED, name: 'closed'}
    ];

    private value: IssueStatus;

    private valueChangedListeners: { (event: api.ValueChangedEvent): void }[] = [];

    constructor() {
        super('issue-status-selector');

        this.initElements();
        this.initListeners();
    }

    protected initElements() {
        this.initNavigationItems();
        this.initIcon();
    }

    private initNavigationItems() {
        IssueStatusSelector.OPTIONS.forEach(option => {
            const menuItem: TabMenuItem = TabMenuItem.create()
                .setLabel(i18n(`field.issue.status.${option.name}`))
                .setAddLabelTitleAttribute(false)
                .build();

            this.addNavigationItem(menuItem);
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

    protected initListeners() {
        this.onNavigationItemSelected((event: api.ui.NavigatorEvent) => {
            let item: api.ui.tab.TabMenuItem = <api.ui.tab.TabMenuItem> event.getItem();
            this.setValue(IssueStatusSelector.OPTIONS[item.getIndex()].value);
        });

        this.handleClickOutside();
    }

    getValue(): IssueStatus {
        return this.value;
    }

    setValue(value: IssueStatus, silent?: boolean): IssueStatusSelector {
        const option = IssueStatusSelector.findOptionByValue(value);
        if (option) {
            this.selectNavigationItem(IssueStatusSelector.OPTIONS.indexOf(option), true);

            this.removeClass(IssueStatusSelector.OPTIONS
                .map(curOption => curOption.name)
                .join(' '));
            this.addClass(option.name);

            if (!silent && value !== this.value) {
                this.notifyValueChanged(
                    new api.ValueChangedEvent(IssueStatusFormatter.formatStatus(this.value), IssueStatusFormatter.formatStatus(value)));
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
    }

    protected setButtonLabel(value: string): IssueStatusSelector {
        this.getTabMenuButtonEl().setLabel(value, false);
        return this;
    }

    private static findOptionByValue(value: IssueStatus) {
        for (let i = 0; i < IssueStatusSelector.OPTIONS.length; i++) {
            let option = IssueStatusSelector.OPTIONS[i];
            if (option.value === value) {
                return option;
            }
        }
        return undefined;
    }

    private handleClickOutside() {
        const mouseClickListener: (event: MouseEvent) => void = (event: MouseEvent) => {
            if (this.isVisible()) {
                for (let element = event.target; element; element = (<any>element).parentNode) {
                    if (element === this.getHTMLElement()) {
                        return;
                    }
                }
                this.hideMenu();
            }
        };

        this.onRemoved(() => {
            api.dom.Body.get().unMouseDown(mouseClickListener);
        });

        this.onAdded(() => {
            api.dom.Body.get().onMouseDown(mouseClickListener);
        });
    }

    onValueChanged(listener: (event: api.ValueChangedEvent) => void) {
        this.valueChangedListeners.push(listener);
    }

    unValueChanged(listener: (event: api.ValueChangedEvent) => void) {
        this.valueChangedListeners = this.valueChangedListeners.filter((curr) => {
            return curr !== listener;
        });
    }

    private notifyValueChanged(event: api.ValueChangedEvent) {
        this.valueChangedListeners.forEach((listener) => {
            listener(event);
        });
    }

}
