import {describe, it, expect, beforeEach} from 'vitest';
import {PublishStatus} from '../../../app/publish/PublishStatus';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {clearContentCache, getContent, hasContent, setContent, getMissingIds} from '../store/content.store';
import {resetTree} from '../store/tree-list.store';

/**
 * Integration tests for content-fetcher store interactions.
 *
 * Note: The actual API calls are not tested here because they require
 * mocking the legacy ContentSummaryAndCompareStatusFetcher class which
 * uses Q.Promise and has complex dependencies.
 *
 * These tests verify the cache-first logic and store integration patterns
 * that content-fetcher.ts uses.
 */

// Create mock content factory
function createMockContent(id: string, displayName?: string): ContentSummaryAndCompareStatus {
    return {
        getId: () => id,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getType: () => ({toString: () => 'base:folder'}) as unknown,
        getPublishStatus: () => PublishStatus.ONLINE,
        hasChildren: () => false,
        getContentSummary: () => ({
            getIconUrl: () => null,
        }),
    } as ContentSummaryAndCompareStatus;
}

describe('content-fetcher store integration', () => {
    beforeEach(() => {
        resetTree();
        clearContentCache();
    });

    describe('cache-first logic', () => {
        it('getMissingIds returns IDs not in cache', () => {
            setContent(createMockContent('1'));
            setContent(createMockContent('2'));

            const missing = getMissingIds(['1', '2', '3', '4']);

            expect(missing).toEqual(['3', '4']);
        });

        it('getMissingIds returns all IDs when cache is empty', () => {
            const missing = getMissingIds(['1', '2', '3']);

            expect(missing).toEqual(['1', '2', '3']);
        });

        it('getMissingIds returns empty when all cached', () => {
            setContent(createMockContent('1'));
            setContent(createMockContent('2'));

            const missing = getMissingIds(['1', '2']);

            expect(missing).toEqual([]);
        });

        it('hasContent checks cache correctly', () => {
            setContent(createMockContent('1'));

            expect(hasContent('1')).toBe(true);
            expect(hasContent('2')).toBe(false);
        });

        it('getContent returns cached content', () => {
            const content = createMockContent('1', 'Test Content');
            setContent(content);

            const cached = getContent('1');

            expect(cached?.getDisplayName()).toBe('Test Content');
        });

        it('getContent returns undefined for non-cached', () => {
            expect(getContent('non-existent')).toBeUndefined();
        });
    });

    describe('cache updates', () => {
        it('setContent adds new content to cache', () => {
            const content = createMockContent('1', 'New Content');

            setContent(content);

            expect(hasContent('1')).toBe(true);
            expect(getContent('1')?.getDisplayName()).toBe('New Content');
        });

        it('setContent updates existing content', () => {
            setContent(createMockContent('1', 'Original'));
            setContent(createMockContent('1', 'Updated'));

            expect(getContent('1')?.getDisplayName()).toBe('Updated');
        });

        it('clearContentCache removes all content', () => {
            setContent(createMockContent('1'));
            setContent(createMockContent('2'));

            clearContentCache();

            expect(hasContent('1')).toBe(false);
            expect(hasContent('2')).toBe(false);
        });
    });

    describe('batch operations', () => {
        it('handles multiple content IDs efficiently', () => {
            // Pre-populate cache with some content
            for (let i = 1; i <= 5; i++) {
                setContent(createMockContent(String(i)));
            }

            // Request mix of cached and uncached IDs
            const requested = ['1', '2', '6', '7', '3', '8'];
            const missing = getMissingIds(requested);

            // Only uncached IDs should be in missing
            expect(missing).toEqual(['6', '7', '8']);
        });

        it('getMissingIds preserves order', () => {
            setContent(createMockContent('2'));

            const missing = getMissingIds(['1', '2', '3', '4']);

            expect(missing).toEqual(['1', '3', '4']);
        });
    });
});
