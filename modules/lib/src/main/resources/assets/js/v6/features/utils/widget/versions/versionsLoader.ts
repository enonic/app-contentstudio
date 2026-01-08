import {ContentId} from '../../../../../app/content/ContentId';
import {GetContentVersionsRequest} from '../../../../../app/resource/GetContentVersionsRequest';
import type {ContentVersionsLoadResult} from './versionsCache';
import {cacheVersions, getCachedVersions} from './versionsCache';

const BATCH_SIZE = 10;

export const loadContentVersions = async (contentId: ContentId, from: number = 0): Promise<ContentVersionsLoadResult> => {
    const cached = getCachedVersions(contentId, from, BATCH_SIZE);

    if (cached) {
        return cached;
    }

    const response = await new GetContentVersionsRequest(contentId)
        .setFrom(from)
        .setSize(BATCH_SIZE) // 10 to display fetching process clearly
        .sendAndParse();

    const metadata = response.getMetadata();
    const versions = response.getContentVersions();

    cacheVersions(contentId, from, versions, metadata.totalHits);

    return {
        versions,
        hasMore: (from + metadata.hits) < metadata.totalHits,
    };
};
