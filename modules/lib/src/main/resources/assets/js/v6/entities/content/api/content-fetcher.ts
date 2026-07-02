import { Expand } from '@enonic/lib-admin-ui/rest/Expand';
import { ContentId } from '../../../../app/content/ContentId';
import { ContentQuery } from '../../../../app/content/ContentQuery';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { ContentSummaryJson } from '../../../../app/content/ContentSummaryJson';
import { ContentQueryRequest } from '../../../../app/resource/ContentQueryRequest';
import { ContentSummaryAndCompareStatusFetcher } from '../../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import { ListContentByIdRequest } from '../../../../app/resource/ListContentByIdRequest';
import { type ChildOrder } from '../../../../app/resource/order/ChildOrder';
import { Branch } from '../../../../app/versioning/Branch';
import { $activeProject } from '../../../features/store/activeProject.store';
import { getMissingIds, getContents, getIdByPath } from '../model/content.store';
import { setContents } from '../model/content.commands';
import { $contentDuplicated, $contentMoved, $contentSorted } from '../../../shared/socket/socket.store';
import {
    $treeState,
    addTreeNode,
    addTreeNodes,
    setTreeChildren,
    setTreeRootIds,
    appendTreeChildren,
    setNodeLoading,
    setNodesLoadingData,
    setNodeTotalChildren,
    setRootTotalChildren,
    type ContentTreeNodeData,
} from '../model/content-tree.store';
import type { CreateNodeOptions } from '../../../shared/lib/tree-store';
import { calcContentState } from '../../../shared/lib/cms/content/workflow';
import { calcTreePublishStatus } from '../../../shared/lib/cms/content/status';
import { resolveDisplayName, resolveSubName } from '../../../shared/lib/cms/content/prettify';

/**
 * Snapshots the active project at request start. Tree writes are gated with
 * isProjectStale() after each await so a project switch cannot land stale data
 * on the new tree. Cache writes stay safe — they target the captured partition.
 */
function captureActiveProjectName(): string | undefined {
    return $activeProject.get()?.getName();
}

function isProjectStale(captured: string | undefined): boolean {
    if (captured == null) return false;
    return $activeProject.get()?.getName() !== captured;
}

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

/** Incremented on each filter activation to invalidate in-flight requests. */
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

function toTreeNodeData(content: ContentSummary): ContentTreeNodeData {
    return {
        id: content.getId(),
        displayName: resolveDisplayName(content),
        name: resolveSubName(content),
        publishStatus: calcTreePublishStatus(content),
        contentState: calcContentState(content),
        contentType: content.getType(),
        iconUrl: content.getIconUrl(),
        item: content,
    };
}

function toNodeOptions(content: ContentSummary, parentId: string | null): CreateNodeOptions<ContentTreeNodeData> {
    return {
        id: content.getId(),
        data: toTreeNodeData(content),
        parentId,
        hasChildren: content.hasChildren(),
    };
}

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
 */
export async function fetchChildren(
    parentId: string | null,
    offset: number = 0,
    size: number = DEFAULT_BATCH_SIZE,
    childOrder?: ChildOrder,
): Promise<FetchChildrenResult> {
    const projectName = captureActiveProjectName();

    setNodeLoading(parentId, true);

    try {
        const parentContentId = parentId ? new ContentId(parentId) : null;
        const response = await new ListContentByIdRequest(parentContentId)
            .setFrom(offset)
            .setSize(size)
            .setOrder(childOrder)
            .sendAndParse();

        const summaries = response.getContents();
        const metadata = response.getMetadata();
        const total = metadata.getTotalHits();
        const hasMore = offset + summaries.length < total;

        await fetcher.updateReadOnly(summaries);

        setContents(summaries, projectName);

        if (isProjectStale(projectName)) {
            return { ids: [], hasMore: false, total: 0 };
        }

        const nodeOptions: CreateNodeOptions<ContentTreeNodeData>[] = summaries.map((content) =>
            toNodeOptions(content, parentId),
        );
        addTreeNodes(nodeOptions);

        const childIds = summaries.map((c) => c.getId());

        if (offset === 0) {
            setTreeChildren(parentId, childIds);
        } else {
            appendTreeChildren(parentId, childIds);
        }

        if (parentId) {
            setNodeTotalChildren(parentId, total);
        } else {
            setRootTotalChildren(total);
        }

        return { ids: childIds, hasMore, total };
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
export async function fetchRootChildren(
    offset: number = 0,
    size: number = DEFAULT_BATCH_SIZE,
): Promise<FetchChildrenResult> {
    return fetchChildren(null, offset, size, createRootChildOrder());
}

/**
 * Fetches root children, using filter query if set.
 * This is the main entry point for loading root content in the tree.
 *
 * @param offset - Pagination offset
 * @param size - Batch size
 */
export async function fetchRootChildrenFiltered(
    offset: number = 0,
    size: number = DEFAULT_BATCH_SIZE,
): Promise<FetchChildrenResult> {
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
    size: number = DEFAULT_BATCH_SIZE,
): Promise<FetchChildrenResult> {
    const projectName = captureActiveProjectName();

    setNodeLoading(null, true);

    try {
        const configuredQuery = configureContentQuery(query, offset, size);
        const request = new ContentQueryRequest<ContentSummaryJson, ContentSummary>(configuredQuery)
            .setTargetBranch(Branch.DRAFT)
            .setExpand(Expand.SUMMARY);

        const result = await request.sendAndParse();
        const summaries = result.getContents();
        const metadata = result.getMetadata();
        const total = metadata.getTotalHits();
        const hasMore = offset + summaries.length < total;

        await fetcher.updateReadOnly(summaries);

        setContents(summaries, projectName);

        if (isProjectStale(projectName)) {
            return { ids: [], hasMore: false, total: 0 };
        }

        // Flat query result, every item is at root level.
        const nodeOptions: CreateNodeOptions<ContentTreeNodeData>[] = summaries.map((content) =>
            toNodeOptions(content, null),
        );
        addTreeNodes(nodeOptions);

        const childIds = summaries.map((c) => c.getId());

        if (offset === 0) {
            setTreeChildren(null, childIds);
        } else {
            appendTreeChildren(null, childIds);
        }

        setRootTotalChildren(total);

        return { ids: childIds, hasMore, total };
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
export async function fetchContentByIds(ids: string[]): Promise<ContentSummary[]> {
    if (ids.length === 0) return [];

    const projectName = captureActiveProjectName();

    const missingIds = getMissingIds(ids, projectName);

    if (missingIds.length > 0) {
        const contentIds = missingIds.map((id) => new ContentId(id));
        const fetched = await fetcher.fetchByIds(contentIds);
        await fetcher.updateReadOnly(fetched);
        setContents(fetched, projectName);
    }

    return getContents(ids, projectName);
}

/**
 * Fetches content by IDs that aren't in cache (updates cache only).
 * Useful for prefetching visible nodes.
 */
export async function fetchMissingContent(ids: string[]): Promise<void> {
    const projectName = captureActiveProjectName();

    const missingIds = getMissingIds(ids, projectName);
    if (missingIds.length === 0) return;

    const contentIds = missingIds.map((id) => new ContentId(id));
    const fetched = await fetcher.fetchByIds(contentIds);
    await fetcher.updateReadOnly(fetched);
    setContents(fetched, projectName);
}

/**
 * Force refreshes a single content item in the cache.
 */
export async function refreshContent(id: string): Promise<ContentSummary | undefined> {
    const projectName = captureActiveProjectName();

    const contentId = new ContentId(id);
    const summaries = await fetcher.fetchByIds([contentId]);
    if (summaries.length > 0) {
        await fetcher.updateReadOnly(summaries);
        setContents(summaries, projectName);
        return summaries[0];
    }
    return undefined;
}

/**
 * Force refreshes multiple content items in the cache.
 */
export async function refreshContents(ids: string[]): Promise<ContentSummary[]> {
    if (ids.length === 0) return [];

    const projectName = captureActiveProjectName();

    const contentIds = ids.map((id) => new ContentId(id));
    const summaries = await fetcher.fetchByIds(contentIds);
    await fetcher.updateReadOnly(summaries);
    setContents(summaries, projectName);
    return summaries;
}

/**
 * Refreshes children of a parent node.
 * Useful after uploads complete to get correct sort order.
 *
 * @param parentId - Parent content ID (null for root)
 * @param size - Batch size for initial fetch
 */
export async function refreshChildren(
    parentId: string | null,
    size: number = DEFAULT_BATCH_SIZE,
): Promise<FetchChildrenResult> {
    const childOrder = parentId === null ? createRootChildOrder() : undefined;
    return fetchChildren(parentId, 0, size, childOrder);
}

//
// * ID-First Loading (Lazy Loading Pattern)
//

/**
 * Fetches all child IDs for a parent (no pagination) and creates placeholder
 * nodes with data: null. First step of the lazy loading pattern — content data
 * is loaded separately via fetchVisibleContentData().
 *
 * @param parentId - Parent content ID (null for root)
 * @param childOrder - Optional child order
 */
export async function fetchChildrenIdsOnly(parentId: string | null, childOrder?: ChildOrder): Promise<string[]> {
    const projectName = captureActiveProjectName();
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

        const idStrings = ids.map((id) => id.toString());

        if (isProjectStale(projectName)) return [];

        const placeholderNodes: CreateNodeOptions<ContentTreeNodeData>[] = idStrings.map((id) => ({
            id,
            data: null,
            parentId,
            hasChildren: true, // Assume has children until we know
        }));

        addTreeNodes(placeholderNodes);

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

// Batch size for loading content data of visible nodes
const DATA_BATCH_SIZE = 20;
const VISIBLE_DATA_RETRY_DELAY_MS = 1_000;
const MAX_VISIBLE_DATA_ATTEMPTS = 3;
const ROOT_PARENT_RETRY_KEY = '__root__';

/**
 * Retry cooldown state for one data fetch batch.
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
const childrenIdsRetryState = new Map<string, { attempts: number; retryAt: number }>();
const filterChildrenIdsRetryState = new Map<string, { attempts: number; retryAt: number }>();
const failedChildrenParentIds = new Set<string>();
const failedFilterChildrenParentIds = new Set<string>();

function toParentRetryKey(parentId: string | null): string {
    return parentId ?? ROOT_PARENT_RETRY_KEY;
}

function isParentRetryReady(
    stateByParentKey: Map<string, { attempts: number; retryAt: number }>,
    parentId: string | null,
    now: number,
): boolean {
    const state = stateByParentKey.get(toParentRetryKey(parentId));
    if (!state) return true;
    if (state.attempts >= MAX_VISIBLE_DATA_ATTEMPTS) return false;
    return state.retryAt <= now;
}

function markParentRetryFailure(
    stateByParentKey: Map<string, { attempts: number; retryAt: number }>,
    failedParentIds: Set<string>,
    parentId: string | null,
    now = Date.now(),
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

function clearParentRetryFailure(
    stateByParentKey: Map<string, { attempts: number; retryAt: number }>,
    failedParentIds: Set<string>,
    parentId: string | null,
): void {
    const key = toParentRetryKey(parentId);
    stateByParentKey.delete(key);
    failedParentIds.delete(key);
}

function resetParentRetryState(
    stateByParentKey: Map<string, { attempts: number; retryAt: number }>,
    failedParentIds: Set<string>,
): void {
    stateByParentKey.clear();
    failedParentIds.clear();
}

function resetBatchFailureState(stateByBatchKey: Map<string, BatchLoadState>, failedIds: Set<string>): void {
    stateByBatchKey.clear();
    failedIds.clear();
}

function toBatchKey(ids: string[]): string {
    return ids.join(',');
}

function isBatchReady(stateByBatchKey: Map<string, BatchLoadState>, ids: string[], now: number): boolean {
    const state = stateByBatchKey.get(toBatchKey(ids));
    if (!state) return true;
    if (state.attempts >= MAX_VISIBLE_DATA_ATTEMPTS) return false;
    return state.retryAt <= now;
}

function markBatchFailure(
    stateByBatchKey: Map<string, BatchLoadState>,
    failedIds: Set<string>,
    ids: string[],
    now = Date.now(),
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
 * Clears failed IDs and any batch retry entries that intersect them. UI
 * grouping and fetch batching boundaries can differ, so retrying a subset
 * must also drop stale entries for batches containing those IDs.
 */
function clearBatchFailure(stateByBatchKey: Map<string, BatchLoadState>, failedIds: Set<string>, ids: string[]): void {
    if (ids.length === 0) return;

    ids.forEach((id) => failedIds.delete(id));

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
 * Fetches content data for IDs that are missing from tree nodes and updates
 * both $contentCache and tree node data. Second step of the lazy loading
 * pattern started by fetchChildrenIdsOnly().
 *
 * @param ids - Content IDs to fetch data for
 */
export async function fetchVisibleContentData(ids: string[]): Promise<void> {
    const projectName = captureActiveProjectName();
    const state = $treeState.get();

    const idsNeedingUpdate = ids.filter((id) => {
        const node = state.nodes.get(id);
        return node && node.data === null && !state.loadingDataIds.has(id) && !visibleDataFailedIds.has(id);
    });

    if (idsNeedingUpdate.length === 0) return;

    const cachedContents = getContents(idsNeedingUpdate, projectName);
    const cachedIds = new Set(cachedContents.map((c) => c.getId()));

    // Sync path before any await — no project staleness possible here.
    if (cachedContents.length > 0) {
        updateTreeNodesWithData(cachedContents);
        clearBatchFailure(
            visibleDataBatchState,
            visibleDataFailedIds,
            cachedContents.map((c) => c.getId()),
        );
    }

    const uncachedIds = idsNeedingUpdate.filter((id) => !cachedIds.has(id));

    if (uncachedIds.length === 0) return;

    setNodesLoadingData(uncachedIds, true);

    try {
        // Fetch in batches to avoid overwhelming the server
        for (let i = 0; i < uncachedIds.length; i += DATA_BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + DATA_BATCH_SIZE);
            if (!isBatchReady(visibleDataBatchState, batch, Date.now())) continue;
            const contentIds = batch.map((id) => new ContentId(id));
            try {
                const summaries = await fetcher.fetchByIds(contentIds);
                await fetcher.updateReadOnly(summaries);
                const fetchedIds = new Set(summaries.map((content) => content.getId()));
                const unresolvedIds = batch.filter((id) => !fetchedIds.has(id));

                setContents(summaries, projectName);

                // Project switched — drop this and remaining batches; the new
                // project's loader will fetch its own.
                if (isProjectStale(projectName)) return;

                updateTreeNodesWithData(summaries);
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
 * Populates placeholder tree nodes with fetched content data.
 */
function updateTreeNodesWithData(contents: ContentSummary[]): void {
    const updates: CreateNodeOptions<ContentTreeNodeData>[] = contents.map((content) => ({
        id: content.getId(),
        data: toTreeNodeData(content),
        hasChildren: content.hasChildren(),
    }));

    addTreeNodes(updates);
}

//
// * Filter Mode Functions
//

import {
    setFilterActive as setFilterActiveState,
    deactivateFilter as deactivateFilterState,
} from '../model/active-tree.store';
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
} from '../model/filter-tree.store';

/**
 * Activates filter mode: resets the filter tree and fetches fresh results.
 * Uses request ID tracking — if a newer filter is activated before this one
 * completes, the results are discarded.
 *
 * @param query - Content query for filtering
 */
export async function activateFilter(query: ContentQuery): Promise<void> {
    const requestId = ++filterRequestId;

    setFilterActiveState(true);
    filterQuery = query;
    resetVisibleFilterContentDataRetryState();
    resetFilterChildrenIdsRetryState();
    resetFilterTree();
    setFilterNodeLoading(null, true);

    try {
        const result = await fetchFilteredContentForFilterTree(query, 0, DEFAULT_BATCH_SIZE);

        if (requestId !== filterRequestId) return;

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
    size: number,
): Promise<FetchChildrenResult> {
    const projectName = captureActiveProjectName();

    const configuredQuery = configureContentQuery(query, offset, size);

    const request = new ContentQueryRequest<ContentSummaryJson, ContentSummary>(configuredQuery)
        .setTargetBranch(Branch.DRAFT)
        .setExpand(Expand.SUMMARY);

    const result = await request.sendAndParse();
    const summaries = result.getContents();
    const metadata = result.getMetadata();
    const total = metadata.getTotalHits();
    const hasMore = offset + summaries.length < total;

    await fetcher.updateReadOnly(summaries);

    setContents(summaries, projectName);

    if (isProjectStale(projectName)) {
        return { ids: [], hasMore: false, total: 0 };
    }

    // Flat query result, every item is at root level.
    const nodeOptions: CreateNodeOptions<ContentTreeNodeData>[] = summaries.map((content) =>
        toNodeOptions(content, null),
    );

    addFilterNodes(nodeOptions);

    const childIds = summaries.map((c) => c.getId());

    return { ids: childIds, hasMore, total };
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
    size: number = DEFAULT_BATCH_SIZE,
): Promise<FetchChildrenResult | null> {
    if (!filterQuery) return null;

    const requestId = filterRequestId;
    const currentQuery = filterQuery;

    setFilterNodeLoading(null, true);

    try {
        const result = await fetchFilteredContentForFilterTree(currentQuery, offset, size);

        if (requestId !== filterRequestId) return null;

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
    const projectName = captureActiveProjectName();
    const state = $filterTreeState.get();

    const idsNeedingUpdate = ids.filter((id) => {
        const node = state.nodes.get(id);
        return node && node.data === null && !state.loadingDataIds.has(id) && !visibleFilterDataFailedIds.has(id);
    });

    if (idsNeedingUpdate.length === 0) return;

    const cachedContents = getContents(idsNeedingUpdate, projectName);
    const cachedIds = new Set(cachedContents.map((c) => c.getId()));

    // Sync path before any await — no project staleness possible here.
    if (cachedContents.length > 0) {
        const updates: CreateNodeOptions<ContentTreeNodeData>[] = cachedContents.map((content) => ({
            id: content.getId(),
            data: toTreeNodeData(content),
            hasChildren: content.hasChildren(),
        }));

        addFilterNodes(updates);
        clearBatchFailure(
            visibleFilterDataBatchState,
            visibleFilterDataFailedIds,
            cachedContents.map((c) => c.getId()),
        );
    }

    const uncachedIds = idsNeedingUpdate.filter((id) => !cachedIds.has(id));

    if (uncachedIds.length === 0) return;

    setFilterNodesLoadingData(uncachedIds, true);

    try {
        // Fetch in batches to avoid overwhelming the server
        for (let i = 0; i < uncachedIds.length; i += DATA_BATCH_SIZE) {
            const batch = uncachedIds.slice(i, i + DATA_BATCH_SIZE);
            if (!isBatchReady(visibleFilterDataBatchState, batch, Date.now())) continue;
            const contentIds = batch.map((id) => new ContentId(id));
            try {
                const summaries = await fetcher.fetchByIds(contentIds);
                await fetcher.updateReadOnly(summaries);
                const fetchedIds = new Set(summaries.map((content) => content.getId()));
                const unresolvedIds = batch.filter((id) => !fetchedIds.has(id));

                setContents(summaries, projectName);

                if (isProjectStale(projectName)) return;

                const updates: CreateNodeOptions<ContentTreeNodeData>[] = summaries.map((content) => ({
                    id: content.getId(),
                    data: toTreeNodeData(content),
                    hasChildren: content.hasChildren(),
                }));

                addFilterNodes(updates);
                clearBatchFailure(visibleFilterDataBatchState, visibleFilterDataFailedIds, [...fetchedIds]);

                // Retry unresolved IDs with backoff up to max attempts
                if (unresolvedIds.length > 0) {
                    markBatchFailure(
                        visibleFilterDataBatchState,
                        visibleFilterDataFailedIds,
                        unresolvedIds,
                        Date.now(),
                    );
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
 * Fetches children IDs for a filter tree node and creates placeholder nodes
 * with data: null. Content data is loaded via fetchVisibleFilterContentData().
 * Used when expanding nodes in filter mode — children are added to the filter
 * tree so they remain visible in filter view.
 *
 * @param parentId - Parent content ID
 * @param childOrder - Optional child order
 */
export async function fetchFilterChildrenIdsOnly(parentId: string, childOrder?: ChildOrder): Promise<string[]> {
    const projectName = captureActiveProjectName();
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

        const idStrings = ids.map((id) => id.toString());

        if (isProjectStale(projectName)) return [];

        const placeholderNodes: CreateNodeOptions<ContentTreeNodeData>[] = idStrings.map((id) => ({
            id,
            data: null,
            parentId,
            hasChildren: true, // Assume has children until we know
        }));

        addFilterNodes(placeholderNodes);

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

//
// * Content Moved Handling
//

/**
 * Clears a parent's loaded childIds and re-fetches them so a moved item lands at
 * the correct sorted slot.
 */
export async function reloadParentChildren(parentId: string | null): Promise<string[]> {
    if (parentId === null) {
        setTreeRootIds([]);
        return fetchRootChildrenIdsOnly();
    }

    const parent = $treeState.get().nodes.get(parentId);
    if (!parent) return [];

    // Force hasChildren=true and clear childIds so the fetchChildrenIdsOnly guard passes.
    addTreeNode({ id: parentId, hasChildren: true, childIds: [] });

    return fetchChildrenIdsOnly(parentId);
}

// Old-parent refresh handles the case where the moved item lived under an unexpanded
// parent and was never in $treeState, so removeContentFromTree could not adjust its
// hasChildren. Runs in filter mode too so the main tree is current when the filter clears.
$contentMoved.subscribe((event) => {
    if (!event?.data) return;

    const state = $treeState.get();
    const parentsToReload = new Set<string | null>();
    const oldParentsToRefresh = new Set<string>();

    for (const moved of event.data) {
        const content = moved.item.getContentSummary();
        const newPath = content.getPath?.();
        if (!newPath) continue;
        // Skip same-parent changes (renames) — the parents' listings are unaffected.
        if (moved.oldPath.getParentPath().equals(newPath.getParentPath())) continue;

        // New parent
        const newParentPath = newPath.hasParentContent() ? newPath.getParentPath() : null;
        const newParentId =
            newParentPath && !newParentPath.isRoot() ? (getIdByPath(newParentPath.toString()) ?? null) : null;

        if (newParentPath && !newParentPath.isRoot() && !newParentId) {
            // New parent not in tree/cache — nothing to update on the new side.
        } else if (newParentId === null) {
            if (state.rootIds.length > 0) {
                parentsToReload.add(null);
            }
        } else {
            const parent = state.nodes.get(newParentId);
            if (parent) {
                if (parent.childIds.length > 0) {
                    parentsToReload.add(newParentId);
                } else if (!parent.hasChildren) {
                    addTreeNode({ id: newParentId, hasChildren: true });
                }
            }
        }

        // Old parent
        const oldParentPath = moved.oldPath.hasParentContent() ? moved.oldPath.getParentPath() : null;
        if (oldParentPath && !oldParentPath.isRoot()) {
            const oldParentId = getIdByPath(oldParentPath.toString());
            if (oldParentId && state.nodes.has(oldParentId)) {
                oldParentsToRefresh.add(oldParentId);
            }
        }
    }

    for (const parentId of parentsToReload) {
        void reloadParentChildren(parentId).catch(() => undefined);
    }

    for (const id of oldParentsToRefresh) {
        void refreshContent(id)
            .then((summary) => {
                if (!summary) return;
                const node = $treeState.get().nodes.get(id);
                if (node && node.hasChildren !== summary.hasChildren()) {
                    addTreeNode({ id, hasChildren: summary.hasChildren() });
                }
            })
            .catch(() => undefined);
    }
});

// Refetch instead of inserting locally: the server owns the child order (it may
// be manual) so we cannot compute the new item's slot client-side. With includeChildren,
// descendants of a freshly duplicated node are skipped — their parent is not yet
// loaded, lazy-load fills the subtree on expand.
$contentDuplicated.subscribe((event) => {
    if (!event?.data) return;

    const state = $treeState.get();
    const duplicatedIds = new Set(event.data.map((content) => content.getId()));
    const parentsToReload = new Set<string | null>();

    for (const content of event.data) {
        const path = content.getPath?.();
        if (!path) continue;

        const newParentPath = path.hasParentContent() ? path.getParentPath() : null;
        const newParentId =
            newParentPath && !newParentPath.isRoot() ? (getIdByPath(newParentPath.toString()) ?? null) : null;

        if (newParentId && duplicatedIds.has(newParentId)) continue;

        if (newParentPath && !newParentPath.isRoot() && !newParentId) {
            continue;
        }

        if (newParentId === null) {
            if (state.rootIds.length > 0) {
                parentsToReload.add(null);
            }
        } else {
            const parent = state.nodes.get(newParentId);
            if (parent) {
                if (parent.childIds.length > 0) {
                    parentsToReload.add(newParentId);
                } else if (!parent.hasChildren) {
                    addTreeNode({ id: newParentId, hasChildren: true });
                }
            }
        }
    }

    for (const parentId of parentsToReload) {
        void reloadParentChildren(parentId).catch(() => undefined);
    }
});

//
// * Content Sorted Handling
//

// The sorted event carries the parents whose childOrder changed; after a manual
// reorder the moved children may appear in the payload too. Refetch instead of
// reordering locally: the server owns the child order. Nodes without loaded
// children are skipped — lazy-load fetches the fresh order on expand.
$contentSorted.subscribe((event) => {
    if (!event?.data) return;

    const state = $treeState.get();
    const parentsToReload = new Set<string>();

    for (const content of event.data) {
        const id = content.getId();
        const node = state.nodes.get(id);
        if (node && node.childIds.length > 0) {
            parentsToReload.add(id);
        }
    }

    for (const parentId of parentsToReload) {
        void reloadParentChildren(parentId).catch(() => undefined);
    }
});
