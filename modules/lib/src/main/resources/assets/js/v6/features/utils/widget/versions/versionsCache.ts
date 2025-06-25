import {ContentId} from '../../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../../app/ContentVersion';
import {ContentServerChangeItem} from '../../../../../app/event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../../../../../app/event/ContentServerEventsHandler';

// TTL for cache entries (ms)
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

type CachedVersionsEntry = {
    versions: ContentVersion[];
    totalHits: number;
    expiresAt: number;
};

const versionsCache = new Map<string, CachedVersionsEntry>();

export type ContentVersionsLoadResult = {
    versions: ContentVersion[];
    hasMore: boolean;
};

export const getCachedVersions = (
    contentId: ContentId,
    from: number,
    size: number,
): ContentVersionsLoadResult | undefined => {
    const key = contentId.toString();
    const cached = versionsCache.get(key);

    if (!cached) {
        return undefined;
    }

    if (Date.now() > cached.expiresAt) {
        versionsCache.delete(key);
        return undefined;
    }

    if (from >= cached.versions.length) {
        return undefined;
    }

    const versions = cached.versions.slice(from, from + size);
    const hasMore = (from + versions.length) < cached.totalHits;

    return {
        versions,
        hasMore,
    };
};

export const cacheVersions = (
    contentId: ContentId,
    from: number,
    versions: ContentVersion[],
    totalHits: number,
): void => {
    const key = contentId.toString();
    const cached = versionsCache.get(key);
    const expiresAt = Date.now() + CACHE_TTL_MS;

    if (!cached || Date.now() > cached.expiresAt) {
        versionsCache.set(key, {
            versions: versions.slice(),
            totalHits,
            expiresAt,
        });
        return;
    }

    const mergedVersions = cached.versions.slice();

    versions.forEach((version, index) => {
        mergedVersions[from + index] = version;
    });

    versionsCache.set(key, {
        versions: mergedVersions,
        totalHits,
        expiresAt,
    });
};

export const clearVersionsCache = (contentId?: ContentId): void => {
    if (contentId) {
        versionsCache.delete(contentId.toString());
        return;
    }

    versionsCache.clear();
};

const contentSummaryCacheHandler = (items: ContentSummaryAndCompareStatus[]) => {
    items.forEach((item) => {
        clearVersionsCache(item.getContentId());
    });
};

ContentServerEventsHandler.getInstance().onContentUpdated(contentSummaryCacheHandler);
ContentServerEventsHandler.getInstance().onContentPermissionsUpdated(contentSummaryCacheHandler);
ContentServerEventsHandler.getInstance().onContentPublished(contentSummaryCacheHandler);
ContentServerEventsHandler.getInstance().onContentUnpublished(contentSummaryCacheHandler);
ContentServerEventsHandler.getInstance().onContentRenamed(contentSummaryCacheHandler);


ContentServerEventsHandler.getInstance().onContentMoved((items) => {
    items.forEach((item) => {
        clearVersionsCache(item.item.getContentId());
    });
});

const deleteCacheHandler = (items: ContentServerChangeItem[]) => {
    items.forEach((item) => {
        clearVersionsCache(item.getContentId());
    });
};

ContentServerEventsHandler.getInstance().onContentDeleted(deleteCacheHandler);
ContentServerEventsHandler.getInstance().onContentArchived(deleteCacheHandler);

