import {map} from 'nanostores';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {
    $contentUpdated,
    $contentCreated,
    $contentDeleted,
    $contentRenamed,
    $contentArchived,
    $contentPublished,
    $contentUnpublished,
    $contentDuplicated,
    $contentMoved,
    $contentSorted,
    $contentPermissionsUpdated,
} from './socket.store';

//
// * Types
//

type ContentCacheState = Record<string, ContentSummaryAndCompareStatus>;

//
// * Store
//

/** Global content cache - stores all loaded content by ID */
export const $contentCache = map<ContentCacheState>({});

//
// * Actions
//

export function setContent(content: ContentSummaryAndCompareStatus): void {
    $contentCache.setKey(content.getId(), content);
}

/**
 * Adds or updates multiple content items in the cache.
 * More efficient than calling setContent multiple times.
 */
export function setContents(contents: ContentSummaryAndCompareStatus[]): void {
    if (contents.length === 0) return;

    const current = $contentCache.get();
    const updates: ContentCacheState = {...current};

    for (const content of contents) {
        updates[content.getId()] = content;
    }

    $contentCache.set(updates);
}

export function removeContent(id: string): void {
    const current = $contentCache.get();
    if (!(id in current)) return;

    const {[id]: _, ...rest} = current;
    $contentCache.set(rest);
}

export function removeContents(ids: string[]): void {
    if (ids.length === 0) return;

    const current = $contentCache.get();
    const idsSet = new Set(ids);
    const filtered = Object.fromEntries(Object.entries(current).filter(([id]) => !idsSet.has(id)));
    $contentCache.set(filtered);
}

export function clearContentCache(): void {
    $contentCache.set({});
}

//
// * Selectors (synchronous lookups)
//

/**
 * Gets content by ID from cache (synchronous).
 * Returns undefined if not in cache.
 */
export function getContent(id: string): ContentSummaryAndCompareStatus | undefined {
    return $contentCache.get()[id];
}

/**
 * Gets multiple content items by IDs from cache (synchronous).
 * Missing items are not included in the result.
 */
export function getContents(ids: string[]): ContentSummaryAndCompareStatus[] {
    const cache = $contentCache.get();
    return ids.map((id) => cache[id]).filter(Boolean);
}

export function hasContent(id: string): boolean {
    return id in $contentCache.get();
}

/**
 * Gets IDs that are missing from the cache.
 */
export function getMissingIds(ids: string[]): string[] {
    const cache = $contentCache.get();
    return ids.filter((id) => !(id in cache));
}

/**
 * Gets all content IDs currently in cache.
 */
export function getAllContentIds(): string[] {
    return Object.keys($contentCache.get());
}

//
// * Self-initializing Socket Subscriptions
//
// These subscriptions run at module load and persist for the application lifetime.
// They are NOT cleaned up because:
// 1. The content store is a global singleton
// 2. The app requires real-time updates throughout its lifecycle
// 3. Cleanup would break functionality when re-entering the content browser
//

// Content updated - update cache with new data
$contentUpdated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// Content created - add to cache
$contentCreated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// Content deleted - remove from cache
$contentDeleted.subscribe((event) => {
    if (event?.data) {
        const ids = event.data.map((item) => item.getContentId().toString());
        removeContents(ids);
    }
});

// Content renamed - update cache with new data
$contentRenamed.subscribe((event) => {
    if (event?.data?.items) {
        setContents(event.data.items);
    }
});

// Content archived - remove from cache
$contentArchived.subscribe((event) => {
    if (event?.data) {
        const ids = event.data.map((item) => item.getContentId().toString());
        removeContents(ids);
    }
});

// Content published - update cache
$contentPublished.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// Content unpublished - update cache
$contentUnpublished.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// Content duplicated - add to cache
$contentDuplicated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// Content permissions updated - update cache
$contentPermissionsUpdated.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

// Content moved - no action needed here.
// Move operation triggers both delete (from old location) and create (at new location) events,
// which are handled by their respective subscriptions above.
$contentMoved.subscribe(() => {
    // Intentionally empty - handled by delete + create events
});

// Content sorted - update cache with new order data
$contentSorted.subscribe((event) => {
    if (event?.data) {
        setContents(event.data);
    }
});

/**
 * @deprecated Socket subscriptions are now self-initializing at module load.
 * This function is kept for backwards compatibility but does nothing.
 */
export function subscribeToContentEvents(): () => void {
    // No-op - subscriptions are now self-initializing
    return () => {
        // No-op
    };
}
