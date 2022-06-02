import {TabMenuItem, TabMenuItemBuilder} from '@enonic/lib-admin-ui/ui/tab/TabMenuItem';
import {FieldOrderExprBuilder} from '../../../resource/order/FieldOrderExpr';
import {ChildOrder} from '../../../resource/order/ChildOrder';

export abstract class SortContentTabMenuItem
    extends TabMenuItem {

    protected fieldName: string;

    protected sortOrder: ChildOrder;

    protected iconClass?: string;

    protected constructor(builder: SortContentTabMenuItemBuilder) {
        super(<TabMenuItemBuilder>builder);

        this.fieldName = builder.fieldName;
        this.toggleClass('single', builder.singleOption);
    }

    protected createChildOrder(fieldName: string, direction: string): ChildOrder {
        const order: ChildOrder = new ChildOrder();

        order.addOrderExpr(
            new FieldOrderExprBuilder().setFieldName(fieldName).setDirection(direction).build());

        return order;
    }

    giveFocusToPrevElem() {
        return super.giveFocus();
    }

    giveFocusToNextElem() {
        return super.giveFocus();
    }

    giveFocus() {
        return this.giveFocusToNextElem();
    }

    getOrder(): ChildOrder {
        return this.sortOrder;
    }

    getSelectedIconClass(): string {
        return this.iconClass;
    }

    getTooltip() {
        return this.getLabel();
    }

    hasChildOrder(order: ChildOrder): boolean {
        return this.sortOrder.equals(order);
    }
}

export abstract class SortContentTabMenuItemBuilder
    extends TabMenuItemBuilder {

    fieldName: string;

    addLabelTitleAttribute: boolean = false;

    singleOption: boolean = true;

    setFieldName(value: string): SortContentTabMenuItemBuilder {
        this.fieldName = value;
        return this;
    }

    setLabel(label: string): SortContentTabMenuItemBuilder {
        return <SortContentTabMenuItemBuilder>super.setLabel(label);
    }

    abstract build(): SortContentTabMenuItem;
}
