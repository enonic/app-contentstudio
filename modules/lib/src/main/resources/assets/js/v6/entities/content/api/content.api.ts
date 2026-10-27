import { okAsync, ResultAsync } from 'neverthrow';
import { requestJson, requestOptionalJson } from '@enonic/ui-utils/request';
import { AppError } from '@enonic/ui-utils';
import { type Content } from '../../../../app/content/Content';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { type Site } from '../../../../app/content/Site';
import { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { type ListContentResult } from '../../../../app/resource/ListContentResult';
import { parseContent } from '../lib/parseContent';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

/**
 * Resolve content summaries for the given ids via the `resolveByIds` endpoint.
 * Empty input never hits the server.
 * Used by: entities/content/api/content-fetcher, entities/content/lib/contentSummaries.
 * @param projectName - Optional project name, defaults to the active project
 */
export function resolveContentSummaries(
    contentIds: ContentId[],
    projectName?: string,
): ResultAsync<ContentSummary[], AppError> {
    if (contentIds.length === 0) {
        return okAsync([]);
    }

    const url = getCmsApiUrl('resolveByIds', projectName);

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    return requestJson<ListContentResult<ContentSummaryJson>>(url, { method: 'POST', body: payload }).map((result) =>
        ContentSummary.fromJsonArray(result.contents),
    );
}

export function fetchContentById(contentId: string, projectName?: string): ResultAsync<Content, AppError> {
    const url = `${getCmsApiUrl('', projectName)}?id=${encodeURIComponent(contentId)}`;

    return requestJson<ContentJson>(url).map(parseContent);
}

export function fetchContentByPath(path: string, projectName?: string): ResultAsync<Content, AppError> {
    const url = `${getCmsApiUrl('bypath', projectName)}?path=${encodeURIComponent(path)}`;

    return requestJson<ContentJson>(url).map(parseContent);
}

export function fetchNearestSite(contentId: ContentId, projectName?: string): ResultAsync<Site | undefined, AppError> {
    const url = getCmsApiUrl('nearestSite', projectName);

    return requestOptionalJson<ContentJson>(url, {
        method: 'POST',
        body: { contentId: contentId.toString() },
    }).map((json) => (json ? (parseContent(json) as Site) : undefined));
}
