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

/**
 * Adds or updates a single content item in the cache.
 */
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

/**
 * Removes a content item from the cache.
 */
export function removeContent(id: string): void {
    const current = $contentCache.get();
    if (!(id in current)) return;

    const {[id]: _, ...rest} = current;
    $contentCache.set(rest);
}

/**
 * Removes multiple content items from the cache.
 */
export function removeContents(ids: string[]): void {
    if (ids.length === 0) return;

    const current = $contentCache.get();
    const idsSet = new Set(ids);
    const filtered = Object.fromEntries(Object.entries(current).filter(([id]) => !idsSet.has(id)));
    $contentCache.set(filtered);
}

/**
 * Clears the entire content cache.
 */
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

/**
 * Checks if content exists in cache.
 */
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
// * Socket Subscriptions
//

let unsubscribers: (() => void)[] = [];

/**
 * Subscribes to all content-related socket events.
 * Call this once during app initialization.
 * Returns unsubscribe function.
 */
export function subscribeToContentEvents(): () => void {
    // Prevent double subscription
    if (unsubscribers.length > 0) {
        return () => unsubscribeFromContentEvents();
    }

    // Content updated - update cache with new data
    unsubscribers.push(
        $contentUpdated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        })
    );

    // Content created - add to cache
    unsubscribers.push(
        $contentCreated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        })
    );

    // Content deleted - remove from cache
    unsubscribers.push(
        $contentDeleted.subscribe((event) => {
            if (event?.data) {
                const ids = event.data.map((item) => item.getContentId().toString());
                removeContents(ids);
            }
        })
    );

    // Content renamed - update cache with new data
    unsubscribers.push(
        $contentRenamed.subscribe((event) => {
            if (event?.data?.items) {
                setContents(event.data.items);
            }
        })
    );

    // Content archived - remove from cache
    unsubscribers.push(
        $contentArchived.subscribe((event) => {
            if (event?.data) {
                const ids = event.data.map((item) => item.getContentId().toString());
                removeContents(ids);
            }
        })
    );

    // Content published - update cache
    unsubscribers.push(
        $contentPublished.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        })
    );

    // Content unpublished - update cache
    unsubscribers.push(
        $contentUnpublished.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        })
    );

    // Content duplicated - add to cache
    unsubscribers.push(
        $contentDuplicated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        })
    );

    // Content permissions updated - update cache
    unsubscribers.push(
        $contentPermissionsUpdated.subscribe((event) => {
            if (event?.data) {
                setContents(event.data);
            }
        })
    );

    return () => unsubscribeFromContentEvents();
}

/**
 * Unsubscribes from all content socket events.
 */
export function unsubscribeFromContentEvents(): void {
    unsubscribers.forEach((unsub) => unsub());
    unsubscribers = [];
}
