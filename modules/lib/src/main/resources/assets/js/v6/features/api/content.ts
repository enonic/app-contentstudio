import {ContentId} from '../../../app/content/ContentId';
import {CompareStatus} from '../../../app/content/CompareStatus';
import {ContentSummary} from '../../../app/content/ContentSummary';
import {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import {PublishStatus} from '../../../app/publish/PublishStatus';
import {CompareContentResultJson} from '../../../app/resource/json/CompareContentResultJson';
import {ListContentResult} from '../../../app/resource/ListContentResult';
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
