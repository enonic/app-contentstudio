import { okAsync, type ResultAsync } from 'neverthrow';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { type ContentIdBaseItemJson } from '../../../../app/resource/json/ContentIdBaseItemJson';
import { type ContentQueryResultJson } from '../../../../app/resource/json/ContentQueryResultJson';
import { type ListContentResult } from '../../../../app/resource/ListContentResult';
import { type ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

// Expand.SUMMARY numeric value, sent verbatim by the legacy ListContentByIdRequest.
const SUMMARY_EXPAND = 1;
// Expand.SUMMARY string form, used by the query endpoint.
const SUMMARY_EXPAND_STRING = 'summary';
// Branch.DRAFT — the default branch the browse tree queries.
const DRAFT_BRANCH = 'draft';

export type ListContentByParentParams = {
    parentId?: ContentId;
    from: number;
    size: number;
    childOrder?: ChildOrder;
};

export type ListContentByParentResult = {
    contents: ContentSummary[];
    totalHits: number;
};

export type QueryContentParams = {
    queryExpr?: string;
    from: number;
    size: number;
    contentTypeNames?: string[];
    mustBeReferencedById?: string | null;
    aggregationQueries?: unknown[];
    queryFilters?: unknown[];
    query?: object;
    querySort?: object[];
    // Target branch to query; defaults to draft. Set to master to see online-only content.
    branch?: string;
};

export type QueryContentResult = {
    contents: ContentSummary[];
    totalHits: number;
    aggregations: unknown;
};

export type ListContentIdsByParentParams = {
    parentId?: ContentId;
    childOrder?: ChildOrder;
};

/**
 * List a page of a parent's children as content summaries. The parent id is
 * omitted for root listings; the child order is always sent (empty when unset).
 * Used by: entities/content/api/content-fetcher.
 */
export function listContentByParent(
    params: ListContentByParentParams,
): ResultAsync<ListContentByParentResult, AppError> {
    const { parentId, from, size, childOrder } = params;

    const query = new URLSearchParams();
    if (parentId != null) {
        query.set('parentId', parentId.toString());
    }
    query.set('expand', String(SUMMARY_EXPAND));
    query.set('from', String(from));
    query.set('size', String(size));
    query.set('childOrder', childOrder ? childOrder.toString() : '');

    const url = `${getCmsApiUrl('list')}?${query.toString()}`;

    return requestJson<ListContentResult<ContentSummaryJson>>(url).map((json) => ({
        contents: ContentSummary.fromJsonArray(json.contents),
        totalHits: json.metadata.totalHits,
    }));
}

/**
 * Run a content query on the given branch (draft by default), expanding to
 * summaries. Aggregations are passed through raw for the caller's filter machinery.
 * Used by: entities/content/api/content-fetcher.
 */
export function queryContent(params: QueryContentParams): ResultAsync<QueryContentResult, AppError> {
    const body = {
        queryExpr: params.queryExpr,
        from: params.from,
        size: params.size,
        contentTypeNames: params.contentTypeNames,
        mustBeReferencedById: params.mustBeReferencedById,
        expand: SUMMARY_EXPAND_STRING,
        aggregationQueries: params.aggregationQueries,
        queryFilters: params.queryFilters,
        query: params.query,
        querySort: params.querySort,
        branch: params.branch ?? DRAFT_BRANCH,
    };

    return requestJson<ContentQueryResultJson<ContentSummaryJson>>(getCmsApiUrl('query'), {
        method: 'POST',
        body,
    }).map((json) => ({
        contents: ContentSummary.fromJsonArray(json.contents),
        totalHits: json.metadata.totalHits,
        aggregations: json.aggregations,
    }));
}

/**
 * Resolve which of the given content ids are read-only. Empty input never hits
 * the server.
 * Used by: entities/content/api/content-fetcher.
 */
export function fetchReadOnlyContentIds(ids: ContentId[]): ResultAsync<string[], AppError> {
    if (ids.length === 0) {
        return okAsync([]);
    }

    return requestJson<string[]>(getCmsApiUrl('isReadOnlyContent'), {
        method: 'POST',
        body: { contentIds: ids.map((id) => id.toString()) },
    });
}

/**
 * List all child ids for a parent (no pagination). The parent id is omitted for
 * root listings; the child order is always sent (empty when unset).
 * Used by: entities/content/api/content-fetcher.
 */
export function listContentIdsByParent(params: ListContentIdsByParentParams): ResultAsync<ContentId[], AppError> {
    const { parentId, childOrder } = params;

    const query = new URLSearchParams();
    if (parentId != null) {
        query.set('parentId', parentId.toString());
    }
    query.set('childOrder', childOrder ? childOrder.toString() : '');

    const url = `${getCmsApiUrl('listIds')}?${query.toString()}`;

    return requestJson<ContentIdBaseItemJson[]>(url).map((json) => json.map((item) => new ContentId(item.id)));
}
