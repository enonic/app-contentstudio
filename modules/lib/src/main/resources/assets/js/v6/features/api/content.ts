import {ResultAsync} from 'neverthrow';
import {type Content} from '../../../app/content/Content';
import {type ContentId} from '../../../app/content/ContentId';
import {type ContentJson} from '../../../app/content/ContentJson';
import {type Site} from '../../../app/content/Site';
import {ContentSummary} from '../../../app/content/ContentSummary';
import {type ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import {type ListContentResult} from '../../../app/resource/ListContentResult';
import {parseContent} from './details';
import {AppError} from './errors';
import {getCmsApiUrl} from '../utils/url/cms';

async function resolveContentSummaries(contentIds: ContentId[]): Promise<ContentSummary[]> {
    if (contentIds.length === 0) {
        return [];
    }

    const url = getCmsApiUrl('resolveByIds');

    const payload = {
        contentIds: contentIds.map(id => id.toString()),
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(response.statusText);
    }

    const json: ListContentResult<ContentSummaryJson> = await response.json();
    return ContentSummary.fromJsonArray(json.contents);
}

export function fetchContentById(contentId: string, projectName?: string): ResultAsync<Content, AppError> {
    const url = `${getCmsApiUrl('', projectName)}?id=${encodeURIComponent(contentId)}`;

    return ResultAsync.fromPromise(
        fetch(url).then(async (response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
            const json: ContentJson = await response.json();
            return parseContent(json);
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
}

export function fetchNearestSite(contentId: ContentId): ResultAsync<Site | undefined, AppError> {
    const url = getCmsApiUrl('nearestSite');

    return ResultAsync.fromPromise(
        fetch(url, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({contentId: contentId.toString()}),
        }).then(async (response) => {
            if (!response.ok) {
                throw new AppError(response.statusText);
            }
            if (response.status === 204) {
                return undefined;
            }
            const json: ContentJson | null = await response.json();
            if (!json) {
                return undefined;
            }
            return parseContent(json) as Site;
        }),
        (error): AppError => error instanceof AppError ? error : new AppError(String(error)),
    );
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
