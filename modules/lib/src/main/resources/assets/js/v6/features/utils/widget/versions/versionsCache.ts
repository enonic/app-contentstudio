import {ContentId} from '../../../../../app/content/ContentId';
import {ContentSummaryAndCompareStatus} from '../../../../../app/content/ContentSummaryAndCompareStatus';
import {ContentVersion} from '../../../../../app/ContentVersion';
import {ContentServerChangeItem} from '../../../../../app/event/ContentServerChangeItem';
import {ContentServerEventsHandler} from '../../../../../app/event/ContentServerEventsHandler';

// ============================================================================
// Constants
// ============================================================================

/** TTL for cache entries in milliseconds */
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

// ============================================================================
// Types
// ============================================================================

type CachedVersionsEntry = {
    readonly versions: ContentVersion[];
    readonly totalHits: number;
    readonly expiresAt: number;
}

export type ContentVersionsLoadResult = {
    readonly versions: ContentVersion[];
    readonly hasMore: boolean;
}

// ============================================================================
// Cache Storage
// ============================================================================

const versionsCache = new Map<string, CachedVersionsEntry>();

// ============================================================================
// Cache Operations
// ============================================================================

const isExpired = (entry: CachedVersionsEntry): boolean => Date.now() > entry.expiresAt;

const createCacheKey = (contentId: ContentId): string => contentId.toString();

export const getCachedVersions = (
    contentId: ContentId,
    from: number,
    size: number,
): ContentVersionsLoadResult | undefined => {
    const key = createCacheKey(contentId);
    const cached = versionsCache.get(key);

    if (!cached) {
        return undefined;
    }

    if (isExpired(cached)) {
        versionsCache.delete(key);
        return undefined;
    }

    if (from >= cached.versions.length) {
        return undefined;
    }

    const versions = cached.versions.slice(from, from + size);
    const hasMore = (from + versions.length) < cached.totalHits;

    return {versions, hasMore};
};

export const cacheVersions = (
    contentId: ContentId,
    from: number,
    versions: ContentVersion[],
    totalHits: number,
): void => {
    const key = createCacheKey(contentId);
    const cached = versionsCache.get(key);
    const expiresAt = Date.now() + CACHE_TTL_MS;

    // Create new cache entry if none exists or current is expired
    if (!cached || isExpired(cached)) {
        versionsCache.set(key, {
            versions: [...versions],
            totalHits,
            expiresAt,
        });
        return;
    }

    // Merge new versions into existing cache
    const mergedVersions = [...cached.versions];
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
        versionsCache.delete(createCacheKey(contentId));
    } else {
        versionsCache.clear();
    }
};

// ============================================================================
// Event Handlers
// ============================================================================

const handleContentSummaryChange = (items: ContentSummaryAndCompareStatus[]): void => {
    items.forEach((item) => clearVersionsCache(item.getContentId()));
};

const handleContentMoved = (items: { item: ContentSummaryAndCompareStatus }[]): void => {
    items.forEach((item) => clearVersionsCache(item.item.getContentId()));
};

const handleContentDeleted = (items: ContentServerChangeItem[]): void => {
    items.forEach((item) => clearVersionsCache(item.getContentId()));
};

// ============================================================================
// Event Registration
// ============================================================================

const registerCacheInvalidationHandlers = (): void => {
    const eventsHandler = ContentServerEventsHandler.getInstance();

    // Content changes that create new versions
    eventsHandler.onContentUpdated(handleContentSummaryChange);
    eventsHandler.onContentPermissionsUpdated(handleContentSummaryChange);
    eventsHandler.onContentPublished(handleContentSummaryChange);
    eventsHandler.onContentUnpublished(handleContentSummaryChange);
    eventsHandler.onContentRenamed(handleContentSummaryChange);

    // Content moved
    eventsHandler.onContentMoved(handleContentMoved);

    // Content removed
    eventsHandler.onContentDeleted(handleContentDeleted);
    eventsHandler.onContentArchived(handleContentDeleted);
};

// Initialize event handlers
registerCacheInvalidationHandlers();
