import {ResultAsync} from 'neverthrow';
import {type Content} from '../../../app/content/Content';
import {type ContentId} from '../../../app/content/ContentId';
import {type ContentJson} from '../../../app/content/ContentJson';
import {type Site} from '../../../app/content/Site';
import {CompareStatus} from '../../../app/content/CompareStatus';
import {ContentSummary} from '../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {type ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import {PublishStatus} from '../../../app/publish/PublishStatus';
import {type CompareContentResultJson} from '../../../app/resource/json/CompareContentResultJson';
import {type ListContentResult} from '../../../app/resource/ListContentResult';
import {parseContent} from './details';
import {AppError} from './errors';
import {getCmsApiUrl} from '../utils/url/cms';

type CompareContentResultsJson = {
    compareContentResults: CompareContentResultJson[];
};

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

async function compareContent(contentIds: string[]): Promise<Map<string, {compareStatus: CompareStatus; publishStatus: PublishStatus}>> {
    if (contentIds.length === 0) {
        return new Map();
    }

    const url = getCmsApiUrl('compare');

    const payload = {
        ids: contentIds,
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

    const json: CompareContentResultsJson = await response.json();

    const resultMap = new Map<string, {compareStatus: CompareStatus; publishStatus: PublishStatus}>();
    for (const result of json.compareContentResults) {
        resultMap.set(result.id, {
            compareStatus: CompareStatus[result.compareStatus] as CompareStatus,
            publishStatus: PublishStatus[result.publishStatus] as PublishStatus,
        });
    }

    return resultMap;
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

export async function fetchContentSummariesWithStatus(contentIds: ContentId[]): Promise<ContentSummaryAndCompareStatus[]> {
    if (contentIds.length === 0) {
        return [];
    }

    try {
        const summaries = await resolveContentSummaries(contentIds);

        if (summaries.length === 0) {
            return [];
        }

        const ids = summaries.map(summary => summary.getContentId().toString());
        const compareResults = await compareContent(ids);

        return summaries.map(summary => {
            const result = compareResults.get(summary.getId());
            if (result) {
                return ContentSummaryAndCompareStatus.fromContentAndCompareAndPublishStatus(
                    summary,
                    result.compareStatus,
                    result.publishStatus,
                );
            }
            return ContentSummaryAndCompareStatus.fromContentSummary(summary);
        });
    } catch (error) {
        console.error(error);
        return [];
    }
}
