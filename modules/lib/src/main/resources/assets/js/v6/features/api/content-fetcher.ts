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
    addTreeNodes,
    setTreeChildren,
    appendTreeChildren,
    setNodeLoading,
    setNodeTotalChildren,
    setRootTotalChildren,
    type ContentTreeNodeData,
} from '../store/tree-list.store';
import type {CreateNodeOptions} from '../lib/tree-store';
import {calcWorkflowStateStatus, resolveDisplayName, resolveSubName} from '../utils/cms/content/workflow';

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
 * Sets the filter query for root content.
 * When set, fetchRootChildrenFiltered will use this query instead of listing all root children.
 */
export function setFilterQuery(query: ContentQuery | null): void {
    filterQuery = query;
}

/**
 * Gets the current filter query.
 */
export function getFilterQuery(): ContentQuery | null {
    return filterQuery;
}

/**
 * Checks if a filter is currently set.
 */
export function hasFilter(): boolean {
    return filterQuery !== null;
}

/**
 * Clears the filter query.
 */
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
        // Clone and configure query
        const configuredQuery = new ContentQuery();
        configuredQuery
            .setFrom(offset)
            .setSize(size)
            .setQueryFilters(query.getQueryFilters())
            .setQuery(query.getQuery())
            .setQuerySort(query.getQuerySort())
            .setContentTypeNames(query.getContentTypes())
            .setMustBeReferencedById(query.getMustBeReferencedById());

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
