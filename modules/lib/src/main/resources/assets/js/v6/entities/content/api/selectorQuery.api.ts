import { type QueryExpr } from '@enonic/lib-admin-ui/query/expr/QueryExpr';
import { type ResultAsync } from 'neverthrow';
import { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { ContentTreeSelectorItem } from '../../../../app/item/ContentTreeSelectorItem';
import { type ContentQueryResultJson } from '../../../../app/resource/json/ContentQueryResultJson';
import { type ContentTreeSelectorListJson } from '../../../../app/resource/json/ContentTreeSelectorListJson';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';
import { buildSelectorSearchExpr } from '../lib/selectorQueryExpr';

// Expand.SUMMARY string form sent verbatim by the legacy ContentSelectorRequest.expandAsString().
// The FULL variant lives in selectorQueryFull.api to keep the Content class out of this module.
const EXPAND_SUMMARY = 'summary';

export type ContentSelectorQueryParams = {
    /** Search string for the default path-match expression (ignored when queryExpr is set). */
    searchString?: string;
    /** Overrides the default expression built from searchString/contextPath. */
    queryExpr?: QueryExpr;
    /** Content path scoping the default expression (empty when unset). */
    contextPath?: string;
    from: number;
    size: number;
    contentId?: string;
    inputName?: string;
    contentTypeNames?: string[];
    allowedContentPaths?: string[];
    applicationKey?: string;
};

export type ContentTreeSelectorQueryParams = ContentSelectorQueryParams & {
    parentPath?: string;
    childOrder?: string;
};

export type ContentSelectorQueryResult = {
    contents: ContentSummary[];
    hits: number;
    totalHits: number;
};

export type ContentTreeSelectorQueryResult = {
    items: ContentTreeSelectorItem[];
    totalHits: number;
};

/**
 * Reproduces the legacy ContentSelectorRequest.getParams() key order and
 * serialization: unset contentId/applicationKey become null, unset arrays
 * become empty arrays, and inputName is omitted when undefined.
 * Used by: entities/content/api/selectorQuery, entities/content/api/selectorQueryFull.
 */
export function buildSelectorBody(params: ContentSelectorQueryParams, expand: string): object {
    const queryExpr = params.queryExpr ?? buildSelectorSearchExpr(params.searchString ?? '', params.contextPath ?? '');

    return {
        queryExpr: queryExpr.toString(),
        from: params.from,
        size: params.size,
        expand,
        contentId: params.contentId ?? null,
        inputName: params.inputName,
        contentTypeNames: params.contentTypeNames ?? [],
        allowedContentPaths: params.allowedContentPaths ?? [],
        applicationKey: params.applicationKey ?? null,
    };
}

/**
 * Flat content-selector query expanding to summaries. Mirrors the legacy
 * ContentSelectorQueryRequest with Expand.SUMMARY.
 * Used by: features/shared/hooks/useContentComboboxData.
 */
export function contentSelectorQuery(
    params: ContentSelectorQueryParams,
): ResultAsync<ContentSelectorQueryResult, AppError> {
    return requestJson<ContentQueryResultJson<ContentSummaryJson>>(getCmsApiUrl('selectorQuery'), {
        method: 'POST',
        body: buildSelectorBody(params, EXPAND_SUMMARY),
    }).map((json) => ({
        contents: ContentSummary.fromJsonArray(json.contents),
        hits: json.metadata.hits,
        totalHits: json.metadata.totalHits,
    }));
}

/**
 * Tree content-selector query. Mirrors the legacy ContentTreeSelectorQueryRequest:
 * the base body merged with parentPath (null when unset) and childOrder ('' when
 * unset). Empty results carry a zero total, matching the legacy zero-metadata path.
 * Used by: features/shared/hooks/useContentComboboxData.
 */
export function contentTreeSelectorQuery(
    params: ContentTreeSelectorQueryParams,
): ResultAsync<ContentTreeSelectorQueryResult, AppError> {
    const body = {
        ...buildSelectorBody(params, EXPAND_SUMMARY),
        parentPath: params.parentPath ?? null,
        childOrder: params.childOrder ?? '',
    };

    return requestJson<ContentTreeSelectorListJson>(getCmsApiUrl('treeSelectorQuery'), {
        method: 'POST',
        body,
    }).map((json) => {
        if (!json.items || json.items.length === 0) {
            return { items: [], totalHits: 0 };
        }

        return {
            items: json.items.map((item) => ContentTreeSelectorItem.fromJson(item)),
            totalHits: json.metadata.totalHits,
        };
    });
}
