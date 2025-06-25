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
    readonly cursor?: string;
    readonly onlineVersionId?: string;
    readonly hasMore: boolean;
    readonly expiresAt: number;
}

export type ContentVersionsLoadResult = {
    readonly versions: ContentVersion[];
    readonly hasMore: boolean;
    readonly cursor?: string;
    readonly onlineVersionId?: string;
}

// ============================================================================
// Cache Storage
// ============================================================================

const versionsCache = new Map<string, CachedVersionsEntry>();

// ============================================================================
// Cache Operations
// ============================================================================

const isExpired = (entry: CachedVersionsEntry): boolean => Date.now() > entry.expiresAt;

const INITIAL_CURSOR_CACHE_KEY = '__initial__';
const createCacheKey = (contentId: ContentId, cursor?: string): string =>
    `${contentId.toString()}::${cursor || INITIAL_CURSOR_CACHE_KEY}`;

export const getCachedVersions = (
    contentId: ContentId,
    cursor?: string,
): ContentVersionsLoadResult | undefined => {
    const key = createCacheKey(contentId, cursor);
    const cached = versionsCache.get(key);

    if (!cached) {
        return undefined;
    }

    if (isExpired(cached)) {
        versionsCache.delete(key);
        return undefined;
    }

    return {
        versions: cached.versions.slice(),
        hasMore: cached.hasMore,
        cursor: cached.cursor,
        onlineVersionId: cached.onlineVersionId,
    };
};

export const cacheVersions = (
    contentId: ContentId,
    requestCursor: string | undefined,
    result: ContentVersionsLoadResult,
): void => {
    const key = createCacheKey(contentId, requestCursor);
    const expiresAt = Date.now() + CACHE_TTL_MS;

    versionsCache.set(key, {
        versions: [...result.versions],
        cursor: result.cursor,
        onlineVersionId: result.onlineVersionId,
        hasMore: result.hasMore,
        expiresAt,
    });
};

export const clearVersionsCache = (contentId?: ContentId): void => {
    if (contentId) {
        const contentIdPrefix = `${contentId.toString()}::`;
        Array.from(versionsCache.keys())
            .filter((key) => key.startsWith(contentIdPrefix))
            .forEach((key) => versionsCache.delete(key));
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
