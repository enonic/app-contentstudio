import { type ResultAsync } from 'neverthrow';
import { requestJson } from '@enonic/ui-utils/request';
import type { AppError } from '@enonic/ui-utils';
import { type Content } from '../../../../app/content/Content';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { type ContentQueryResultJson } from '../../../../app/resource/json/ContentQueryResultJson';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';
import { parseContent } from '../lib/parseContent';
import { buildSelectorBody, type ContentSelectorQueryParams } from './selectorQuery.api';

// Expand.FULL string form sent verbatim by the legacy ContentSelectorRequest.expandAsString().
const EXPAND_FULL = 'full';

export type ContentFullSelectorQueryResult = {
    contents: Content[];
    hits: number;
    totalHits: number;
};

/**
 * Flat content-selector query expanding to full content. Mirrors the legacy
 * ContentSelectorQueryRequest with Expand.FULL. Kept separate from
 * selectorQuery.api so the Content class is not loaded by the summary/tree tests.
 * Used by: features/shared/form/input-types/tag/ContentTagSuggester.
 * @param projectName - Optional project name, defaults to the active project
 */
export function contentFullSelectorQuery(
    params: ContentSelectorQueryParams,
    projectName?: string,
): ResultAsync<ContentFullSelectorQueryResult, AppError> {
    return requestJson<ContentQueryResultJson<ContentJson>>(getCmsApiUrl('selectorQuery', projectName), {
        method: 'POST',
        body: buildSelectorBody(params, EXPAND_FULL),
    }).map((json) => ({
        contents: json.contents.map(parseContent),
        hits: json.metadata.hits,
        totalHits: json.metadata.totalHits,
    }));
}
