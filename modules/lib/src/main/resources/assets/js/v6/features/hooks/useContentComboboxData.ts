import type {ApplicationKey} from '@enonic/lib-admin-ui/application/ApplicationKey';
import {Expand} from '@enonic/lib-admin-ui/rest/Expand';
import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import type {ContentSummary} from '../../../app/content/ContentSummary';
import type {ContentSummaryJson} from '../../../app/content/ContentSummaryJson';
import type {ContentTreeSelectorItem} from '../../../app/item/ContentTreeSelectorItem';
import type {PublishStatus} from '../../../app/publish/PublishStatus';
import {ContentSelectorQueryRequest} from '../../../app/resource/ContentSelectorQueryRequest';
import {ContentSummaryAndCompareStatusFetcher} from '../../../app/resource/ContentSummaryAndCompareStatusFetcher';
import {ContentTreeSelectorQueryRequest} from '../../../app/resource/ContentTreeSelectorQueryRequest';
import {type ChildOrder} from '../../../app/resource/order/ChildOrder';
import type {CreateNodeOptions, FlatNode, UseTreeStoreReturn} from '../lib/tree-store';
import {getLoadingNodeParentId, LOADING_NODE_PREFIX, useTreeStore} from '../lib/tree-store';
import {getContent, setContents} from '../store/content.store';
import {
    $contentArchived,
    $contentCreated,
    $contentDeleted,
    $contentDuplicated,
    $contentMoved,
    $contentPublished,
    $contentRenamed,
    $contentSorted,
    $contentUnpublished,
    $contentUpdated,
} from '../store/socket.store';
import {applyContentFilters, type ContentFilterOptions} from '../utils/cms/content/applyContentFilters';
import type {ContentState} from '../../../app/content/ContentState';
import {resolveDisplayName, resolveSubName} from '../utils/cms/content/prettify';
import {calcContentState} from '../utils/cms/content/workflow';
import {calcTreePublishStatus} from '../utils/cms/content/status';

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
    contentState: ContentState | null;
    contentType: ContentTypeName;
    iconUrl: string | null;
    item: ContentSummary;
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

function toNodeData(summary: ContentSummary, selectable = true): ContentComboboxNodeData {
    return {
        id: summary.getId(),
        displayName: resolveDisplayName(summary),
        name: resolveSubName(summary),
        publishStatus: calcTreePublishStatus(summary),
        contentState: calcContentState(summary),
        contentType: summary.getType(),
        iconUrl: summary.getIconUrl(),
        item: summary,
        selectable,
    };
}

function toNodeDataFromTreeItem(item: ContentTreeSelectorItem): ContentComboboxNodeData {
    const cachedContent = getContent(item.getId());
    const summary = cachedContent ?? item.getContent()?.getContentSummary() ?? item.getContentSummary();
    return {
        id: item.getId(),
        displayName: item.getDisplayName(),
        name: item.getName()?.toString() ?? '',
        publishStatus: summary ? calcTreePublishStatus(summary) : item.getPublishStatus(),
        contentState: calcContentState(summary ?? item.getContentSummary()),
        contentType: summary?.getType() ?? item.getType(),
        iconUrl: summary?.getIconUrl() ?? item.getIconUrl(),
        item: summary ?? item.getContentSummary(),
        selectable: item.isSelectable(),
    };
}

function toNodeOptionsFromTreeItem(item: ContentTreeSelectorItem, parentId: string | null): CreateNodeOptions<ContentComboboxNodeData> {
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

function deduplicateById<T extends {getId(): string}>(items: T[]): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        const id = item.getId();
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
    });
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
export function useContentComboboxData(options: UseContentComboboxDataOptions): UseContentComboboxDataReturn {
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
    const enrichReadonly = useCallback(
        async (summaries: ContentSummary[], requestId: number): Promise<ContentSummary[]> => {
            if (summaries.length === 0) {
                return summaries;
            }

            try {
                const enriched = await fetcher.updateReadOnly(summaries);
                if (requestId !== treeRequestIdRef.current) {
                    return summaries;
                }
                return enriched;
            } catch (error) {
                console.error(error);
                return summaries;
            }
        },
        []
    );

    const enrichAndCache = useCallback(
        async (items: ContentTreeSelectorItem[], requestId: number): Promise<boolean> => {
            const summaries = items
                .map((item) => item.getContent()?.getContentSummary())
                .filter((summary): summary is ContentSummary => !!summary);
            const enriched = await enrichReadonly(summaries, requestId);
            if (requestId !== treeRequestIdRef.current) return false;
            setContents(enriched);
            return true;
        },
        [enrichReadonly]
    );

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
        const nodeCount = flatItems.filter((item) => item.nodeType === 'node').length;
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

            const rawItems = await request.sendAndParse();
            const metadata = request.getMetadata();
            const items = deduplicateById(rawItems);

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            if (!(await enrichAndCache(items, currentRequestId))) return;

            // Update local tree state
            const nodeOptions = items.map((item) => toNodeOptionsFromTreeItem(item, null));
            treeSetNodes(nodeOptions);
            treeSetRootIds(items.map((item) => item.getId()));
            // Server totalHits may count matching leaves, not unique parents.
            // If dedup reduced count, cap total to prevent infinite "load more".
            const hasDuplicates = items.length < rawItems.length;
            setTotalRootChildren(hasDuplicates ? items.length : metadata.getTotalHits());
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
    }, [enrichAndCache, treeSetLoading, treeSetNodes, treeSetRootIds]);

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

            const rawItems = await request.sendAndParse();
            const items = deduplicateById(rawItems);

            // Stale request check
            if (currentRequestId !== treeRequestIdRef.current) return;

            if (!(await enrichAndCache(items, currentRequestId))) return;

            // Append to tree state, filtering out IDs already present
            const existingRootIds = new Set(tree.state.rootIds);
            const newItems = items.filter((item) => !existingRootIds.has(item.getId()));
            const nodeOptions = newItems.map((item) => toNodeOptionsFromTreeItem(item, null));
            treeSetNodes(nodeOptions);
            const newRootIds = [...tree.state.rootIds, ...newItems.map((item) => item.getId())];
            treeSetRootIds(newRootIds);

            // If dedup or filtering removed items, server total is unreliable — stop pagination
            if (newItems.length < rawItems.length) {
                setTotalRootChildren(newRootIds.length);
            }
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
    }, [enrichAndCache, tree.state.rootIds, treeHasMore, treeIsLoading, treeSetLoading, treeSetNodes, treeSetRootIds]);

    // Load children for a parent node
    const loadChildren = useCallback(
        async (parentId: string): Promise<void> => {
            const currentRequestId = ++treeRequestIdRef.current;
            treeSetLoading(parentId, true);
            setError(null);

            try {
                const parentNode = treeGetNode(parentId);
                const parentContent = parentNode?.data?.item;

                const request = new ContentTreeSelectorQueryRequest<ContentTreeSelectorItem>();
                request.setFrom(0);
                request.setSize(BATCH_SIZE);
                request.setExpand(Expand.SUMMARY);

                if (parentContent) {
                    request.setParentPath(parentContent.getPath());
                    request.setChildOrder(parentContent.getChildOrder());
                }

                applyContentFilters(request, filtersRef.current);

                const rawItems = await request.sendAndParse();
                const metadata = request.getMetadata();
                const items = deduplicateById(rawItems);
                const hasDuplicates = items.length < rawItems.length;
                const totalChildren = hasDuplicates ? items.length : metadata.getTotalHits();

                // Stale request check
                if (currentRequestId !== treeRequestIdRef.current) return;

                if (!(await enrichAndCache(items, currentRequestId))) return;

                // Update tree state
                const nodeOptions = items.map((item) => toNodeOptionsFromTreeItem(item, parentId));
                treeSetNodes(nodeOptions);
                treeSetChildren(
                    parentId,
                    items.map((item) => item.getId())
                );
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
        },
        [enrichAndCache, treeSetLoading, treeGetNode, treeSetNodes, treeSetChildren, treeSetNode]
    );

    // Load more children for pagination
    const loadMoreChildren = useCallback(
        async (parentId: string): Promise<void> => {
            if (!treeHasMoreChildren(parentId) || treeIsLoading(parentId)) return;

            const node = treeGetNode(parentId);
            if (!node) return;

            const currentRequestId = ++treeRequestIdRef.current;
            treeSetLoading(parentId, true);
            setError(null);

            try {
                const offset = node.childIds.length;
                const parentContent = node.data?.item;

                const request = new ContentTreeSelectorQueryRequest<ContentTreeSelectorItem>();
                request.setFrom(offset);
                request.setSize(BATCH_SIZE);
                request.setExpand(Expand.SUMMARY);

                if (parentContent) {
                    request.setParentPath(parentContent.getPath());
                    request.setChildOrder(parentContent.getChildOrder());
                }

                applyContentFilters(request, filtersRef.current);

                const rawItems = await request.sendAndParse();
                const items = deduplicateById(rawItems);

                // Stale request check
                if (currentRequestId !== treeRequestIdRef.current) return;

                if (!(await enrichAndCache(items, currentRequestId))) return;

                // Append to tree state, filtering out already-known childIds
                const existingChildIds = new Set(node.childIds);
                const newItems = items.filter((item) => !existingChildIds.has(item.getId()));
                const nodeOptions = newItems.map((item) => toNodeOptionsFromTreeItem(item, parentId));
                treeSetNodes(nodeOptions);
                treeAppendChildren(
                    parentId,
                    newItems.map((item) => item.getId())
                );

                // If dedup or filtering removed items, cap totalChildren to stop pagination
                if (newItems.length < rawItems.length) {
                    treeSetNode({id: parentId, totalChildren: node.childIds.length + newItems.length});
                }
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
        },
        [enrichAndCache, treeHasMoreChildren, treeIsLoading, treeGetNode, treeSetLoading, treeSetNodes, treeAppendChildren]
    );

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

            const summaries = await fetcher.updateReadOnly(contents);

            if (currentRequestId !== flatRequestIdRef.current) return;

            // Update global cache
            setContents(summaries);

            // Convert to flat nodes
            const flatNodes: ContentComboboxFlatNode[] = summaries.map((summary) => ({
                id: summary.getId(),
                data: toNodeData(summary, true),
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

            const summaries = await fetcher.updateReadOnly(contents);

            if (currentRequestId !== flatRequestIdRef.current) return;

            // Update global cache
            setContents(summaries);

            // Convert to flat nodes
            const flatNodes: ContentComboboxFlatNode[] = summaries.map((summary) => ({
                id: summary.getId(),
                data: toNodeData(summary, true),
                level: 0,
                parentId: null,
                hasChildren: false,
                isExpanded: false,
                isLoading: false,
                isLoadingData: false,
                nodeType: 'node' as const,
            }));

            flatFromRef.current += metadata.getHits();
            setFlatItems((prev) => [...prev.filter((n) => n.nodeType === 'node'), ...flatNodes]);
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

    // Socket sync: update existing nodes in tree and flat list
    const applyInPlaceUpdates = useCallback(
        (items: ContentSummary[]) => {
            for (const item of items) {
                const id = item.getId();
                const existing = treeGetNode(id);
                if (existing) {
                    tree.setNodeData(id, toNodeData(item, existing.data?.selectable ?? true));
                }
            }

            setFlatItems((prev) => {
                const updatedIds = new Map(
                    items.map((item) => [item.getId(), item] as const)
                );
                let changed = false;
                const next = prev.map((node) => {
                    const updated = updatedIds.get(node.id);
                    if (updated && node.data) {
                        changed = true;
                        return {...node, data: toNodeData(updated, node.data.selectable)};
                    }
                    return node;
                });
                return changed ? next : prev;
            });
        },
        [tree, treeGetNode]
    );

    // Socket sync: remove deleted/archived nodes from tree and flat list
    const removeFromDropdown = useCallback(
        (ids: string[]) => {
            tree.removeNodes(ids, true);

            setFlatItems((prev) => {
                const idSet = new Set(ids);
                const next = prev.filter((node) => !idSet.has(node.id));
                return next.length === prev.length ? prev : next;
            });
        },
        [tree]
    );

    // Socket sync: invalidate tree on structural changes (create/move/sort/duplicate)
    const invalidateTree = useCallback(() => {
        treeRequestIdRef.current++;
        treeClear();
        setTotalRootChildren(undefined);
        setTreeInitialized(false);
    }, [treeClear]);

    // Subscribe to socket events for live dropdown sync
    useEffect(() => {
        // In-place data updates
        const unlistenUpdated = $contentUpdated.listen((event) => {
            if (event?.data) applyInPlaceUpdates(event.data);
        });
        const unlistenPublished = $contentPublished.listen((event) => {
            if (event?.data) applyInPlaceUpdates(event.data);
        });
        const unlistenUnpublished = $contentUnpublished.listen((event) => {
            if (event?.data) applyInPlaceUpdates(event.data);
        });
        const unlistenRenamed = $contentRenamed.listen((event) => {
            if (event?.data?.items) applyInPlaceUpdates(event.data.items);
        });

        // Remove from tree + flat
        const unlistenDeleted = $contentDeleted.listen((event) => {
            if (event?.data) {
                removeFromDropdown(event.data.map((item) => item.getContentId().toString()));
            }
        });
        const unlistenArchived = $contentArchived.listen((event) => {
            if (event?.data) {
                removeFromDropdown(event.data.map((item) => item.getContentId().toString()));
            }
        });

        // Invalidate tree (structural changes)
        const unlistenCreated = $contentCreated.listen((event) => {
            if (event?.data) invalidateTree();
        });
        const unlistenDuplicated = $contentDuplicated.listen((event) => {
            if (event?.data) invalidateTree();
        });
        const unlistenMoved = $contentMoved.listen((event) => {
            if (event?.data) invalidateTree();
        });
        const unlistenSorted = $contentSorted.listen((event) => {
            if (event?.data) invalidateTree();
        });

        return () => {
            unlistenUpdated();
            unlistenPublished();
            unlistenUnpublished();
            unlistenRenamed();
            unlistenDeleted();
            unlistenArchived();
            unlistenCreated();
            unlistenDuplicated();
            unlistenMoved();
            unlistenSorted();
        };
    }, [applyInPlaceUpdates, removeFromDropdown, invalidateTree]);

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
