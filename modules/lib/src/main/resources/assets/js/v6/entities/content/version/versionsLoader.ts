import { okAsync, type ResultAsync } from 'neverthrow';
import { type ContentId } from '../../../../app/content/ContentId';
import { type AppError } from '../../../shared/api/errors';
import { fetchContentVersions } from '../api/versions.api';
import type { ContentVersionsLoadResult } from '../../../shared/lib/widget/versions/versionsCache';
import { cacheVersions, getCachedVersions } from '../../../shared/lib/widget/versions/versionsCache';

const BATCH_SIZE = 10;

/** Used by: widgets/context-panel/widget/versions (via VersionsConfig). */
export function loadContentVersions(
    contentId: ContentId,
    cursor?: string,
): ResultAsync<ContentVersionsLoadResult, AppError> {
    const cached = getCachedVersions(contentId, cursor);

    if (cached) {
        return okAsync(cached);
    }

    return fetchContentVersions({ contentId, size: BATCH_SIZE, cursor }).map((response) => {
        const nextCursor = response.getCursor() ?? undefined;
        const loadResult = {
            versions: response.getContentVersions(),
            hasMore: nextCursor !== undefined,
            cursor: nextCursor,
            onlineVersionId: response.getOnlineVersionId(),
        };

        cacheVersions(contentId, cursor, loadResult);

        return loadResult;
    });
}
