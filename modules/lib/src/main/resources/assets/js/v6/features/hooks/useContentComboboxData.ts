import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ContentSummary} from '../../../app/content/ContentSummary';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import type {ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import type {ContentTreeSelectorItem} from '../../../app/item/ContentTreeSelectorItem';
import type {PublishStatus} from '../../../app/publish/PublishStatus';
import {ContentSelectorQueryRequest} from '../../../app/resource/ContentSelectorQueryRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ContentTreeSelectorQueryRequest} from '../../../app/resource/ContentTreeSelectorQueryRequest';
import {ChildOrder} from '../../../app/resource/order/ChildOrder';
import type {WorkflowStateStatus} from '../../../app/wizard/WorkflowStateManager';
import type {CreateNodeOptions, FlatNode, UseTreeStoreReturn} from '../lib/tree-store';
import {getLoadingNodeParentId, LOADING_NODE_PREFIX, useTreeStore} from '../lib/tree-store';
import {getContent, setContents} from '../store/content.store';
import {applyContentFilters, type ContentFilterOptions} from '../utils/cms/content/applyContentFilters';
import {resolveDisplayName, resolveSubName} from '../utils/cms/content/prettify';
import {calcWorkflowStateStatus} from '../utils/cms/content/workflow';

//
// * Types
//

// Re-export for consumers
export type {ContentFilterOptions};

/**
 * Node data stored in the tree for each content item.
 */
export type ContentComboboxNodeData = {
    id: string;
    displayName: string;
    name: string;
    publishStatus: PublishStatus;
    workflowStatus: WorkflowStateStatus | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    item: ContentSummaryAndCompareStatus;
    /** Whether this item can be selected (based on server-side filtering logic) */
    selectable: boolean;
};

/**
 * Flat node type for display in virtualized list.
 */
export type ContentComboboxFlatNode = FlatNode<ContentComboboxNodeData>;

/**
 * Options for the useContentComboboxData hook.
 */
export type UseContentComboboxDataOptions = {
    /** Filter options for content requests */
    filters: ContentFilterOptions;
    /** Whether the combobox is currently open */
    isOpen: boolean;
};

/**
 * Return type for the useContentComboboxData hook.
 */
export type UseContentComboboxDataReturn = {
    // Tree data
    tree: UseTreeStoreReturn<ContentComboboxNodeData>;
    treeItems: ContentComboboxFlatNode[];
    isTreeLoading: boolean;
    treeHasMore: boolean;

    // Flat list data (search/list mode)
    flatItems: ContentComboboxFlatNode[];
    isFlatLoading: boolean;
    isFlatLoadingMore: boolean;
    flatHasMore: boolean;

    // Actions
    loadTree: () => Promise<void>;
    loadChildren: (parentId: string) => Promise<void>;
    loadMoreChildren: (parentId: string) => Promise<void>;
    loadMoreRoot: () => Promise<void>;
    search: (query: string) => Promise<void>;
    loadMoreFlat: () => Promise<void>;
    reset: () => void;

    // Error state
    error: Error | null;
    retry: () => void;

    // Internal state for the component
    filterKey: string;
};

//
// * Constants
//

const BATCH_SIZE = 50;

//
// * Fetcher Instance
//

const fetcher = new ContentSummaryAndCompareStatusFetcher();

//
// * Helpers
//

function toNodeData(content: ContentSummaryAndCompareStatus, selectable = true): ContentComboboxNodeData {
    return {
        id: content.getId(),
        displayName: resolveDisplayName(content),
        name: resolveSubName(content),
        publishStatus: content.getPublishStatus(),
        workflowStatus: calcWorkflowStateStatus(content.getContentSummary()),
        contentType: content.getType(),
        iconUrl: content.getContentSummary().getIconUrl(),
        item: content,
        selectable,
    };
}

function toNodeDataFromTreeItem(item: ContentTreeSelectorItem): ContentComboboxNodeData {
    const cachedContent = getContent(item.getId());
    const content = cachedContent ?? item.getContent();
    return {
        id: item.getId(),
        displayName: item.getDisplayName(),
        name: item.getName()?.toString() ?? '',
        publishStatus: content?.getPublishStatus() ?? item.getPublishStatus(),
        workflowStatus: calcWorkflowStateStatus(content?.getContentSummary() ?? item.getContentSummary()),
        contentType: content?.getType() ?? item.getType(),
        iconUrl: content?.getContentSummary()?.getIconUrl() ?? item.getIconUrl(),
        item: content ?? item.getContent(),
        selectable: item.isSelectable(),
    };
}

function toNodeOptionsFromTreeItem(
    item: ContentTreeSelectorItem,
    parentId: string | null,
): CreateNodeOptions<ContentComboboxNodeData> {
    return {
        id: item.getId(),
        data: toNodeDataFromTreeItem(item),
        parentId,
        hasChildren: item.isExpandable(),
    };
}

function createDefaultChildOrder(): ChildOrder {
    return fetcher.createRootChildOrder();
}

/**
 * Creates a stable filter key for dependency tracking.
 * Arrays are sorted to ensure consistent keys regardless of order.
 */
function createFilterKey(filters: ContentFilterOptions): string {
    return JSON.stringify({
        contextContent: filters.contextContent?.getId(),
        contentTypeNames: filters.contentTypeNames ? [...filters.contentTypeNames].sort() : undefined,
        allowedContentPaths: filters.allowedContentPaths ? [...filters.allowedContentPaths].sort() : undefined,
        applicationKey: filters.applicationKey?.toString(),
    });
}

//
// * Hook
//

/**
 * Hook for managing content combobox data loading.
 * Handles tree and flat list data, pagination, search, and error handling.
 */
export function useContentComboboxData(
    options: UseContentComboboxDataOptions,
): UseContentComboboxDataReturn {
    const {filters, isOpen} = options;

    // Create stable filter key for dependency tracking
    const filterKey = useMemo(() => createFilterKey(filters), [filters]);

    // Ref to access current filters without adding to callback dependencies.
    // The filter reset effect handles filter changes by resetting treeInitialized,
    // which triggers re-initialization with the new filters.
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    // Tree state
    const tree = useTreeStore<ContentComboboxNodeData>();
    const [treeInitialized, setTreeInitialized] = useState(false);
    const [totalRootChildren, setTotalRootChildren] = useState<number | undefined>(undefined);

    // Destructure stable action/selector references from tree to use in callbacks
    const {
        setLoading: treeSetLoading,
        setNodes: treeSetNodes,
        setRootIds: treeSetRootIds,
        setChildren: treeSetChildren,
        appendChildren: treeAppendChildren,
        setNode: treeSetNode,
        clear: treeClear,
        getNode: treeGetNode,
        hasMoreChildren: treeHasMoreChildren,
        isLoading: treeIsLoading,
    } = tree;

    // Flat list state
    const [flatItems, setFlatItems] = useState<ContentComboboxFlatNode[]>([]);
    const [isFlatLoading, setIsFlatLoading] = useState(false);
    const [isFlatLoadingMore, setIsFlatLoadingMore] = useState(false);
    const flatFromRef = useRef(0);
    const [flatTotalHits, setFlatTotalHits] = useState<number | undefined>(undefined);
    const currentSearchQueryRef = useRef<string>('');

    // Request tracking for stale request handling
    const treeRequestIdRef = useRef(0);
    const flatRequestIdRef = useRef(0);
    const enrichTreeContents = useCallback(async (
        contents: ContentSummaryAndCompareStatus[],
        requestId: number,
    ): Promise<ContentSummaryAndCompareStatus[]> => {
        if (contents.length === 0) {
            return contents;
        }

        const summaries = contents
            .map((content) => content?.getContentSummary())
            .filter((summary): summary is ContentSummary => !!summary);

        if (summaries.length === 0) {
            return contents;
        }

        try {
            const enriched = await fetcher.updateReadonlyAndCompareStatus(summaries);
            if (requestId !== treeRequestIdRef.current) {
                return contents;
            }
            return enriched;
        } catch (error) {
            console.error(error);
            return contents;
        }
    }, [treeRequestIdRef]);

    // Error state
    const [error, setError] = useState<Error | null>(null);
    const lastActionRef = useRef<(() => Promise<void>) | null>(null);

    // Computed values
    const treeHasMore = useMemo(() => {
        if (totalRootChildren === undefined) return false;
        return tree.state.rootIds.length < totalRootChildren;
    }, [tree.state.rootIds.length, totalRootChildren]);

    const flatHasMore = useMemo(() => {
        if (flatTotalHits === undefined) return false;
        const nodeCount = flatItems.filter(item => item.nodeType === 'node').length;
        return nodeCount < flatTotalHits;
    }, [flatItems, flatTotalHits]);

    const treeItems = useMemo((): ContentComboboxFlatNode[] => {
        const nodes = tree.flatNodes as ContentComboboxFlatNode[];

        // Add root loading node if there are more root items
        if (treeHasMore) {
            const offset = tree.state.rootIds.length;
            const loadingNode: ContentComboboxFlatNode = {
                id: `${LOADING_NODE_PREFIX}root__${offset}`,
                data: null,
                level: 1,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                isLoading: treeIsLoading(null),
                isLoadingData: false,
                nodeType: 'loading',
            };
            return [...nodes, loadingNode];
        }

        return nodes;
    }, [tree.flatNodes, tree.state.rootIds.length, treeHasMore, treeIsLoading]);

    const isTreeLoading = treeIsLoading(null);

    // Reset state when filters change
    useEffect(() => {
        // Increment request IDs to invalidate in-flight requests
        treeRequestIdRef.current++;
        flatRequestIdRef.current++;

        // Reset tree state using clear() to properly clear expandedIds
        treeClear();
        setTotalRootChildren(undefined);
        setTreeInitialized(false);

        // Reset flat list state
        setFlatItems([]);
        setFlatTotalHits(undefined);
        flatFromRef.current = 0;
        currentSearchQueryRef.current = '';

        // Reset error
        setError(null);
    }, [filterKey, treeClear]);

    // Load root content for tree view
    const loadTree = useCallback(async (): Promise<void> => {
        const currentRequestId = ++treeRequestIdRef.current;
        treeSetLoading(null, true);
        setError(null);

        try {
            const request = new ContentTreeSelectorQueryRequest<ContentTreeSelectorItem>();
            request.setFrom(0);
            request.setSize(BATCH_SIZE);
            request.setExpand(Expand.SUMMARY);
            request.setParentPath(null);
            request.setChildOrder(createDefaultChildOrder());
            applyContentFilters(request, filtersRef.current);

            const items = await request.sendAndParse();
            const metadata = request.getMetadata();

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            const contents = items
                .map((item) => item.getContent())
                .filter((content): content is ContentSummaryAndCompareStatus => !!content);
            const contentsWithStatus = await enrichTreeContents(contents, currentRequestId);

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            // Update global cache
            setContents(contentsWithStatus);

            // Update local tree state
            const nodeOptions = items.map((item) => toNodeOptionsFromTreeItem(item, null));
            treeSetNodes(nodeOptions);
            treeSetRootIds(items.map((item) => item.getId()));
            setTotalRootChildren(metadata.getTotalHits());
            setTreeInitialized(true);
        } catch (err) {
            if (currentRequestId === treeRequestIdRef.current) {
                setError(err instanceof Error ? err : new Error('Failed to load content'));
                lastActionRef.current = loadTree;
            }
        } finally {
            if (currentRequestId === treeRequestIdRef.current) {
                treeSetLoading(null, false);
            }
        }
    }, [treeSetLoading, treeSetNodes, treeSetRootIds]);

    // Load more root items for tree pagination
    const loadMoreRoot = useCallback(async (): Promise<void> => {
        if (!treeHasMore || treeIsLoading(null)) return;

        const currentRequestId = ++treeRequestIdRef.current;
        treeSetLoading(null, true);
        setError(null);

        try {
            const offset = tree.state.rootIds.length;

            const request = new ContentTreeSelectorQueryRequest<ContentTreeSelectorItem>();
            request.setFrom(offset);
            request.setSize(BATCH_SIZE);
            request.setExpand(Expand.SUMMARY);
            request.setParentPath(null);
            request.setChildOrder(createDefaultChildOrder());
            applyContentFilters(request, filtersRef.current);

            const items = await request.sendAndParse();

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            const contents = items
                .map((item) => item.getContent())
                .filter((content): content is ContentSummaryAndCompareStatus => !!content);
            const contentsWithStatus = await enrichTreeContents(contents, currentRequestId);

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            // Update global cache
            setContents(contentsWithStatus);

            // Append to tree state
            const nodeOptions = items.map((item) => toNodeOptionsFromTreeItem(item, null));
            treeSetNodes(nodeOptions);
            const newRootIds = [...tree.state.rootIds, ...items.map((item) => item.getId())];
            treeSetRootIds(newRootIds);
        } catch (err) {
            if (currentRequestId === treeRequestIdRef.current) {
                setError(err instanceof Error ? err : new Error('Failed to load more content'));
                lastActionRef.current = loadMoreRoot;
            }
        } finally {
            if (currentRequestId === treeRequestIdRef.current) {
                treeSetLoading(null, false);
            }
        }
    }, [tree.state.rootIds, treeHasMore, treeIsLoading, treeSetLoading, treeSetNodes, treeSetRootIds]);

    // Load children for a parent node
    const loadChildren = useCallback(async (parentId: string): Promise<void> => {
        const currentRequestId = ++treeRequestIdRef.current;
        treeSetLoading(parentId, true);
        setError(null);

        try {
            const parentNode = treeGetNode(parentId);
            const parentContent = parentNode?.data?.item?.getContentSummary();

            const request = new ContentTreeSelectorQueryRequest<ContentTreeSelectorItem>();
            request.setFrom(0);
            request.setSize(BATCH_SIZE);
            request.setExpand(Expand.SUMMARY);

            if (parentContent) {
                request.setParentPath(parentContent.getPath());
                request.setChildOrder(parentContent.getChildOrder());
            }

            applyContentFilters(request, filtersRef.current);

            const items = await request.sendAndParse();
            const metadata = request.getMetadata();
            const totalChildren = metadata.getTotalHits();

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            const contents = items
                .map((item) => item.getContent())
                .filter((content): content is ContentSummaryAndCompareStatus => !!content);
            const contentsWithStatus = await enrichTreeContents(contents, currentRequestId);

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            // Update global cache
            setContents(contentsWithStatus);

            // Update tree state
            const nodeOptions = items.map((item) => toNodeOptionsFromTreeItem(item, parentId));
            treeSetNodes(nodeOptions);
            treeSetChildren(parentId, items.map((item) => item.getId()));
            treeSetNode({id: parentId, totalChildren});
        } catch (err) {
            if (currentRequestId === treeRequestIdRef.current) {
                setError(err instanceof Error ? err : new Error('Failed to load children'));
                lastActionRef.current = () => loadChildren(parentId);
            }
        } finally {
            if (currentRequestId === treeRequestIdRef.current) {
                treeSetLoading(parentId, false);
            }
        }
    }, [treeSetLoading, treeGetNode, treeSetNodes, treeSetChildren, treeSetNode]);

    // Load more children for pagination
    const loadMoreChildren = useCallback(async (parentId: string): Promise<void> => {
        if (!treeHasMoreChildren(parentId) || treeIsLoading(parentId)) return;

        const node = treeGetNode(parentId);
        if (!node) return;

        const currentRequestId = ++treeRequestIdRef.current;
        treeSetLoading(parentId, true);
        setError(null);

        try {
            const offset = node.childIds.length;
            const parentContent = node.data?.item?.getContentSummary();

            const request = new ContentTreeSelectorQueryRequest<ContentTreeSelectorItem>();
            request.setFrom(offset);
            request.setSize(BATCH_SIZE);
            request.setExpand(Expand.SUMMARY);

            if (parentContent) {
                request.setParentPath(parentContent.getPath());
                request.setChildOrder(parentContent.getChildOrder());
            }

            applyContentFilters(request, filtersRef.current);

            const items = await request.sendAndParse();

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            const contents = items
                .map((item) => item.getContent())
                .filter((content): content is ContentSummaryAndCompareStatus => !!content);
            const contentsWithStatus = await enrichTreeContents(contents, currentRequestId);

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            // Update global cache
            setContents(contentsWithStatus);

            // Append to tree state
            const nodeOptions = items.map((item) => toNodeOptionsFromTreeItem(item, parentId));
            treeSetNodes(nodeOptions);
            treeAppendChildren(parentId, items.map((item) => item.getId()));
        } catch (err) {
            if (currentRequestId === treeRequestIdRef.current) {
                setError(err instanceof Error ? err : new Error('Failed to load more children'));
                lastActionRef.current = () => loadMoreChildren(parentId);
            }
        } finally {
            if (currentRequestId === treeRequestIdRef.current) {
                treeSetLoading(parentId, false);
            }
        }
    }, [treeHasMoreChildren, treeIsLoading, treeGetNode, treeSetLoading, treeSetNodes, treeAppendChildren]);

    // Search / load flat list content
    const search = useCallback(async (query: string): Promise<void> => {
        const currentRequestId = ++flatRequestIdRef.current;
        currentSearchQueryRef.current = query;
        flatFromRef.current = 0;

        setIsFlatLoading(true);
        setError(null);

        try {
            const request = new ContentSelectorQueryRequest<ContentSummaryJson, ContentSummary>();
            request.setFrom(0);
            request.setSize(BATCH_SIZE);
            request.setExpand(Expand.SUMMARY);
            request.setSearchString(query);
            request.setAppendLoadResults(false);
            applyContentFilters(request, filtersRef.current);

            const contents = await request.sendAndParse();
            const metadata = request.getMetadata();

            // Stale request check
            if (currentRequestId !== flatRequestIdRef.current) return;

            const contentsWithStatus = await fetcher.updateReadonlyAndCompareStatus(contents);

            if (currentRequestId !== flatRequestIdRef.current) return;

            // Update global cache
            setContents(contentsWithStatus);

            // Convert to flat nodes
            const flatNodes: ContentComboboxFlatNode[] = contentsWithStatus.map((content) => ({
                id: content.getId(),
                data: toNodeData(content, true),
                level: 0,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                isLoading: false,
                isLoadingData: false,
                nodeType: 'node' as const,
            }));

            flatFromRef.current = metadata.getHits();
            setFlatTotalHits(metadata.getTotalHits());
            setFlatItems(flatNodes);
        } catch (err) {
            if (currentRequestId === flatRequestIdRef.current) {
                setError(err instanceof Error ? err : new Error('Search failed'));
                lastActionRef.current = () => search(query);
            }
        } finally {
            if (currentRequestId === flatRequestIdRef.current) {
                setIsFlatLoading(false);
            }
        }
    }, []);

    // Load more flat list items
    const loadMoreFlat = useCallback(async (): Promise<void> => {
        if (!flatHasMore || isFlatLoading || isFlatLoadingMore) return;

        const currentRequestId = ++flatRequestIdRef.current;
        const query = currentSearchQueryRef.current;

        setIsFlatLoadingMore(true);
        setError(null);

        try {
            const request = new ContentSelectorQueryRequest<ContentSummaryJson, ContentSummary>();
            request.setFrom(flatFromRef.current);
            request.setSize(BATCH_SIZE);
            request.setExpand(Expand.SUMMARY);
            request.setSearchString(query);
            request.setAppendLoadResults(false);
            applyContentFilters(request, filtersRef.current);

            const contents = await request.sendAndParse();
            const metadata = request.getMetadata();

            // Stale request check
            if (currentRequestId !== flatRequestIdRef.current) return;

            const contentsWithStatus = await fetcher.updateReadonlyAndCompareStatus(contents);

            if (currentRequestId !== flatRequestIdRef.current) return;

            // Update global cache
            setContents(contentsWithStatus);

            // Convert to flat nodes
            const flatNodes: ContentComboboxFlatNode[] = contentsWithStatus.map((content) => ({
                id: content.getId(),
                data: toNodeData(content, true),
                level: 0,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                isLoading: false,
                isLoadingData: false,
                nodeType: 'node' as const,
            }));

            flatFromRef.current += metadata.getHits();
            setFlatItems(prev => [...prev.filter(n => n.nodeType === 'node'), ...flatNodes]);
        } catch (err) {
            if (currentRequestId === flatRequestIdRef.current) {
                setError(err instanceof Error ? err : new Error('Failed to load more'));
                lastActionRef.current = loadMoreFlat;
            }
        } finally {
            if (currentRequestId === flatRequestIdRef.current) {
                setIsFlatLoadingMore(false);
            }
        }
    }, [flatHasMore, isFlatLoading, isFlatLoadingMore]);

    // Reset all state
    const reset = useCallback(() => {
        treeRequestIdRef.current++;
        flatRequestIdRef.current++;

        treeClear();
        setTotalRootChildren(undefined);
        setTreeInitialized(false);

        setFlatItems([]);
        setFlatTotalHits(undefined);
        flatFromRef.current = 0;
        currentSearchQueryRef.current = '';

        setError(null);
    }, [treeClear]);

    // Retry last failed action
    const retry = useCallback(() => {
        if (lastActionRef.current) {
            void lastActionRef.current();
        }
    }, []);

    // Initialize tree when opened
    useEffect(() => {
        if (isOpen && !treeInitialized) {
            void loadTree();
        }
    }, [isOpen, treeInitialized, loadTree]);

    return {
        tree,
        treeItems,
        isTreeLoading,
        treeHasMore,
        flatItems,
        isFlatLoading,
        isFlatLoadingMore,
        flatHasMore,
        loadTree,
        loadChildren,
        loadMoreChildren,
        loadMoreRoot,
        search,
        loadMoreFlat,
        reset,
        error,
        retry,
        filterKey,
    };
}

// Re-export helper function for loading node detection
export {getLoadingNodeParentId};
