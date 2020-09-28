import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import {Button} from 'lib-admin-ui/ui/button/Button';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {i18n} from 'lib-admin-ui/util/Messages';
import * as Q from 'q';

export class AscDescSortContentTabMenuItem extends SortContentTabMenuItem {

    private readonly sortButton: Button;

    private readonly direction: string;

    constructor(builder: AscDescSortContentTabMenuItemBuilder) {
        super(builder);

        this.direction = builder.direction;
        this.sortOrder = this.createChildOrder(this.fieldName, this.direction);
        this.sortButton = this.createButton();
        this.iconClass = `icon-sort-${this.sortOrder.isAlpha() ? 'alpha' : 'num'}-desc`;
    }

    private createButton(): Button {
        const type: string = this.isAscending() ? 'ascending' : 'descending';
        const iconClass: string = `icon-sort-${this.sortOrder.isAlpha() ? 'alpha' : 'num'}-${type.slice(0, -6)}`;

        const button: Button = new Button();
        button.addClass('sorting-order').addClass(iconClass);
        button.setTitle(i18n(`field.sortType.${type}`));
        button.onClicked(() => {
            this.select();
        });

        return button;
    }

    private isAscending(): boolean {
        return this.direction === ChildOrder.ASC_ORDER_DIRECTION_VALUE;
    }

    getTooltip() {
        const type: string = this.isAscending() ? 'ascending' : 'descending';
        return i18n(`tooltip.sortType.${type}`, this.getLabel());
    }

    doRender(): Q.Promise<boolean> {
        return super.doRender().then((rendered: boolean) => {
            this.appendChildren(this.sortButton);

            return rendered;
        });
    }

    static create(): AscDescSortContentTabMenuItemBuilder {
        return new AscDescSortContentTabMenuItemBuilder();
    }
}

export class AscDescSortContentTabMenuItemBuilder
    extends SortContentTabMenuItemBuilder {

    singleOption: boolean = false;

    direction: string = ChildOrder.DESC_ORDER_DIRECTION_VALUE;

    clickHandler: () => void = () => void 0;

    setLabel(label: string): AscDescSortContentTabMenuItemBuilder {
        return <AscDescSortContentTabMenuItemBuilder>super.setLabel(label);
    }

    setDirection(value: string): AscDescSortContentTabMenuItemBuilder {
        this.direction = value;
        return this;
    }

    build(): AscDescSortContentTabMenuItem {
        return new AscDescSortContentTabMenuItem(this);
    }

}
