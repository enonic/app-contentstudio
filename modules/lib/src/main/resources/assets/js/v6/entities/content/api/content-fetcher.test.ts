import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { errAsync, okAsync, ResultAsync } from 'neverthrow';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import { AppError } from '../../../shared/api/errors';
import { Branch } from '../../../../app/versioning/Branch';
import type { ContentQuery } from '../../../../app/content/ContentQuery';
import { getContent, hasContent, getMissingIds } from '../model/content.store';
import { clearAllContentCaches, clearProjectContentCache, setContent } from '../model/content.commands';
import { $activeProject } from '../../project/activeProject.store';
import type { Project } from '../../../../app/settings/data/project/Project';
import {
    addTreeNodes,
    hasTreeNode,
    resetTree,
    setTreeChildren,
    setTreeRootIds,
    $treeState,
} from '../model/content-tree.store';
import { emitContentSorted } from '../../../shared/socket/socket.store';
import { start as startContentService } from '../model/content.service';
import { addFilterNodes, resetFilterTree, setFilterRootIds, $filterTreeState } from '../model/filter-tree.store';
import {
    clearChildrenIdsRetryCooldown,
    clearFilterChildrenIdsRetryCooldown,
    clearVisibleContentDataRetryCooldown,
    clearVisibleFilterContentDataRetryCooldown,
    activateFilter,
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

const { mockResolveContentSummaries, mockFetchReadOnlyContentIds, mockListContentIdsByParent, mockOtherQueryApi } =
    vi.hoisted(() => ({
        mockResolveContentSummaries: vi.fn(),
        mockFetchReadOnlyContentIds: vi.fn(),
        mockListContentIdsByParent: vi.fn(),
        mockOtherQueryApi: vi.fn(),
    }));

vi.mock('./content.api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./content.api')>()),
    resolveContentSummaries: mockResolveContentSummaries,
}));

vi.mock('./contentQuery.api', () => ({
    listContentByParent: mockOtherQueryApi,
    queryContent: mockOtherQueryApi,
    fetchReadOnlyContentIds: mockFetchReadOnlyContentIds,
    listContentIdsByParent: mockListContentIdsByParent,
}));

vi.mock('../../../shared/lib/cms/content/workflow', () => ({
    calcContentState: vi.fn(() => null),
}));

vi.mock('../../../shared/lib/cms/content/status', () => ({
    calcTreePublishStatus: vi.fn(() => null),
}));

vi.mock('../../../shared/lib/cms/content/prettify', () => ({
    resolveDisplayName: vi.fn((content) => content?.getDisplayName?.() ?? ''),
    resolveSubName: vi.fn((content) => content?.getName?.() ?? ''),
}));

/**
 * Integration tests for content-fetcher store interactions.
 *
 * The api layer (contentQuery.api / content.api) is mocked with Result-returning
 * fns, so these tests focus on the cache-first logic, retry/backoff cooldowns,
 * project-switch race gating, and store integration that content-fetcher.ts owns.
 * The api URLs/payloads are pinned in contentQuery.api.test.ts.
 */

// Create mock content factory
function createMockContent(id: string, displayName?: string): ContentSummary {
    return {
        getId: () => id,
        getContentId: () => ({ toString: () => id }),
        getName: () => displayName ?? `Name ${id}`,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getType: () => ({ toString: () => 'base:folder' }) as unknown,
        getIconUrl: () => null,
        hasChildren: () => false,
        setReadOnly: () => undefined,
    } as unknown as ContentSummary;
}

function createMockQuery(query = 'query'): ContentQuery {
    return {
        getContentTypes: () => [],
        getMustBeReferencedById: () => null,
        getQueryFilters: () => [],
        getQuerySort: () => null,
        getQuery: () => query,
    } as unknown as ContentQuery;
}

describe('content-fetcher store integration', () => {
    beforeEach(() => {
        startContentService();
        $activeProject.set({ getName: () => 'default' } as unknown as Project);
        resetTree();
        resetFilterTree();
        clearAllContentCaches();
        mockResolveContentSummaries.mockReset();
        mockFetchReadOnlyContentIds.mockReset().mockReturnValue(okAsync([]));
        mockListContentIdsByParent.mockReset();
        mockOtherQueryApi.mockReset();
        resetVisibleContentDataRetryState();
        resetVisibleFilterContentDataRetryState();
        resetChildrenIdsRetryState();
        resetFilterChildrenIdsRetryState();
        vi.useRealTimers();
    });

    afterEach(() => {
        $activeProject.set(undefined);
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

        it('clearProjectContentCache removes content of the active project', () => {
            setContent(createMockContent('1'));
            setContent(createMockContent('2'));

            clearProjectContentCache();

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

            addTreeNodes([{ id: 'main-offline-1', data: null, parentId: null, hasChildren: false }]);
            setTreeRootIds(['main-offline-1']);

            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleContentData(['main-offline-1']);
            await fetchVisibleContentData(['main-offline-1']);

            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:00.999Z'));
            await fetchVisibleContentData(['main-offline-1']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-offline-1']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(2);
        });

        it('throttles immediate retries after filter tree fetch failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{ id: 'filter-offline-1', data: null, parentId: null, hasChildren: false }]);
            setFilterRootIds(['filter-offline-1']);

            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleFilterContentData(['filter-offline-1']);
            await fetchVisibleFilterContentData(['filter-offline-1']);

            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-offline-1']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(2);
        });

        it('allows 3 attempts and marks main node as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{ id: 'main-failed-3x', data: null, parentId: null, hasChildren: false }]);
            setTreeRootIds(['main-failed-3x']);
            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleContentData(['main-failed-3x']); // attempt 1
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-failed-3x']); // attempt 2
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleContentData(['main-failed-3x']); // attempt 3

            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(3);
            expect(isVisibleContentDataLoadFailed('main-failed-3x')).toBe(true);

            vi.setSystemTime(new Date('2026-02-14T00:00:03.003Z'));
            await fetchVisibleContentData(['main-failed-3x']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(3);
        });

        it('allows 3 attempts and marks filter node as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{ id: 'filter-failed-3x', data: null, parentId: null, hasChildren: false }]);
            setFilterRootIds(['filter-failed-3x']);
            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleFilterContentData(['filter-failed-3x']); // attempt 1
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-failed-3x']); // attempt 2
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleFilterContentData(['filter-failed-3x']); // attempt 3

            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(3);
            expect(isVisibleFilterContentDataLoadFailed('filter-failed-3x')).toBe(true);
        });

        it('retry reset allows a new 3-attempt cycle', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{ id: 'main-retry-cycle', data: null, parentId: null, hasChildren: false }]);
            setTreeRootIds(['main-retry-cycle']);
            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleContentData(['main-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleContentData(['main-retry-cycle']);
            expect(isVisibleContentDataLoadFailed('main-retry-cycle')).toBe(true);

            clearVisibleContentDataRetryCooldown(['main-retry-cycle']);
            expect(isVisibleContentDataLoadFailed('main-retry-cycle')).toBe(false);

            await fetchVisibleContentData(['main-retry-cycle']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(4);
        });

        it('filter retry reset allows immediate re-attempt', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{ id: 'filter-retry-cycle', data: null, parentId: null, hasChildren: false }]);
            setFilterRootIds(['filter-retry-cycle']);
            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            expect(isVisibleFilterContentDataLoadFailed('filter-retry-cycle')).toBe(true);

            clearVisibleFilterContentDataRetryCooldown(['filter-retry-cycle']);
            expect(isVisibleFilterContentDataLoadFailed('filter-retry-cycle')).toBe(false);

            await fetchVisibleFilterContentData(['filter-retry-cycle']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(4);
        });

        it('adds cooldown only for unresolved IDs on partial response', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([
                { id: 'partial-a', data: null, parentId: null, hasChildren: false },
                { id: 'partial-b', data: null, parentId: null, hasChildren: false },
            ]);
            setTreeRootIds(['partial-a', 'partial-b']);

            mockResolveContentSummaries.mockImplementation((contentIds: { toString: () => string }[]) => {
                const ids = contentIds.map((id) => id.toString());
                if (ids.includes('partial-a') && ids.includes('partial-b')) {
                    return okAsync([createMockContent('partial-a')]);
                }
                return okAsync([createMockContent('partial-b')]);
            });

            await fetchVisibleContentData(['partial-a', 'partial-b']);
            expect($treeState.get().nodes.get('partial-a')?.data).not.toBeNull();
            expect($treeState.get().nodes.get('partial-b')?.data).toBeNull();

            await fetchVisibleContentData(['partial-a', 'partial-b']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(1);

            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['partial-a', 'partial-b']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(2);
            expect($treeState.get().nodes.get('partial-b')?.data).not.toBeNull();
        });

        it('does not request resolved IDs again in filter tree after success', async () => {
            addFilterNodes([{ id: 'filter-success-1', data: null, parentId: null, hasChildren: false }]);
            setFilterRootIds(['filter-success-1']);
            mockResolveContentSummaries.mockReturnValue(okAsync([createMockContent('filter-success-1')]));

            await fetchVisibleFilterContentData(['filter-success-1']);
            expect($filterTreeState.get().nodes.get('filter-success-1')?.data).not.toBeNull();

            await fetchVisibleFilterContentData(['filter-success-1']);
            expect(mockResolveContentSummaries).toHaveBeenCalledTimes(1);
        });

        it('clears main retry-failure state on root reload', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addTreeNodes([{ id: 'main-reset-on-root-load', data: null, parentId: null, hasChildren: false }]);
            setTreeRootIds(['main-reset-on-root-load']);
            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

            await fetchVisibleContentData(['main-reset-on-root-load']);
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await fetchVisibleContentData(['main-reset-on-root-load']);
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await fetchVisibleContentData(['main-reset-on-root-load']);
            expect(isVisibleContentDataLoadFailed('main-reset-on-root-load')).toBe(true);

            mockListContentIdsByParent.mockReturnValue(okAsync([{ toString: () => 'new-root-id' }]));
            await fetchRootChildrenIdsOnly();

            expect(isVisibleContentDataLoadFailed('main-reset-on-root-load')).toBe(false);
        });

        it('clears filter retry-failure state when filter mode deactivates', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{ id: 'filter-reset-on-deactivate', data: null, parentId: null, hasChildren: false }]);
            setFilterRootIds(['filter-reset-on-deactivate']);
            mockResolveContentSummaries.mockReturnValue(errAsync(new AppError('offline')));

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

            addTreeNodes([{ id: 'parent-main-3x', data: null, parentId: null, hasChildren: true }]);
            setTreeRootIds(['parent-main-3x']);
            mockListContentIdsByParent.mockReturnValue(errAsync(new AppError('offline')));

            await expect(fetchChildrenIdsOnly('parent-main-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).rejects.toThrow('offline');

            expect(mockListContentIdsByParent).toHaveBeenCalledTimes(3);
            expect(isChildrenIdsLoadFailed('parent-main-3x')).toBe(true);

            vi.setSystemTime(new Date('2026-02-14T00:00:03.003Z'));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).resolves.toEqual([]);
            expect(mockListContentIdsByParent).toHaveBeenCalledTimes(3);

            clearChildrenIdsRetryCooldown('parent-main-3x');
            mockListContentIdsByParent.mockReturnValue(okAsync([{ toString: () => 'child-main-ok' }]));
            await expect(fetchChildrenIdsOnly('parent-main-3x')).resolves.toEqual(['child-main-ok']);
            expect(isChildrenIdsLoadFailed('parent-main-3x')).toBe(false);
        });

        it('allows 3 non-root attempts and marks filter parent as failed after third failure', async () => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date('2026-02-14T00:00:00.000Z'));

            addFilterNodes([{ id: 'parent-filter-3x', data: null, parentId: null, hasChildren: true }]);
            setFilterRootIds(['parent-filter-3x']);
            mockListContentIdsByParent.mockReturnValue(errAsync(new AppError('offline')));

            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:01.001Z'));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).rejects.toThrow('offline');
            vi.setSystemTime(new Date('2026-02-14T00:00:02.002Z'));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).rejects.toThrow('offline');

            expect(mockListContentIdsByParent).toHaveBeenCalledTimes(3);
            expect(isFilterChildrenIdsLoadFailed('parent-filter-3x')).toBe(true);

            vi.setSystemTime(new Date('2026-02-14T00:00:03.003Z'));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).resolves.toEqual([]);
            expect(mockListContentIdsByParent).toHaveBeenCalledTimes(3);

            clearFilterChildrenIdsRetryCooldown('parent-filter-3x');
            mockListContentIdsByParent.mockReturnValue(okAsync([{ toString: () => 'child-filter-ok' }]));
            await expect(fetchFilterChildrenIdsOnly('parent-filter-3x')).resolves.toEqual(['child-filter-ok']);
            expect(isFilterChildrenIdsLoadFailed('parent-filter-3x')).toBe(false);
        });
    });

    describe('project-switch race protection', () => {
        const projectA = { getName: () => 'projectA' } as unknown as Project;
        const projectB = { getName: () => 'projectB' } as unknown as Project;

        it('fetchVisibleContentData: stale response writes to source partition but not the new tree', async () => {
            $activeProject.set(projectA);
            addTreeNodes([{ id: 'race-1', data: null, parentId: null, hasChildren: false }]);
            setTreeRootIds(['race-1']);

            let resolveFetch!: (value: ContentSummary[]) => void;
            mockResolveContentSummaries.mockImplementation(() =>
                ResultAsync.fromSafePromise(
                    new Promise<ContentSummary[]>((resolve) => {
                        resolveFetch = resolve;
                    }),
                ),
            );

            const pending = fetchVisibleContentData(['race-1']);

            // User switches mid-flight: tree resets, $activeProject moves to B.
            $activeProject.set(projectB);
            resetTree();

            // The slow response for project A arrives.
            resolveFetch([createMockContent('race-1', 'A version')]);
            await pending;

            // Project B's tree must not have absorbed A's response.
            expect(hasTreeNode('race-1')).toBe(false);

            // But A's partition gets the data — useful when the user returns to A.
            expect(getContent('race-1', 'projectA')?.getDisplayName()).toBe('A version');
            // And B's partition stays clean.
            expect(getContent('race-1', 'projectB')).toBeUndefined();
        });

        it('fetchChildrenIdsOnly: stale response does not seed the new tree', async () => {
            $activeProject.set(projectA);

            let resolveIds!: (value: { toString: () => string }[]) => void;
            mockListContentIdsByParent.mockImplementation(() =>
                ResultAsync.fromSafePromise(
                    new Promise<{ toString: () => string }[]>((resolve) => {
                        resolveIds = resolve;
                    }),
                ),
            );

            const pending = fetchRootChildrenIdsOnly();

            // Switch projects before the IDs land.
            $activeProject.set(projectB);
            resetTree();

            resolveIds([{ toString: () => 'stale-root-1' }, { toString: () => 'stale-root-2' }]);
            const result = await pending;

            // Helper returns an empty list on stale; new tree stays empty.
            expect(result).toEqual([]);
            expect($treeState.get().rootIds).toEqual([]);
            expect(hasTreeNode('stale-root-1')).toBe(false);
        });

        it('does not gate when no project was captured at request start', async () => {
            // No active project at capture time: skip the staleness check entirely.
            $activeProject.set(undefined);
            addTreeNodes([{ id: 'no-capture', data: null, parentId: null, hasChildren: false }]);
            setTreeRootIds(['no-capture']);

            mockResolveContentSummaries.mockReturnValue(okAsync([createMockContent('no-capture', 'still-fetched')]));

            await fetchVisibleContentData(['no-capture']);

            // Tree still updates because there was no project to be stale against.
            const node = $treeState.get().nodes.get('no-capture');
            expect(node?.data).not.toBeNull();
        });
    });

    describe('filter branch behavior', () => {
        it('switches between master and draft branches', async () => {
            const query = createMockQuery();
            mockOtherQueryApi.mockReturnValue(okAsync({ contents: [], totalHits: 0 }));

            await activateFilter(query, Branch.MASTER);
            expect(mockOtherQueryApi).toHaveBeenLastCalledWith(expect.objectContaining({ branch: Branch.MASTER }));

            deactivateFilter();
            await activateFilter(query);
            expect(mockOtherQueryApi).toHaveBeenLastCalledWith(expect.objectContaining({ branch: Branch.DRAFT }));
        });
    });

    describe('content sorted handling', () => {
        it('should reload children of a sorted parent in server order when they are loaded', async () => {
            addTreeNodes([
                { id: 'sorted-parent', data: null, parentId: null, hasChildren: true },
                { id: 'sorted-child-a', data: null, parentId: 'sorted-parent', hasChildren: false },
                { id: 'sorted-child-b', data: null, parentId: 'sorted-parent', hasChildren: false },
            ]);
            setTreeRootIds(['sorted-parent']);
            setTreeChildren('sorted-parent', ['sorted-child-a', 'sorted-child-b']);
            mockListContentIdsByParent.mockReturnValue(
                okAsync([{ toString: () => 'sorted-child-b' }, { toString: () => 'sorted-child-a' }]),
            );

            emitContentSorted([createMockContent('sorted-parent')]);

            await vi.waitFor(() => {
                expect($treeState.get().nodes.get('sorted-parent')?.childIds).toEqual([
                    'sorted-child-b',
                    'sorted-child-a',
                ]);
            });
            expect(mockListContentIdsByParent).toHaveBeenCalledTimes(1);
        });

        it('should not reload a sorted parent whose children are not loaded', () => {
            addTreeNodes([{ id: 'collapsed-parent', data: null, parentId: null, hasChildren: true }]);
            setTreeRootIds(['collapsed-parent']);

            emitContentSorted([createMockContent('collapsed-parent')]);

            expect(mockListContentIdsByParent).not.toHaveBeenCalled();
        });

        it('should ignore sorted content missing from the tree', () => {
            emitContentSorted([createMockContent('untracked-parent')]);

            expect(mockListContentIdsByParent).not.toHaveBeenCalled();
        });

        it('should skip child summaries of a manual sort payload', async () => {
            addTreeNodes([
                { id: 'manual-parent', data: null, parentId: null, hasChildren: true },
                { id: 'manual-child-a', data: null, parentId: 'manual-parent', hasChildren: false },
                { id: 'manual-child-b', data: null, parentId: 'manual-parent', hasChildren: false },
            ]);
            setTreeRootIds(['manual-parent']);
            setTreeChildren('manual-parent', ['manual-child-a', 'manual-child-b']);
            mockListContentIdsByParent.mockReturnValue(
                okAsync([{ toString: () => 'manual-child-b' }, { toString: () => 'manual-child-a' }]),
            );

            emitContentSorted([
                createMockContent('manual-parent'),
                createMockContent('manual-child-a'),
                createMockContent('manual-child-b'),
            ]);

            await vi.waitFor(() => {
                expect($treeState.get().nodes.get('manual-parent')?.childIds).toEqual([
                    'manual-child-b',
                    'manual-child-a',
                ]);
            });
            expect(mockListContentIdsByParent).toHaveBeenCalledTimes(1);
        });
    });
});
