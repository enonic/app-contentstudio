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

    const request = new GetContentVersionsRequest(contentId).setSize(BATCH_SIZE);

    if (cursor) {
        request.setCursor(cursor);
    }

    const response = await request.sendAndParse();

    const nextCursor = response.getCursor() ?? undefined;
    const versions = response.getContentVersions();
    const onlineVersionId = response.getOnlineVersionId();
    const result = {
        versions,
        hasMore: nextCursor !== undefined,
        cursor: nextCursor,
        onlineVersionId,
    };

    cacheVersions(contentId, cursor, result);

    return result;
};
