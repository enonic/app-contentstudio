import { ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { FieldOrderExprBuilder } from '../../../../app/resource/order/FieldOrderExpr';

/**
 * Builds the default root child order (`_score DESC, _path ASC`).
 * Replicates ContentSummaryRequest.ROOT_ORDER without the legacy request stack.
 * Used by: entities/content/api/content-fetcher.
 */
export function createRootChildOrder(): ChildOrder {
    const childOrder = new ChildOrder();
    childOrder.addOrderExpr(new FieldOrderExprBuilder().setFieldName('_score').setDirection('DESC').build());
    childOrder.addOrderExpr(new FieldOrderExprBuilder().setFieldName('_path').setDirection('ASC').build());
    return childOrder;
}
