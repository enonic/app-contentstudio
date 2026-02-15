import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {PublishStatus} from '../../../app/publish/PublishStatus';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {clearContentCache, getContent, hasContent, setContent, getMissingIds} from '../store/content.store';
import {addTreeNodes, resetTree, setTreeRootIds, $treeState} from '../store/tree-list.store';
import {addFilterNodes, resetFilterTree, setFilterRootIds, $filterTreeState} from '../store/filter-tree.store';
import {
    clearChildrenIdsRetryCooldown,
    clearFilterChildrenIdsRetryCooldown,
    clearVisibleContentDataRetryCooldown,
    clearVisibleFilterContentDataRetryCooldown,
    deactivateFilter,
    fetchChildrenIdsOnly,
    fetchFilterChildrenIdsOnly,
    fetchVisibleContentData,
    fetchVisibleFilterContentData,
    fetchRootChildrenIdsOnly,
    isChildrenIdsLoadFailed,
    isFilterChildrenIdsLoadFailed,
    isVisibleContentDataLoadFailed,
    isVisibleFilterContentDataLoadFailed,
    resetChildrenIdsRetryState,
    resetFilterChildrenIdsRetryState,
    resetVisibleContentDataRetryState,
    resetVisibleFilterContentDataRetryState,
} from './content-fetcher';

const {mockFetchAndCompareStatus, mockFetchChildrenIds} = vi.hoisted(() => ({
    mockFetchAndCompareStatus: vi.fn(),
    mockFetchChildrenIds: vi.fn(),
}));

vi.mock('../../../app/resource/ContentSummaryAndCompareStatusFetcher', () => ({
    ContentSummaryAndCompareStatusFetcher: class {
        fetchAndCompareStatus = mockFetchAndCompareStatus;
        fetchChildren = vi.fn();
        fetchChildrenIds = mockFetchChildrenIds;
        createRootChildOrder = vi.fn(() => ({}));
        updateReadonlyAndCompareStatus = vi.fn((items) => Promise.resolve(items));
    },
}));

vi.mock('../utils/cms/content/workflow', () => ({
    calcWorkflowStateStatus: vi.fn(() => null),
}));

vi.mock('../utils/cms/content/prettify', () => ({
    resolveDisplayName: vi.fn((content) => content?.getDisplayName?.() ?? ''),
    resolveSubName: vi.fn((content) => content?.getName?.() ?? ''),
}));

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
        getName: () => displayName ?? `Name ${id}`,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getType: () => ({toString: () => 'base:folder'}) as unknown,
        getPublishStatus: () => PublishStatus.ONLINE,
        hasChildren: () => false,
        getContentSummary: () => ({
            getIconUrl: () => null,
            getName: () => displayName ?? `Name ${id}`,
            getDisplayName: () => displayName ?? `Content ${id}`,
        }),
    } as unknown as ContentSummaryAndCompareStatus;
}

describe('content-fetcher store integration', () => {
    beforeEach(() => {
        resetTree();
        resetFilterTree();
        clearContentCache();
        mockFetchAndCompareStatus.mockReset();
        mockFetchChildrenIds.mockReset();
        resetVisibleContentDataRetryState();
        resetVisibleFilterContentDataRetryState();
        resetChildrenIdsRetryState();
        resetFilterChildrenIdsRetryState();
        vi.useRealTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
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

    describe('visible content retry cooldown', () => {
        it('throttles immediate retries after main tree fetch failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{id: 'main-offline-1', data: null, parentId: null, hasChildren: false}]);
            setTreeRootIds(['main-offline-1']);

            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleContentData(['main-offline-1']);
            await fetchVisibleContentData(['main-offline-1']);

            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:00.999Z'));
            await fetchVisibleContentData(['main-offline-1']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-offline-1']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(2);
        });

        it('throttles immediate retries after filter tree fetch failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{id: 'filter-offline-1', data: null, parentId: null, hasChildren: false}]);
            setFilterRootIds(['filter-offline-1']);

            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleFilterContentData(['filter-offline-1']);
            await fetchVisibleFilterContentData(['filter-offline-1']);

            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-offline-1']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(2);
        });

        it('allows 3 attempts and marks main node as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{id: 'main-failed-3x', data: null, parentId: null, hasChildren: false}]);
            setTreeRootIds(['main-failed-3x']);
            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleContentData(['main-failed-3x']); // attempt 1
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-failed-3x']); // attempt 2
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleContentData(['main-failed-3x']); // attempt 3

            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(3);
            expect(isVisibleContentDataLoadFailed('main-failed-3x')).toBe(true);

            vi.setSystemTime(new Date('2026-02-14T00:00:03.003Z'));
            await fetchVisibleContentData(['main-failed-3x']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(3);
        });

        it('allows 3 attempts and marks filter node as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{id: 'filter-failed-3x', data: null, parentId: null, hasChildren: false}]);
            setFilterRootIds(['filter-failed-3x']);
            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleFilterContentData(['filter-failed-3x']); // attempt 1
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-failed-3x']); // attempt 2
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleFilterContentData(['filter-failed-3x']); // attempt 3

            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(3);
            expect(isVisibleFilterContentDataLoadFailed('filter-failed-3x')).toBe(true);
        });

        it('retry reset allows a new 3-attempt cycle', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{id: 'main-retry-cycle', data: null, parentId: null, hasChildren: false}]);
            setTreeRootIds(['main-retry-cycle']);
            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleContentData(['main-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleContentData(['main-retry-cycle']);
            expect(isVisibleContentDataLoadFailed('main-retry-cycle')).toBe(true);

            clearVisibleContentDataRetryCooldown(['main-retry-cycle']);
            expect(isVisibleContentDataLoadFailed('main-retry-cycle')).toBe(false);

            await fetchVisibleContentData(['main-retry-cycle']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(4);
        });

        it('filter retry reset allows immediate re-attempt', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{id: 'filter-retry-cycle', data: null, parentId: null, hasChildren: false}]);
            setFilterRootIds(['filter-retry-cycle']);
            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            expect(isVisibleFilterContentDataLoadFailed('filter-retry-cycle')).toBe(true);

            clearVisibleFilterContentDataRetryCooldown(['filter-retry-cycle']);
            expect(isVisibleFilterContentDataLoadFailed('filter-retry-cycle')).toBe(false);

            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(4);
        });

        it('adds cooldown only for unresolved IDs on partial response', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([
                {id: 'partial-a', data: null, parentId: null, hasChildren: false},
                {id: 'partial-b', data: null, parentId: null, hasChildren: false},
            ]);
            setTreeRootIds(['partial-a', 'partial-b']);

            mockFetchAndCompareStatus.mockImplementation((contentIds: {toString: () => string}[]) => {
                const ids = contentIds.map((id) => id.toString());
                if (ids.includes('partial-a') && ids.includes('partial-b')) {
                    return Promise.resolve([createMockContent('partial-a')]);
                }
                return Promise.resolve([createMockContent('partial-b')]);
            });

            await fetchVisibleContentData(['partial-a', 'partial-b']);
            expect($treeState.get().nodes.get('partial-a')?.data).not.toBeNull();
            expect($treeState.get().nodes.get('partial-b')?.data).toBeNull();

            await fetchVisibleContentData(['partial-a', 'partial-b']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['partial-a', 'partial-b']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(2);
            expect($treeState.get().nodes.get('partial-b')?.data).not.toBeNull();
        });

        it('does not request resolved IDs again in filter tree after success', async () => {
            addFilterNodes([{id: 'filter-success-1', data: null, parentId: null, hasChildren: false}]);
            setFilterRootIds(['filter-success-1']);
            mockFetchAndCompareStatus.mockResolvedValue([createMockContent('filter-success-1')]);

            await fetchVisibleFilterContentData(['filter-success-1']);
            expect($filterTreeState.get().nodes.get('filter-success-1')?.data).not.toBeNull();

            await fetchVisibleFilterContentData(['filter-success-1']);
            expect(mockFetchAndCompareStatus).toHaveBeenCalledTimes(1);
        });

        it('clears main retry-failure state on root reload', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{id: 'main-reset-on-root-load', data: null, parentId: null, hasChildren: false}]);
            setTreeRootIds(['main-reset-on-root-load']);
            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleContentData(['main-reset-on-root-load']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-reset-on-root-load']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleContentData(['main-reset-on-root-load']);
            expect(isVisibleContentDataLoadFailed('main-reset-on-root-load')).toBe(true);

            mockFetchChildrenIds.mockResolvedValue([{toString: () => 'new-root-id'}]);
            await fetchRootChildrenIdsOnly();

            expect(isVisibleContentDataLoadFailed('main-reset-on-root-load')).toBe(false);
        });

        it('clears filter retry-failure state when filter mode deactivates', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{id: 'filter-reset-on-deactivate', data: null, parentId: null, hasChildren: false}]);
            setFilterRootIds(['filter-reset-on-deactivate']);
            mockFetchAndCompareStatus.mockRejectedValue(new Error('offline'));

            await fetchVisibleFilterContentData(['filter-reset-on-deactivate']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-reset-on-deactivate']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleFilterContentData(['filter-reset-on-deactivate']);
            expect(isVisibleFilterContentDataLoadFailed('filter-reset-on-deactivate')).toBe(true);

            deactivateFilter();

            expect(isVisibleFilterContentDataLoadFailed('filter-reset-on-deactivate')).toBe(false);
        });
    });

    describe('children IDs retry cooldown', () => {
        it('allows 3 non-root attempts and marks main parent as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{id: 'parent-main-3x', data: null, parentId: null, hasChildren: true}]);
            setTreeRootIds(['parent-main-3x']);
            mockFetchChildrenIds.mockRejectedValue(new Error('offline'));

            await expect(fetchChildrenIdsOnly('parent-main-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).rejects.toThrow('offline');

            expect(mockFetchChildrenIds).toHaveBeenCalledTimes(3);
            expect(isChildrenIdsLoadFailed('parent-main-3x')).toBe(true);

            vi.setSystemTime(new Date('2026-02-14T00:00:03.003Z'));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).resolves.toEqual([]);
            expect(mockFetchChildrenIds).toHaveBeenCalledTimes(3);

            clearChildrenIdsRetryCooldown('parent-main-3x');
            mockFetchChildrenIds.mockResolvedValue([{toString: () => 'child-main-ok'}]);
            await expect(fetchChildrenIdsOnly('parent-main-3x')).resolves.toEqual(['child-main-ok']);
            expect(isChildrenIdsLoadFailed('parent-main-3x')).toBe(false);
        });

        it('allows 3 non-root attempts and marks filter parent as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{id: 'parent-filter-3x', data: null, parentId: null, hasChildren: true}]);
            setFilterRootIds(['parent-filter-3x']);
            mockFetchChildrenIds.mockRejectedValue(new Error('offline'));

            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).rejects.toThrow('offline');

            expect(mockFetchChildrenIds).toHaveBeenCalledTimes(3);
            expect(isFilterChildrenIdsLoadFailed('parent-filter-3x')).toBe(true);

            vi.setSystemTime(new Date('2026-02-14T00:00:03.003Z'));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).resolves.toEqual([]);
            expect(mockFetchChildrenIds).toHaveBeenCalledTimes(3);

            clearFilterChildrenIdsRetryCooldown('parent-filter-3x');
            mockFetchChildrenIds.mockResolvedValue([{toString: () => 'child-filter-ok'}]);
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).resolves.toEqual(['child-filter-ok']);
            expect(isFilterChildrenIdsLoadFailed('parent-filter-3x')).toBe(false);
        });
    });
});
