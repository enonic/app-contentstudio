import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {i18n} from 'lib-admin-ui/util/Messages';
import * as Q from 'q';

export class AscDescSortContentTabMenuItem extends SortContentTabMenuItem {

    private readonly ascButton: Button;

    private readonly descButton: Button;

    private readonly ascending: ChildOrder;

    private readonly descending: ChildOrder;

    constructor(builder: AscDescSortContentTabMenuItemBuilder) {
        super(builder);

        this.ascending = this.createChildOrder(this.fieldName, ChildOrder.ASC_ORDER_DIRECTION_VALUE);
        this.descending = this.createChildOrder(this.fieldName, ChildOrder.DESC_ORDER_DIRECTION_VALUE);
        this.ascButton = this.createButton(this.ascending, true);
        this.descButton = this.createButton(this.descending, false);
        this.descButton.addClass('selected');
        this.sortOrder = this.descending;
        this.iconClass = `icon-sort-${this.descending.isAlpha() ? 'alpha' : 'num'}-desc`;
    }

    private createButton(order: ChildOrder, asc: boolean): Button {
        const type: string = asc ? 'ascending' : 'descending';
        const iconClass: string = `icon-sort-${order.isAlpha() ? 'alpha' : 'num'}-${type.slice(0, -6)}`;

        const button: Button = new Button();
        button.addClass('sorting-order').addClass(iconClass);
        button.setTitle(i18n(`field.sortType.${type}`));
        button.onClicked(() => {
            this.sortOrder = order;
            this.iconClass = iconClass;
            this.select();
        });
        button.onFocus(() => {
            this.sortOrder = order;
            this.iconClass = iconClass;
        });

        return button;
    }

    private markSelected() {
        if (this.sortOrder.equals(this.ascending)) {
            this.descButton.removeClass('selected');
            this.ascButton.addClass('selected');
        } else if (this.sortOrder.equals(this.descending)) {
            this.ascButton.removeClass('selected');
            this.descButton.addClass('selected');
        }
    }

    getTooltip() {
        const type: string = this.sortOrder.equals(this.ascending) ? 'ascending' : 'descending';
        return i18n(`tooltip.sortType.${type}`, this.getLabel());
    }

    giveFocusToPrevElem() {
        return this.ascButton.giveFocus();
    }

    giveFocusToNextElem() {
        return this.descButton.giveFocus();
    }

    select() {
        this.markSelected();
        super.select();
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.ascButton, this.descButton);

            return rendered;
        });
    }

    hasChildOrder(order: ChildOrder): boolean {
        return order.equals(this.ascending) || order.equals(this.descending);
    }

    static create(): AscDescSortContentTabMenuItemBuilder {
        return new AscDescSortContentTabMenuItemBuilder();
    }
}

export class AscDescSortContentTabMenuItemBuilder
    extends SortContentTabMenuItemBuilder {

    singleOption: boolean = false;

    clickHandler: () => void = () => void 0;

    setLabel(label: string): AscDescSortContentTabMenuItemBuilder {
        return <AscDescSortContentTabMenuItemBuilder>super.setLabel(label);
    }

    build(): AscDescSortContentTabMenuItem {
        return new AscDescSortContentTabMenuItem(this);
    }

}
