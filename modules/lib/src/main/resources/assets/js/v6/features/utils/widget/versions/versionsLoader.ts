import {ContentId} from '../../../../../app/content/ContentId';
import {GetContentVersionsRequest} from '../../../../../app/resource/GetContentVersionsRequest';
import type {ContentVersionsLoadResult} from './versionsCache';
import {cacheVersions, getCachedVersions} from './versionsCache';

const BATCH_SIZE = 10;

export const loadContentVersions = async (contentId: ContentId, cursor?: string): Promise<ContentVersionsLoadResult> => {
    const cached = getCachedVersions(contentId, cursor);

    if (cached) {
        return cached;
    }

    const request = new GetContentVersionsRequest(contentId).setSize(BATCH_SIZE); // 10 to display fetching process clearly

    if (cursor) {
        request.setCursor(cursor);
    }

    const response = await request.sendAndParse();

    const metadata = response.getMetadata();
    const versions = response.getContentVersions();
    const result = {
        versions,
        hasMore: metadata.cursor !== undefined,
        cursor: metadata.cursor,
    };

    cacheVersions(contentId, cursor, result);

    return result;
};
