import {SortContentTabMenuItem, SortContentTabMenuItemBuilder} from './SortContentTabMenuItem';
import {ChildOrder} from 'lib-admin-ui/content/order/ChildOrder';
import {QueryField} from 'lib-admin-ui/query/QueryField';
import {FieldOrderExprBuilder} from 'lib-admin-ui/content/order/FieldOrderExpr';
import {i18n} from 'lib-admin-ui/util/Messages';

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

        const createOrder = (name: string, ascending: ChildOrder, descending: ChildOrder): SortContentTabMenuItem =>
            new SortContentTabMenuItemBuilder().setLabel(name).setChildOrder({ascending, descending}).setLabel(name).build();

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
