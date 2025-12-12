import {ContentId} from '../../../../../app/content/ContentId';
import {ContentVersion} from '../../../../../app/ContentVersion';

// TODO: Implement cache invalidation strategy (Server-side events, TTL, etc.)

type CachedVersionsEntry = {
    versions: ContentVersion[];
    totalHits: number;
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
    const cached = versionsCache.get(contentId.toString());

    if (!cached || from >= cached.versions.length) {
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
    const cacheKey = contentId.toString();
    const cached = versionsCache.get(cacheKey);

    if (!cached) {
        versionsCache.set(cacheKey, {
            versions: versions.slice(),
            totalHits,
        });
        return;
    }

    const mergedVersions = cached.versions.slice();

    versions.forEach((version, index) => {
        mergedVersions[from + index] = version;
    });

    versionsCache.set(cacheKey, {
        versions: mergedVersions,
        totalHits,
    });
};

export const clearVersionsCache = (contentId?: ContentId): void => {
    if (contentId) {
        versionsCache.delete(contentId.toString());
        return;
    }

    versionsCache.clear();
};
