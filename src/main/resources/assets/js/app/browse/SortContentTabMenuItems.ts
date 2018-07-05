import '../../api.ts';
import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import ChildOrder = api.content.order.ChildOrder;
import QueryField = api.query.QueryField;
import FieldOrderExprBuilder = api.content.order.FieldOrderExprBuilder;
import i18n = api.util.i18n;

interface OrderMeta {
    field: string;
    direction: string;
}

export class SortContentTabMenuItems {

    public SORT_MANUAL_ITEM: SortContentTabMenuItem;

    private items: SortContentTabMenuItem[] = [];

    constructor() {
        const createChildOrder = (orders: OrderMeta[]) => {
            const order = new ChildOrder();
            orders.forEach((meta: OrderMeta) => {
                order.addOrderExpr(new FieldOrderExprBuilder().setFieldName(meta.field).setDirection(meta.direction).build());
            });
            return order;
        };

        const createOrder = (name: string, ascending: ChildOrder, descending: ChildOrder) =>
            new SortContentTabMenuItemBuilder().setLabel(name).setChildOrder({ascending, descending}).build();

        this.SORT_MANUAL_ITEM =
            new SortContentTabMenuItemBuilder()
                .setLabel(i18n('field.sortType.manual'))
                .setChildOrder(createChildOrder([
                    {field: QueryField.MANUAL_ORDER_VALUE, direction: ChildOrder.DESC_ORDER_DIRECTION_VALUE},
                    {field: QueryField.TIMESTAMP, direction: ChildOrder.DESC_ORDER_DIRECTION_VALUE}
                ]))
                .build();

        this.items.push(
            createOrder(
                i18n('field.sortType.modified'),
                createChildOrder([{field: QueryField.MODIFIED_TIME, direction: ChildOrder.ASC_ORDER_DIRECTION_VALUE}]),
                createChildOrder([{field: QueryField.MODIFIED_TIME, direction: ChildOrder.DESC_ORDER_DIRECTION_VALUE}])
            ),
            createOrder(
                i18n('field.sortType.created'),
                createChildOrder([{field: QueryField.CREATED_TIME, direction: ChildOrder.ASC_ORDER_DIRECTION_VALUE}]),
                createChildOrder([{field: QueryField.CREATED_TIME, direction: ChildOrder.DESC_ORDER_DIRECTION_VALUE}])
            ),
            createOrder(
                i18n('field.sortType.displayName'),
                createChildOrder([{field: QueryField.DISPLAY_NAME, direction: ChildOrder.ASC_ORDER_DIRECTION_VALUE}]),
                createChildOrder([{field: QueryField.DISPLAY_NAME, direction: ChildOrder.DESC_ORDER_DIRECTION_VALUE}])
            ),
            createOrder(
                i18n('field.sortType.publish'),
                createChildOrder([{field: QueryField.PUBLISH_FIRST, direction: ChildOrder.ASC_ORDER_DIRECTION_VALUE}]),
                createChildOrder([{field: QueryField.PUBLISH_FIRST, direction: ChildOrder.DESC_ORDER_DIRECTION_VALUE}])
            ),
            this.SORT_MANUAL_ITEM
        );
    }

    getAllItems(): SortContentTabMenuItem[] {
        return this.items.slice();
    }

    getManualItemIndex(): number {
        return this.items.indexOf(this.SORT_MANUAL_ITEM);
    }
}
