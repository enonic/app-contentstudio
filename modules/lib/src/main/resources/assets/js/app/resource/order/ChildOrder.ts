import {type ChildOrderJson} from '../json/ChildOrderJson';
import {type OrderExprWrapperJson} from '../json/OrderExprWrapperJson';
import {type Equitable} from '@enonic/lib-admin-ui/Equitable';
import {QueryField} from '@enonic/lib-admin-ui/query/QueryField';
import {ObjectHelper} from '@enonic/lib-admin-ui/ObjectHelper';
import {type SetChildOrderJson} from '../json/SetChildOrderJson';
import {OrderExpr} from './OrderExpr';
import {FieldOrderExpr, FieldOrderExprBuilder} from './FieldOrderExpr';
import {DynamicOrderExprBuilder} from './DynamicOrderExpr';
import {type ContentId} from '../../content/ContentId';

export class ChildOrder
    implements Equitable {

    static DEFAULT_ORDER_FIELD_VALUE: string = QueryField.MODIFIED_TIME;
    static ASC_ORDER_DIRECTION_VALUE: string = 'ASC';
    static DESC_ORDER_DIRECTION_VALUE: string = 'DESC';
    static MANUAL_ORDER_VALUE_KEY: string = QueryField.MANUAL_ORDER_VALUE;
    private DEFAULT_ORDER_DIRECTION_VALUE: string = 'DESC';
    private orderExpressions: OrderExpr[] = [];

    static fromJson(childOrderJson: ChildOrderJson): ChildOrder {
        const childOrder: ChildOrder = new ChildOrder();
        childOrderJson.orderExpressions.forEach((orderExprJson: OrderExprWrapperJson) => {
            if (orderExprJson.FieldOrderExpr) {
                childOrder.orderExpressions.push(new FieldOrderExprBuilder(orderExprJson.FieldOrderExpr).build());
            } else if (orderExprJson.DynamicOrderExpr) {
                childOrder.orderExpressions.push(new DynamicOrderExprBuilder(orderExprJson.DynamicOrderExpr).build());
            }
        });
        return childOrder;
    }

    static toSetChildOrderJson(contentId: ContentId, childOrder: ChildOrder): SetChildOrderJson {
        if (contentId && childOrder) {
            return {
                childOrder: childOrder.toJson(),
                contentId: contentId.toString()
            };
        }

        return null;
    }

    getOrderExpressions(): OrderExpr[] {
        return this.orderExpressions;
    }

    addOrderExpr(expr: OrderExpr) {
        this.orderExpressions.push(expr);
    }

    addOrderExpressions(expressions: OrderExpr[]) {
        expressions.forEach((expr: OrderExpr) => {
            this.orderExpressions.push(expr);
        });

    }

    isManual(): boolean {
        if (this.orderExpressions.length === 0) {
            return false;
        }
        const order = this.orderExpressions[0];
        if (ObjectHelper.iFrameSafeInstanceOf(order, FieldOrderExpr)) {
            return ObjectHelper.stringEquals(ChildOrder.MANUAL_ORDER_VALUE_KEY.toLowerCase(),
                (order as FieldOrderExpr).getFieldName().toLowerCase());
        }
        return false;
    }

    isDesc(): boolean {
        if (this.orderExpressions.length === 0) {
            return this.DEFAULT_ORDER_DIRECTION_VALUE === ChildOrder.DESC_ORDER_DIRECTION_VALUE;
        }
        const order = this.orderExpressions[0];
        return ObjectHelper.stringEquals(ChildOrder.DESC_ORDER_DIRECTION_VALUE.toLowerCase(), order.getDirection().toLowerCase());
    }

    isAlpha(): boolean {
        if (this.orderExpressions.length === 0) {
            return false;
        }
        const order = (this.orderExpressions[0] as FieldOrderExpr);
        return ObjectHelper.stringEquals(QueryField.DISPLAY_NAME.toLowerCase(), order.getFieldName().toLowerCase());
    }

    isDefault(): boolean {
        const order = this.orderExpressions[0];
        if (ObjectHelper.iFrameSafeInstanceOf(order, FieldOrderExpr)) {
            const fieldOrder = (order as FieldOrderExpr);
            if (ObjectHelper.stringEquals(this.DEFAULT_ORDER_DIRECTION_VALUE.toLowerCase(),
                fieldOrder.getDirection().toLowerCase()) &&
                ObjectHelper.stringEquals(ChildOrder.DEFAULT_ORDER_FIELD_VALUE.toLowerCase(),
                    fieldOrder.getFieldName().toLowerCase())) {
                return true;
            }
        }
        return false;
    }

    toJson(): ChildOrderJson {

        return {
            orderExpressions: OrderExpr.toArrayJson(this.getOrderExpressions())
        };
    }

    toString(): string {
        return this.orderExpressions.map(expr => expr.toString()).join(', ');
    }

    equals(o: Equitable): boolean {

        if (!ObjectHelper.iFrameSafeInstanceOf(o, ChildOrder)) {
            return false;
        }
        const other = o as ChildOrder;
        if (this.orderExpressions.length !== other.getOrderExpressions().length) {
            return false;
        }
        return this.orderExpressions.every((orderExpression, index) => {
            return orderExpression.equals(other.getOrderExpressions()[index]);
        });
    }

}
