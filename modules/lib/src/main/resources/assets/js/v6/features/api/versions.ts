import {CONFIG} from '@enonic/lib-admin-ui/util/Config';
import {ResultAsync} from 'neverthrow';
import {ContentId} from '../../../app/content/ContentId';
import {ContentJson} from '../../../app/content/ContentJson';
import {RepositoryId} from '../../../app/repository/RepositoryId';
import {ContentVersionJson} from '../../../app/resource/json/ContentVersionJson';
import {getCmsApiUrl} from '../utils/url/cms';

export function fetchVersion(contentId: string, versionId: string): ResultAsync<ContentJson, Error> {
    const url = getContentServiceUrl(contentId, versionId);

    return ResultAsync.fromPromise(
        fetch(url).then(async (response) => {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText || 'Request failed'}`);
            }
            const json = await response.json();
            return json as ContentJson;
        }),
        (error) => error instanceof Error ? error : new Error(String(error))
    ).map(stripContentMetadata);
}

function stripContentMetadata(contentJson: ContentJson): ContentJson {
    const cleaned = {...contentJson};
    ['_id', 'creator', 'createdTime', 'hasChildren'].forEach((key) => {
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
    const baseUrl = CONFIG.getString('services.contentUrl');
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

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        }).then(async (response) => {
            if (!response.ok) {
                throw new Error(`${response.status} ${response.statusText || 'Request failed'}`);
            }
            const json: ContentVersionJson = await response.json();
            return json.id;
        }),
        (error) => error instanceof Error ? error : new Error(String(error))
    );
}
