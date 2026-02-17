import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import {Button} from '@enonic/lib-admin-ui/ui/button/Button';
import {i18n} from '@enonic/lib-admin-ui/util/Messages';
import type Q from 'q';
import {ChildOrder} from '../../../resource/order/ChildOrder';

export class AscDescSortContentTabMenuItem extends SortContentTabMenuItem {

    private readonly sortButton: Button;

    private readonly direction: string;

    constructor(builder: AscDescSortContentTabMenuItemBuilder) {
        super(builder);

        this.direction = builder.direction;
        this.sortOrder = this.createChildOrder(this.fieldName, this.direction);
        this.iconClass = `icon-sort-${this.sortOrder.isAlpha() ? 'alpha' : 'num'}-${this.direction.toLowerCase()}`;
        this.sortButton = this.createButton();
    }

    private createButton(): Button {
        const type: string = this.isAscending() ? 'ascending' : 'descending';

        const button: Button = new Button();
        button.addClass('sorting-order').addClass(this.iconClass);
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
        return super.setLabel(label) as AscDescSortContentTabMenuItemBuilder;
    }

    setDirection(value: string): AscDescSortContentTabMenuItemBuilder {
        this.direction = value;
        return this;
    }

    build(): AscDescSortContentTabMenuItem {
        return new AscDescSortContentTabMenuItem(this);
    }

}
