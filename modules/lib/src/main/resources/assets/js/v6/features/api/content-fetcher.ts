import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import {ContentId} from '../../../app/content/ContentId';
import {ContentQuery} from '../../../app/content/ContentQuery';
import type {ContentSummary} from '../../../app/content/ContentSummary';
import type {ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {ContentQueryRequest} from '../../../app/resource/ContentQueryRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ChildOrder} from '../../../app/resource/order/ChildOrder';
import {Branch} from '../../../app/versioning/Branch';
import {setContents, getMissingIds, getContents} from '../store/content.store';
import {
    $treeState,
    addTreeNodes,
    setTreeChildren,
    setTreeRootIds,
    appendTreeChildren,
    setNodeLoading,
    setNodesLoadingData,
    setNodeTotalChildren,
    setRootTotalChildren,
    type ContentTreeNodeData,
} from '../store/tree-list.store';
import type {CreateNodeOptions} from '../lib/tree-store';
import {calcWorkflowStateStatus} from '../utils/cms/content/workflow';
import {resolveDisplayName, resolveSubName} from '../utils/cms/content/prettify';

//
// * Constants
//

const DEFAULT_BATCH_SIZE = 10;

//
// * Fetcher Instance
//

const fetcher = new ContentSummaryAndCompareStatusFetcher();

//
// * Filter Query State
//

let filterQuery: ContentQuery | null = null;

/**
 * Request ID counter for filter operations.
 * Incremented on each filter activation to invalidate previous requests.
 * Used to prevent stale filter results from race conditions.
 */
let filterRequestId = 0;

/**
 * When set, fetchRootChildrenFiltered will use this query instead of listing all root children.
 */
export function setFilterQuery(query: ContentQuery | null): void {
    filterQuery = query;
}

export function getFilterQuery(): ContentQuery | null {
    return filterQuery;
}

export function hasFilter(): boolean {
    return filterQuery !== null;
}

export function clearFilterQuery(): void {
    filterQuery = null;
}

//
// * Conversion Helpers
//

/**
 * Converts ContentSummaryAndCompareStatus to tree node data.
 */
function toTreeNodeData(content: ContentSummaryAndCompareStatus): ContentTreeNodeData {
    return {
        id: content.getId(),
        displayName: resolveDisplayName(content),
        name: resolveSubName(content),
        publishStatus: content.getPublishStatus(),
        workflowStatus: calcWorkflowStateStatus(content.getContentSummary()),
        contentType: content.getType(),
        iconUrl: content.getContentSummary().getIconUrl(),
    };
}

/**
 * Creates tree node options from content.
 */
function toNodeOptions(content: ContentSummaryAndCompareStatus, parentId: string | null): CreateNodeOptions<ContentTreeNodeData> {
    return {
        id: content.getId(),
        data: toTreeNodeData(content),
        parentId,
        hasChildren: content.hasChildren(),
    };
}

/**
 * Configures a ContentQuery with pagination and copies filter settings from source query.
 */
function configureContentQuery(sourceQuery: ContentQuery, offset: number, size: number): ContentQuery {
    const configuredQuery = new ContentQuery();
    configuredQuery
        .setFrom(offset)
        .setSize(size)
        .setQueryFilters(sourceQuery.getQueryFilters())
        .setQuery(sourceQuery.getQuery())
        .setQuerySort(sourceQuery.getQuerySort())
        .setContentTypeNames(sourceQuery.getContentTypes())
        .setMustBeReferencedById(sourceQuery.getMustBeReferencedById());
    return configuredQuery;
}

//
// * Fetch Functions
//

export type FetchChildrenResult = {
    /** Fetched content IDs */
    ids: string[];
    /** Whether there are more children to load */
    hasMore: boolean;
    /** Total number of children */
    total: number;
};

/**
 * Fetches children for a parent node and updates both cache and tree.
 *
 * @param parentId - Parent content ID (null for root)
 * @param offset - Pagination offset
 * @param size - Batch size
 * @param childOrder - Optional child order (used for root)
 * @returns Object with ids, hasMore flag, and total count
 */
export async function fetchChildren(
    parentId: string | null,
    offset: number = 0,
    size: number = DEFAULT_BATCH_SIZE,
    childOrder?: ChildOrder
): Promise<FetchChildrenResult> {
    // Set loading state
    setNodeLoading(parentId, true);

    try {
        const parentContentId = parentId ? new ContentId(parentId) : null;
        const response = await fetcher.fetchChildren(parentContentId, offset, size, childOrder);

        const contents = response.getContents();
        const metadata = response.getMetadata();
        const total = metadata.getTotalHits();
        const hasMore = offset + contents.length < total;

        // Update content cache
        setContents(contents);

        // Create tree nodes
        const nodeOptions: CreateNodeOptions<ContentTreeNodeData>[] = contents.map((content) => toNodeOptions(content, parentId));

        // Update tree
        addTreeNodes(nodeOptions);

        const childIds = contents.map((c) => c.getId());

        if (offset === 0) {
            // First batch - set children
            setTreeChildren(parentId, childIds);
        } else {
            // Pagination - append children
            appendTreeChildren(parentId, childIds);
        }

        // Update totalChildren for pagination
        if (parentId) {
            setNodeTotalChildren(parentId, total);
        } else {
            setRootTotalChildren(total);
        }

        return {ids: childIds, hasMore, total};
    } finally {
        setNodeLoading(parentId, false);
    }
}

/**
 * Creates the default root child order.
 */
export function createRootChildOrder(): ChildOrder {
    return fetcher.createRootChildOrder();
}

/**
 * Fetches root children with default order.
 *
 * @param offset - Pagination offset
 * @param size - Batch size
 */
export async function fetchRootChildren(offset: number = 0, size: number = DEFAULT_BATCH_SIZE): Promise<FetchChildrenResult> {
    return fetchChildren(null, offset, size, createRootChildOrder());
}

/**
 * Fetches root children, using filter query if set.
 * This is the main entry point for loading root content in the tree.
 *
 * @param offset - Pagination offset
 * @param size - Batch size
 */
export async function fetchRootChildrenFiltered(offset: number = 0, size: number = DEFAULT_BATCH_SIZE): Promise<FetchChildrenResult> {
    if (filterQuery) {
        return fetchFilteredRootChildren(filterQuery, offset, size);
    }
    return fetchRootChildren(offset, size);
}

/**
 * Fetches filtered root content using a query.
 *
 * @param query - Content query for filtering
 * @param offset - Pagination offset
 * @param size - Batch size
 */
export async function fetchFilteredRootChildren(
    query: ContentQuery,
    offset: number = 0,
    size: number = DEFAULT_BATCH_SIZE
): Promise<FetchChildrenResult> {
    setNodeLoading(null, true);

    try {
        const configuredQuery = configureContentQuery(query, offset, size);

        // Execute query
        const request = new ContentQueryRequest<ContentSummaryJson, ContentSummary>(configuredQuery)
            .setTargetBranch(Branch.DRAFT)
            .setExpand(Expand.SUMMARY);

        const result = await request.sendAndParse();
        const summaries = result.getContents();
        const metadata = result.getMetadata();
        const total = metadata.getTotalHits();
        const hasMore = offset + summaries.length < total;

        // Update readonly and compare status for the summaries
        const contents = await fetcher.updateReadonlyAndCompareStatus(summaries);

        // Update content cache
        setContents(contents);

        // Create tree nodes (all as root since it's a flat query result)
        const nodeOptions: CreateNodeOptions<ContentTreeNodeData>[] = contents.map((content) => toNodeOptions(content, null));

        addTreeNodes(nodeOptions);

        const childIds = contents.map((c) => c.getId());

        if (offset === 0) {
            setTreeChildren(null, childIds);
        } else {
            appendTreeChildren(null, childIds);
        }

        // Update root total children for pagination
        setRootTotalChildren(total);

        return {ids: childIds, hasMore, total};
    } finally {
        setNodeLoading(null, false);
    }
}

/**
 * Fetches content by IDs, checking cache first.
 * Only fetches IDs that are missing from cache.
 *
 * @param ids - Content IDs to fetch
 * @returns All requested content (from cache + freshly fetched)
 */
export async function fetchContentByIds(ids: string[]): Promise<ContentSummaryAndCompareStatus[]> {
    if (ids.length === 0) return [];

    // Check what's missing from cache
    const missingIds = getMissingIds(ids);

    // Fetch missing content
    if (missingIds.length > 0) {
        const contentIds = missingIds.map((id) => new ContentId(id));
        const fetched = await fetcher.fetchAndCompareStatus(contentIds);
        setContents(fetched);
    }

    // Return all requested content from cache
    return getContents(ids);
}

/**
 * Fetches content by IDs that aren't in cache (updates cache only).
 * Useful for prefetching visible nodes.
 */
export async function fetchMissingContent(ids: string[]): Promise<void> {
    const missingIds = getMissingIds(ids);
    if (missingIds.length === 0) return;

    const contentIds = missingIds.map((id) => new ContentId(id));
    const fetched = await fetcher.fetchAndCompareStatus(contentIds);
    setContents(fetched);
}

/**
 * Force refreshes a single content item in the cache.
 */
export async function refreshContent(id: string): Promise<ContentSummaryAndCompareStatus | undefined> {
    const contentId = new ContentId(id);
    const contents = await fetcher.fetchAndCompareStatus([contentId]);
    if (contents.length > 0) {
        setContents(contents);
        return contents[0];
    }
    return undefined;
}

/**
 * Force refreshes multiple content items in the cache.
 */
export async function refreshContents(ids: string[]): Promise<ContentSummaryAndCompareStatus[]> {
    if (ids.length === 0) return [];

    const contentIds = ids.map((id) => new ContentId(id));
    const contents = await fetcher.fetchAndCompareStatus(contentIds);
    setContents(contents);
    return contents;
}

/**
 * Refreshes children of a parent node.
 * Useful after uploads complete to get correct sort order.
 *
 * @param parentId - Parent content ID (null for root)
 * @param size - Batch size for initial fetch
 */
export async function refreshChildren(parentId: string | null, size: number = DEFAULT_BATCH_SIZE): Promise<FetchChildrenResult> {
    const childOrder = parentId === null ? createRootChildOrder() : undefined;
    return fetchChildren(parentId, 0, size, childOrder);
}

//
// * ID-First Loading (Lazy Loading Pattern)
//

/**
 * Fetches all child IDs for a parent (no pagination, returns all).
 * Creates placeholder nodes in tree with data: null.
 * Content data is loaded separately via fetchVisibleContentData().
 *
 * This is the first step of the lazy loading pattern:
 * 1. fetchChildrenIds() - Get all IDs quickly
 * 2. fetchVisibleContentData() - Load data for visible items
 *
 * @param parentId - Parent content ID (null for root)
 * @param childOrder - Optional child order
 * @returns Array of child IDs
 */
export async function fetchChildrenIdsOnly(
    parentId: string | null,
    childOrder?: ChildOrder
): Promise<string[]> {
    const state = $treeState.get();

    if (parentId === null) {
        resetVisibleContentDataRetryState();
        resetChildrenIdsRetryState();
    } else {
        const parent = state.nodes.get(parentId);
        if (!parent || !parent.hasChildren || parent.childIds.length > 0) return [];
    }

    if (state.loadingIds.has(toParentRetryKey(parentId))) return [];
    if (!isParentRetryReady(childrenIdsRetryState, parentId, Date.now())) return [];

    setNodeLoading(parentId, true);

    try {
        const parentContentId = parentId ? new ContentId(parentId) : undefined;
        const ids = await fetcher.fetchChildrenIds(parentContentId, childOrder);
        clearChildrenIdsRetryCooldown(parentId);

        // Convert ContentId[] to string[]
        const idStrings = ids.map((id) => id.toString());

        // Create placeholder nodes (no data yet)
        const placeholderNodes: CreateNodeOptions<ContentTreeNodeData>[] = idStrings.map((id) => ({
            id,
            data: null, // Will be loaded on demand
            parentId,
            hasChildren: true, // Assume has children until we know
        }));

        addTreeNodes(placeholderNodes);

        // Set children relationship
        if (parentId) {
            setTreeChildren(parentId, idStrings);
            setNodeTotalChildren(parentId, idStrings.length);
        } else {
            setTreeRootIds(idStrings);
            setRootTotalChildren(idStrings.length);
        }

        return idStrings;
    } catch (error) {
        markParentRetryFailure(childrenIdsRetryState, failedChildrenParentIds, parentId, Date.now());
        throw error;
    } finally {
        setNodeLoading(parentId, false);
    }
}

/**
 * Fetches root children IDs with default sort order.
 * This is the entry point for initial tree load with lazy loading.
 */
export async function fetchRootChildrenIdsOnly(): Promise<string[]> {
    return fetchChildrenIdsOnly(null, createRootChildOrder());
}

// Batch size for loading content data in viewport loading
const DATA_BATCH_SIZE = 20;
const VISIBLE_DATA_RETRY_DELAY_MS = 1_000;
const MAX_VISIBLE_DATA_ATTEMPTS = 3;
const ROOT_PARENT_RETRY_KEY = '__root__';

/**
 * Tracks retry cooldown per content ID after visible data fetch failures.
 * Prevents tight retry loops (e.g. when browser is offline).
 */
type BatchLoadState = {
    attempts: number;
    retryAt: number;
    ids: string[];
};

const visibleDataBatchState = new Map<string, BatchLoadState>();
const visibleFilterDataBatchState = new Map<string, BatchLoadState>();
const visibleDataFailedIds = new Set<string>();
const visibleFilterDataFailedIds = new Set<string>();
const childrenIdsRetryState = new Map<string, {attempts: number; retryAt: number}>();
const filterChildrenIdsRetryState = new Map<string, {attempts: number; retryAt: number}>();
const failedChildrenParentIds = new Set<string>();
const failedFilterChildrenParentIds = new Set<string>();

/**
 * Normalizes parent retry key. Root-level parent is stored as __root__.
 */
function toParentRetryKey(parentId: string | null): string {
    return parentId ?? ROOT_PARENT_RETRY_KEY;
}

/**
 * Returns true when a parent can be retried now.
 * Stops retries after MAX_VISIBLE_DATA_ATTEMPTS.
 */
function isParentRetryReady(
    stateByParentKey: Map<string, {attempts: number; retryAt: number}>,
    parentId: string | null,
    now: number
): boolean {
    const state = stateByParentKey.get(toParentRetryKey(parentId));
    if (!state) return true;
    if (state.attempts >= MAX_VISIBLE_DATA_ATTEMPTS) return false;
    return state.retryAt <= now;
}

/**
 * Records parent-level failure with cooldown and attempt counter.
 */
function markParentRetryFailure(
    stateByParentKey: Map<string, {attempts: number; retryAt: number}>,
    failedParentIds: Set<string>,
    parentId: string | null,
    now = Date.now()
): void {
    const key = toParentRetryKey(parentId);
    const previousState = stateByParentKey.get(key);
    const attempts = (previousState?.attempts ?? 0) + 1;

    stateByParentKey.set(key, {
        attempts,
        retryAt: now + VISIBLE_DATA_RETRY_DELAY_MS,
    });

    if (attempts >= MAX_VISIBLE_DATA_ATTEMPTS) {
        failedParentIds.add(key);
    }
}

/**
 * Clears parent-level retry and failed marker after successful or manual retry.
 */
function clearParentRetryFailure(
    stateByParentKey: Map<string, {attempts: number; retryAt: number}>,
    failedParentIds: Set<string>,
    parentId: string | null
): void {
    const key = toParentRetryKey(parentId);
    stateByParentKey.delete(key);
    failedParentIds.delete(key);
}

/**
 * Clears all parent retry state, e.g. when mode resets.
 */
function resetParentRetryState(
    stateByParentKey: Map<string, {attempts: number; retryAt: number}>,
    failedParentIds: Set<string>
): void {
    stateByParentKey.clear();
    failedParentIds.clear();
}

/**
 * Clears all data-batch retry state and failed IDs.
 */
function resetBatchFailureState(stateByBatchKey: Map<string, BatchLoadState>, failedIds: Set<string>): void {
    stateByBatchKey.clear();
    failedIds.clear();
}

/**
 * Creates stable key for retry state of one data fetch batch.
 */
function toBatchKey(ids: string[]): string {
    return ids.join(',');
}

/**
 * Returns true when a data batch can be retried now.
 * Stops retries after MAX_VISIBLE_DATA_ATTEMPTS.
 */
function isBatchReady(stateByBatchKey: Map<string, BatchLoadState>, ids: string[], now: number): boolean {
    const state = stateByBatchKey.get(toBatchKey(ids));
    if (!state) return true;
    if (state.attempts >= MAX_VISIBLE_DATA_ATTEMPTS) return false;
    return state.retryAt <= now;
}

/**
 * Records batch-level failure with cooldown and attempt counter.
 * When max attempts is reached, all IDs in this batch become failed IDs.
 */
function markBatchFailure(
    stateByBatchKey: Map<string, BatchLoadState>,
    failedIds: Set<string>,
    ids: string[],
    now = Date.now()
): void {
    if (ids.length === 0) return;

    const key = toBatchKey(ids);
    const previousState = stateByBatchKey.get(key);
    const attempts = (previousState?.attempts ?? 0) + 1;

    stateByBatchKey.set(key, {
        attempts,
        retryAt: now + VISIBLE_DATA_RETRY_DELAY_MS,
        ids,
    });

    if (attempts >= MAX_VISIBLE_DATA_ATTEMPTS) {
        ids.forEach((id) => failedIds.add(id));
    }
}

/**
 * Clears failed IDs and related retry entries that intersect with IDs.
 *
 * The key part is intersection-based cleanup:
 * if the caller retries subset A, we also remove stale retry entries whose
 * stored batch contains any ID from A. This keeps retry state consistent
 * even when UI grouping and fetch batching boundaries differ.
 */
function clearBatchFailure(
    stateByBatchKey: Map<string, BatchLoadState>,
    failedIds: Set<string>,
    ids: string[]
): void {
    if (ids.length === 0) return;

    ids.forEach((id) => failedIds.delete(id));

    // Clear any batch state that intersects with provided IDs
    const idSet = new Set(ids);
    for (const [key, state] of stateByBatchKey.entries()) {
        if (state.ids.some((id) => idSet.has(id))) {
            stateByBatchKey.delete(key);
        }
    }
}

export function isVisibleContentDataLoadFailed(id: string): boolean {
    return visibleDataFailedIds.has(id);
}

export function isVisibleFilterContentDataLoadFailed(id: string): boolean {
    return visibleFilterDataFailedIds.has(id);
}

export function clearVisibleContentDataRetryCooldown(ids: string[]): void {
    clearBatchFailure(visibleDataBatchState, visibleDataFailedIds, ids);
}

export function clearVisibleFilterContentDataRetryCooldown(ids: string[]): void {
    clearBatchFailure(visibleFilterDataBatchState, visibleFilterDataFailedIds, ids);
}

export function isChildrenIdsLoadFailed(parentId: string | null): boolean {
    return failedChildrenParentIds.has(toParentRetryKey(parentId));
}

export function isFilterChildrenIdsLoadFailed(parentId: string | null): boolean {
    return failedFilterChildrenParentIds.has(toParentRetryKey(parentId));
}

export function clearChildrenIdsRetryCooldown(parentId: string | null): void {
    clearParentRetryFailure(childrenIdsRetryState, failedChildrenParentIds, parentId);
}

export function clearFilterChildrenIdsRetryCooldown(parentId: string | null): void {
    clearParentRetryFailure(filterChildrenIdsRetryState, failedFilterChildrenParentIds, parentId);
}

export function resetChildrenIdsRetryState(): void {
    resetParentRetryState(childrenIdsRetryState, failedChildrenParentIds);
}

export function resetFilterChildrenIdsRetryState(): void {
    resetParentRetryState(filterChildrenIdsRetryState, failedFilterChildrenParentIds);
}

export function resetVisibleContentDataRetryState(): void {
    resetBatchFailureState(visibleDataBatchState, visibleDataFailedIds);
}

export function resetVisibleFilterContentDataRetryState(): void {
    resetBatchFailureState(visibleFilterDataBatchState, visibleFilterDataFailedIds);
}

/**
 * Fetches content data for IDs that are missing from tree nodes.
 * Updates both $contentCache and tree node data.
 *
 * This is the second step of the lazy loading pattern:
 * 1. fetchChildrenIdsOnly() - Get all IDs quickly
 * 2. fetchVisibleContentData() - Load data for visible items
 *
 * @param ids - Content IDs to fetch data for
 */
export async function fetchVisibleContentData(ids: string[]): Promise<void> {
    const state = $treeState.get();

    // Filter to IDs that need tree node update:
    // - Node exists in tree
    // - Node has no data (data === null)
    // - Node is not already loading
    const idsNeedingUpdate = ids.filter((id) => {
        const node = state.nodes.get(id);
        return (
            node &&
            node.data === null &&
            !state.loadingDataIds.has(id) &&
            !visibleDataFailedIds.has(id)
        );
    });

    if (idsNeedingUpdate.length === 0) return;

    // Check content cache - separate cached vs uncached
    const cachedContents = getContents(idsNeedingUpdate);
    const cachedIds = new Set(cachedContents.map((c) => c.getId()));

    // Update tree nodes with cached content immediately (no fetch needed)
    if (cachedContents.length > 0) {
        updateTreeNodesWithData(cachedContents);
        clearBatchFailure(visibleDataBatchState, visibleDataFailedIds, cachedContents.map((c) => c.getId()));
    }

    // Filter to IDs not in cache
    const uncachedIds = idsNeedingUpdate.filter((id) => !cachedIds.has(id));

    if (uncachedIds.length === 0) return;

    // Mark uncached as loading
    setNodesLoadingData(uncachedIds, true);

    try {
        // Fetch in batches to avoid overwhelming the server
        for (let i = 0; i < uncachedIds.length; i += DATA_BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + DATA_BATCH_SIZE);
            if (!isBatchReady(visibleDataBatchState, batch, Date.now())) continue;
            const contentIds = batch.map((id) => new ContentId(id));
            try {
                const contents = await fetcher.fetchAndCompareStatus(contentIds);
                const fetchedIds = new Set(contents.map((content) => content.getId()));
                const unresolvedIds = batch.filter((id) => !fetchedIds.has(id));

                // Update content cache
                setContents(contents);

                // Update tree node data
                updateTreeNodesWithData(contents);
                clearBatchFailure(visibleDataBatchState, visibleDataFailedIds, [...fetchedIds]);

                // Retry unresolved IDs with backoff up to max attempts
                if (unresolvedIds.length > 0) {
                    markBatchFailure(visibleDataBatchState, visibleDataFailedIds, unresolvedIds, Date.now());
                }
            } catch {
                // Isolate failure to this batch and continue with others
                markBatchFailure(visibleDataBatchState, visibleDataFailedIds, batch, Date.now());
            }
        }
    } finally {
        setNodesLoadingData(uncachedIds, false);
    }
}

/**
 * Updates tree nodes with fetched content data.
 * Called after content is fetched to populate placeholder nodes.
 */
function updateTreeNodesWithData(contents: ContentSummaryAndCompareStatus[]): void {
    const updates: CreateNodeOptions<ContentTreeNodeData>[] = contents.map((content) => ({
        id: content.getId(),
        data: toTreeNodeData(content),
        hasChildren: content.hasChildren(),
    }));

    addTreeNodes(updates);
}

//
// * Filter Mode Functions (Phase 8)
//

import {
    setFilterActive as setFilterActiveState,
    deactivateFilter as deactivateFilterState,
} from '../store/active-tree.store';
import {
    $filterTreeState,
    addFilterNodes,
    setFilterRootIds,
    appendFilterRootIds,
    setFilterNodeLoading,
    setFilterRootTotalChildren,
    setFilterNodesLoadingData,
    setFilterChildren,
    setFilterNodeTotalChildren,
    resetFilterTree,
} from '../store/filter-tree.store';

/**
 * Activates filter mode and fetches filtered results.
 * Resets filter tree and loads fresh results.
 *
 * Uses request ID tracking to prevent race conditions when rapidly switching filters.
 * If a newer filter is activated before this one completes, results are discarded.
 *
 * @param query - Content query for filtering
 */
export async function activateFilter(query: ContentQuery): Promise<void> {
    // Increment request ID - previous requests become stale
    const requestId = ++filterRequestId;

    // Set filter state
    setFilterActiveState(true);
    filterQuery = query;
    resetVisibleFilterContentDataRetryState();
    resetFilterChildrenIdsRetryState();
    // Reset filter tree
    resetFilterTree();
    // Set loading state
    setFilterNodeLoading(null, true);

    try {
        // Fetch filtered results (flat list, no hierarchy)
        const result = await fetchFilteredContentForFilterTree(query, 0, DEFAULT_BATCH_SIZE);

        // Check if this request was superseded by a newer one
        if (requestId !== filterRequestId) return;

        // Update filter tree root IDs and total
        setFilterRootIds(result.ids);
        setFilterRootTotalChildren(result.total);
    } finally {
        // Only clear loading if this was the latest request
        if (requestId === filterRequestId) {
            setFilterNodeLoading(null, false);
        }
    }
}

/**
 * Deactivates filter mode, returning to main tree.
 * Increments request ID to invalidate any pending filter requests.
 */
export function deactivateFilter(): void {
    // Increment to invalidate any pending filter requests
    filterRequestId++;
    filterQuery = null;
    resetVisibleFilterContentDataRetryState();
    resetFilterChildrenIdsRetryState();
    deactivateFilterState();
}

/**
 * Fetches filtered content and updates the filter tree.
 *
 * @param query - Content query for filtering
 * @param offset - Pagination offset
 * @param size - Batch size
 */
async function fetchFilteredContentForFilterTree(
    query: ContentQuery,
    offset: number,
    size: number
): Promise<FetchChildrenResult> {
    const configuredQuery = configureContentQuery(query, offset, size);

    // Execute query
    const request = new ContentQueryRequest<ContentSummaryJson, ContentSummary>(configuredQuery)
        .setTargetBranch(Branch.DRAFT)
        .setExpand(Expand.SUMMARY);

    const result = await request.sendAndParse();
    const summaries = result.getContents();
    const metadata = result.getMetadata();
    const total = metadata.getTotalHits();
    const hasMore = offset + summaries.length < total;

    // Update readonly and compare status for the summaries
    const contents = await fetcher.updateReadonlyAndCompareStatus(summaries);

    // Update content cache
    setContents(contents);

    // Create filter tree nodes (all as root since it's a flat query result)
    const nodeOptions: CreateNodeOptions<ContentTreeNodeData>[] = contents.map((content) => toNodeOptions(content, null));

    addFilterNodes(nodeOptions);

    const childIds = contents.map((c) => c.getId());

    return {ids: childIds, hasMore, total};
}

/**
 * Fetches more filtered results for pagination.
 * Appends new results to the existing filter tree rootIds.
 * Uses request ID tracking to prevent stale responses from race conditions.
 *
 * @param offset - Pagination offset
 * @param size - Batch size
 */
export async function fetchMoreFilteredResults(
    offset: number,
    size: number = DEFAULT_BATCH_SIZE
): Promise<FetchChildrenResult | null> {
    if (!filterQuery) return null;

    // Capture current request ID - if a new filter is activated,
    // this request becomes stale and results should be ignored
    const requestId = filterRequestId;
    const currentQuery = filterQuery;

    setFilterNodeLoading(null, true);

    try {
        const result = await fetchFilteredContentForFilterTree(currentQuery, offset, size);

        // Check if superseded by newer filter activation
        if (requestId !== filterRequestId) return null;

        // Append new IDs to existing rootIds (pagination)
        appendFilterRootIds(result.ids);

        return result;
    } finally {
        // Only clear loading if this was the latest request
        if (requestId === filterRequestId) {
            setFilterNodeLoading(null, false);
        }
    }
}

/**
 * Fetches content data for visible nodes in the filter tree.
 * Similar to fetchVisibleContentData but for filter tree.
 *
 * @param ids - Content IDs to fetch data for
 */
export async function fetchVisibleFilterContentData(ids: string[]): Promise<void> {
    const state = $filterTreeState.get();

    // Filter to IDs that need tree node update:
    // - Node exists in filter tree
    // - Node has no data (data === null)
    // - Node is not already loading
    const idsNeedingUpdate = ids.filter((id) => {
        const node = state.nodes.get(id);
        return (
            node &&
            node.data === null &&
            !state.loadingDataIds.has(id) &&
            !visibleFilterDataFailedIds.has(id)
        );
    });

    if (idsNeedingUpdate.length === 0) return;

    // Check content cache - separate cached vs uncached
    const cachedContents = getContents(idsNeedingUpdate);
    const cachedIds = new Set(cachedContents.map((c) => c.getId()));

    // Update filter tree nodes with cached content immediately (no fetch needed)
    if (cachedContents.length > 0) {
        const updates: CreateNodeOptions<ContentTreeNodeData>[] = cachedContents.map((content) => ({
            id: content.getId(),
            data: toTreeNodeData(content),
            hasChildren: content.hasChildren(),
        }));

        addFilterNodes(updates);
        clearBatchFailure(visibleFilterDataBatchState, visibleFilterDataFailedIds, cachedContents.map((c) => c.getId()));
    }

    // Filter to IDs not in cache
    const uncachedIds = idsNeedingUpdate.filter((id) => !cachedIds.has(id));

    if (uncachedIds.length === 0) return;

    // Mark uncached as loading
    setFilterNodesLoadingData(uncachedIds, true);

    try {
        // Fetch in batches
        for (let i = 0; i < uncachedIds.length; i += DATA_BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + DATA_BATCH_SIZE);
            if (!isBatchReady(visibleFilterDataBatchState, batch, Date.now())) continue;
            const contentIds = batch.map((id) => new ContentId(id));
            try {
                const contents = await fetcher.fetchAndCompareStatus(contentIds);
                const fetchedIds = new Set(contents.map((content) => content.getId()));
                const unresolvedIds = batch.filter((id) => !fetchedIds.has(id));

                // Update content cache
                setContents(contents);

                // Update filter tree node data
                const updates: CreateNodeOptions<ContentTreeNodeData>[] = contents.map((content) => ({
                    id: content.getId(),
                    data: toTreeNodeData(content),
                    hasChildren: content.hasChildren(),
                }));

                addFilterNodes(updates);
                clearBatchFailure(visibleFilterDataBatchState, visibleFilterDataFailedIds, [...fetchedIds]);

                // Retry unresolved IDs with backoff up to max attempts
                if (unresolvedIds.length > 0) {
                    markBatchFailure(visibleFilterDataBatchState, visibleFilterDataFailedIds, unresolvedIds, Date.now());
                }
            } catch {
                // Isolate failure to this batch and continue with others
                markBatchFailure(visibleFilterDataBatchState, visibleFilterDataFailedIds, batch, Date.now());
            }
        }
    } finally {
        setFilterNodesLoadingData(uncachedIds, false);
    }
}

/**
 * Fetches children IDs for a filter tree node.
 * Creates placeholder nodes in filter tree with data: null.
 * Content data is loaded via fetchVisibleFilterContentData().
 *
 * This is used when expanding nodes in filter mode - children are added
 * to the filter tree so they remain visible in filter view.
 *
 * @param parentId - Parent content ID
 * @param childOrder - Optional child order
 * @returns Array of child IDs
 */
export async function fetchFilterChildrenIdsOnly(
    parentId: string,
    childOrder?: ChildOrder
): Promise<string[]> {
    const state = $filterTreeState.get();
    const parent = state.nodes.get(parentId);

    if (!parent || !parent.hasChildren || parent.childIds.length > 0) return [];
    if (state.loadingIds.has(parentId)) return [];
    if (!isParentRetryReady(filterChildrenIdsRetryState, parentId, Date.now())) return [];

    setFilterNodeLoading(parentId, true);

    try {
        const parentContentId = new ContentId(parentId);
        const ids = await fetcher.fetchChildrenIds(parentContentId, childOrder);
        clearFilterChildrenIdsRetryCooldown(parentId);

        // Convert ContentId[] to string[]
        const idStrings = ids.map((id) => id.toString());

        // Create placeholder nodes (no data yet)
        const placeholderNodes: CreateNodeOptions<ContentTreeNodeData>[] = idStrings.map((id) => ({
            id,
            data: null, // Will be loaded on demand
            parentId,
            hasChildren: true, // Assume has children until we know
        }));

        addFilterNodes(placeholderNodes);

        // Set children relationship in filter tree
        setFilterChildren(parentId, idStrings);
        setFilterNodeTotalChildren(parentId, idStrings.length);

        return idStrings;
    } catch (error) {
        markParentRetryFailure(filterChildrenIdsRetryState, failedFilterChildrenParentIds, parentId, Date.now());
        throw error;
    } finally {
        setFilterNodeLoading(parentId, false);
    }
}
