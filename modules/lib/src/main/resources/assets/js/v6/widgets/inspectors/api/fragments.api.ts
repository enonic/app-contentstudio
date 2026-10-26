import { ContentTypeName } from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import { type ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { Branch } from '../../../../app/versioning/Branch';
import { DEFAULT_ORDER, QUERY_FIELD, and, like, pathMatch, query } from '../../../entities/content/lib/query';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

type FragmentQueryResultJson = {
    contents: ContentSummaryJson[];
};

/**
 * Match every content item under the content root. This is the always-true base
 * the legacy `FragmentContentSummaryRequest` chain resolved to for its empty
 * search string, minus the redundant `fulltext`/`ngram`/`_path LIKE '/content/**'`
 * clauses it OR-ed alongside — the fragment set comes from the content-type filter.
 */
function buildFragmentQueryExpr(sitePath?: string): string {
    const base = pathMatch('');

    if (!sitePath) {
        return query(base, DEFAULT_ORDER);
    }

    return query(and(base, like(QUERY_FIELD.PATH, `/content${sitePath}/*`)), DEFAULT_ORDER);
}

/**
 * Fetch fragment content summaries, optionally scoped to a site path.
 * Used by: widgets/inspectors fragment-inspection.store.
 */
export function fetchFragmentSummaries(
    sitePath?: string,
    signal?: AbortSignal,
): ResultAsync<ContentSummary[], AppError> {
    const body = {
        queryExpr: buildFragmentQueryExpr(sitePath),
        from: 0,
        size: -1,
        contentTypeNames: [ContentTypeName.FRAGMENT.toString()],
        mustBeReferencedById: null,
        expand: 'summary',
        aggregationQueries: [],
        queryFilters: [],
        branch: Branch.DRAFT,
    };

    return requestJson<FragmentQueryResultJson>(getCmsApiUrl('query'), { method: 'POST', body, signal }).map((json) =>
        json.contents.map(ContentSummary.fromJson),
    );
}
