import { ResultAsync } from 'neverthrow';
import { type Content } from '../../../../app/content/Content';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { type Site } from '../../../../app/content/Site';
import { ContentSummary } from '../../../../app/content/ContentSummary';
import { type ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { type ListContentResult } from '../../../../app/resource/ListContentResult';
import { parseContent } from '../lib/parseContent';
import { requestJson, requestOptionalJson } from '../../../shared/api/client';
import { AppError } from '../../../shared/api/errors';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

async function resolveContentSummaries(contentIds: ContentId[]): Promise<ContentSummary[]> {
    if (contentIds.length === 0) {
        return [];
    }

    const url = getCmsApiUrl('resolveByIds');

    const payload = {
        contentIds: contentIds.map((id) => id.toString()),
    };

    const result = await requestJson<ListContentResult<ContentSummaryJson>>(url, { method: 'POST', body: payload });
    if (result.isErr()) {
        throw result.error;
    }

    return ContentSummary.fromJsonArray(result.value.contents);
}

export function fetchContentById(contentId: string, projectName?: string): ResultAsync<Content, AppError> {
    const url = `${getCmsApiUrl('', projectName)}?id=${encodeURIComponent(contentId)}`;

    return requestJson<ContentJson>(url).map(parseContent);
}

export function fetchNearestSite(contentId: ContentId): ResultAsync<Site | undefined, AppError> {
    const url = getCmsApiUrl('nearestSite');

    return requestOptionalJson<ContentJson>(url, {
        method: 'POST',
        body: { contentId: contentId.toString() },
    }).map((json) => (json ? (parseContent(json) as Site) : undefined));
}

export async function fetchContentSummaries(contentIds: ContentId[]): Promise<ContentSummary[]> {
    if (contentIds.length === 0) {
        return [];
    }

    try {
        return await resolveContentSummaries(contentIds);
    } catch (error) {
        console.error(error);
        return [];
    }
}
