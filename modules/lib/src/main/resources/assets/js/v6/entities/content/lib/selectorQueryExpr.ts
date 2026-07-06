import { FieldExpr } from '@enonic/lib-admin-ui/query/expr/FieldExpr';
import { FieldOrderExpr } from '@enonic/lib-admin-ui/query/expr/FieldOrderExpr';
import { OrderDirection } from '@enonic/lib-admin-ui/query/expr/OrderDirection';
import { type OrderExpr } from '@enonic/lib-admin-ui/query/expr/OrderExpr';
import { QueryExpr } from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import { PathMatchExpressionBuilder } from '@enonic/lib-admin-ui/query/PathMatchExpression';
import { QueryField } from '@enonic/lib-admin-ui/query/QueryField';

// Mirrors ContentSelectorRequest.DEFAULT_ORDER (_score DESC, modifiedTime DESC).
const DEFAULT_ORDER: OrderExpr[] = [
    new FieldOrderExpr(new FieldExpr('_score'), OrderDirection.DESC),
    new FieldOrderExpr(new FieldExpr('modifiedTime'), OrderDirection.DESC),
];

/**
 * Builds the content-selector search expression using the same lib-admin-ui
 * value classes as the legacy ContentSelectorRequest.createSearchExpression +
 * setSearchString pair, so the serialized query is reproduced byte-for-byte.
 * Used by: entities/content/api/selectorQuery.
 */
export function buildSelectorSearchExpr(searchString: string, path: string): QueryExpr {
    const constraint = new PathMatchExpressionBuilder()
        .setSearchString(searchString)
        .setPath(path)
        .addField(new QueryField(QueryField.DISPLAY_NAME, 5))
        .addField(new QueryField(QueryField.NAME, 3))
        .addField(new QueryField(QueryField.ALL))
        .build();

    return new QueryExpr(constraint, DEFAULT_ORDER);
}
