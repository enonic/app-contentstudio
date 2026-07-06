import { type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { type ContentJson } from '../../../../app/content/ContentJson';
import { RepositoryId } from '../../../../app/repository/RepositoryId';
import { GetContentVersionsResult } from '../../../../app/resource/GetContentVersionsResult';
import { type ContentVersionJson } from '../../../../app/resource/json/ContentVersionJson';
import { type GetContentVersionsForViewResultsJson } from '../../../../app/resource/json/GetContentVersionsForViewResultsJson';
import { requestJson } from '../../../shared/api/client';
import { type AppError } from '../../../shared/api/errors';
import { $config } from '../../../shared/config/config.store';
import { getCmsApiUrl } from '../../../shared/lib/url/cms';

export function fetchVersion(contentId: string, versionId: string): ResultAsync<ContentJson, Error> {
    return requestJson<ContentJson>(getContentServiceUrl(contentId, versionId)).map(stripContentMetadata);
}

function stripContentMetadata(contentJson: ContentJson): ContentJson {
    const cleaned = { ...contentJson };
    [
        '_id',
        'creator',
        'createdTime',
        'hasChildren',
        'modifiedTime',
        'validationErrors',
        'publish',
        'workflow',
        'valid',
        'originProject',
        'type',
        'owner',
        'modifier',
    ].forEach((key) => {
        delete cleaned[key];
    });
    return cleaned;
}

/**
 * Build a content service URL for fetching a specific version.
 * @param contentId - Content ID
 * @param versionId - Version ID
 */
function getContentServiceUrl(contentId: string, versionId: string): string {
    const baseUrl = $config.get().services.contentUrl;
    const params = new URLSearchParams({
        contentId,
        versionId,
        repositoryId: RepositoryId.fromCurrentProject().toString(),
    });
    return `${baseUrl}?${params.toString()}`;
}

export function revert(contentId: ContentId, versionId: string): ResultAsync<string, Error> {
    const url = getCmsApiUrl('revert');
    const payload = {
        versionId,
        contentId: contentId.toString(),
    };

    return requestJson<ContentVersionJson>(url, { method: 'POST', body: payload }).map((json) => json.id);
}

export type FetchContentVersionsParams = {
    contentId: ContentId;
    size?: number;
    cursor?: string;
};

/**
 * Fetch a page of content versions. Omitting `size` requests the unbounded set
 * (`-1`); `cursor` is only sent when set.
 * Used by: entities/content/version versionsLoader.
 */
export function fetchContentVersions(
    params: FetchContentVersionsParams,
): ResultAsync<GetContentVersionsResult, AppError> {
    const { contentId, size, cursor } = params;

    const body: { contentId: string; size: number; cursor?: string } = {
        contentId: contentId.toString(),
        size: size || -1,
    };

    if (cursor) {
        body.cursor = cursor;
    }

    return requestJson<GetContentVersionsForViewResultsJson>(getCmsApiUrl('getVersions'), {
        method: 'POST',
        body,
    }).map(GetContentVersionsResult.fromJson);
}
