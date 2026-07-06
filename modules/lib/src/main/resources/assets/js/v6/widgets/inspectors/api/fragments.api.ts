import { CompareExpr } from '@enonic/lib-admin-ui/query/expr/CompareExpr';
import { type ConstraintExpr } from '@enonic/lib-admin-ui/query/expr/ConstraintExpr';
import { DynamicConstraintExpr } from '@enonic/lib-admin-ui/query/expr/DynamicConstraintExpr';
import { FieldExpr } from '@enonic/lib-admin-ui/query/expr/FieldExpr';
import { FieldOrderExpr } from '@enonic/lib-admin-ui/query/expr/FieldOrderExpr';
import { FunctionExpr } from '@enonic/lib-admin-ui/query/expr/FunctionExpr';
import { LogicalExpr } from '@enonic/lib-admin-ui/query/expr/LogicalExpr';
import { LogicalOperator } from '@enonic/lib-admin-ui/query/expr/LogicalOperator';
import { OrderDirection } from '@enonic/lib-admin-ui/query/expr/OrderDirection';
import { type OrderExpr } from '@enonic/lib-admin-ui/query/expr/OrderExpr';
import { QueryExpr } from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import { ValueExpr } from '@enonic/lib-admin-ui/query/expr/ValueExpr';
import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type ResultAsync } from 'neverthrow';
import { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { Branch } from '../../../../app/versioning/Branch';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type FragmentQueryResultJson = {
    contents: ContentSummaryJson[];
};

const FRAGMENT_QUERY_ORDER: OrderExpr[] = [
    new FieldOrderExpr(new FieldExpr('_score'), OrderDirection.DESC),
    new FieldOrderExpr(new FieldExpr('modifiedTime'), OrderDirection.DESC),
];

/**
 * Match every content item under the content root. This is the always-true base
 * the legacy `FragmentContentSummaryRequest` chain resolved to for its empty
 * search string, minus the redundant `fulltext`/`ngram`/`_path LIKE '/content/**'`
 * clauses it OR-ed alongside — the fragment set comes from the content-type filter.
 */
function createContentRootConstraint(): ConstraintExpr {
    return new DynamicConstraintExpr(
        new FunctionExpr('pathMatch', [ValueExpr.stringValue('_path'), ValueExpr.stringValue('/content')]),
    );
}

function buildFragmentQueryExpr(sitePath?: string): QueryExpr {
    const base = createContentRootConstraint();

    if (!sitePath) {
        return new QueryExpr(base, FRAGMENT_QUERY_ORDER);
    }

    const siteConstraint = CompareExpr.like(new FieldExpr('_path'), ValueExpr.string(`/content${sitePath}/*`));

    return new QueryExpr(new LogicalExpr(base, LogicalOperator.AND, siteConstraint), FRAGMENT_QUERY_ORDER);
}

/**
 * Fetch fragment content summaries, optionally scoped to a site path.
 * Used by: widgets/inspectors fragment-inspection.store.
 */
export function fetchFragmentSummaries(sitePath?: string): ResultAsync<ContentSummary[], AppError> {
    const body = {
        queryExpr: buildFragmentQueryExpr(sitePath).toString(),
        from: 0,
        size: -1,
        contentTypeNames: [ContentTypeName.FRAGMENT.toString()],
        mustBeReferencedById: null,
        expand: 'summary',
        aggregationQueries: [],
        queryFilters: [],
        branch: Branch.DRAFT,
    };

    return requestJson<FragmentQueryResultJson>(getCmsApiUrl('query'), { method: 'POST', body }).map((json) =>
        json.contents.map(ContentSummary.fromJson),
    );
}
