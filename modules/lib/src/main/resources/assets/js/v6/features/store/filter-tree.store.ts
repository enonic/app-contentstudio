import {atom, computed} from 'nanostores';
import {
    createEmptyState,
    setNode,
    setNodes,
    setRootIds,
    setChildren,
    appendChildren,
    setLoading,
    setLoadingData,
    expand,
    collapse,
    flattenTree,
    needsChildrenLoad,
    removeNodes,
    type TreeState,
    type FlatNode,
    type CreateNodeOptions,
    ROOT_LOADING_KEY,
} from '../lib/tree-store';
import {$contentCache} from './content.store';
import {$contentDeleted, $contentArchived, $contentCreated, $contentDuplicated} from './socket.store';
import type {ContentData} from '../views/browse/grid/ContentData';
import {convertToContentFlatNode} from './tree/utils';
import type {ContentTreeNodeData, LoadingStateValue} from './tree/types';

//
// * Store
//

/** Filter tree state - reset on each filter change */
export const $filterTreeState = atom<TreeState<ContentTreeNodeData>>(createEmptyState<ContentTreeNodeData>());

/** Root-level total children count for filter pagination */
const $filterRootTotalChildren = atom<number | undefined>(undefined);

//
// * Computed Stores
//

/** Flattened filter tree nodes for virtualized rendering */
export const $filterFlatNodes = computed($filterTreeState, flattenTree);

/**
 * Merged filter nodes with content data.
 * Note: No uploads in filter view - only shows search results.
 * Appends a loading node when more filter results are available.
 */
export const $filterMergedFlatNodes = computed(
    [$filterFlatNodes, $contentCache, $filterRootTotalChildren, $filterTreeState],
    (flatNodes, cache, totalChildren, state) => {
        const result = flatNodes.map((node) => convertToContentFlatNode(node, cache));

        // Add loading node if more results exist
        const rootIdsCount = state.rootIds.length;
        const isLoadingRoot = state.loadingIds.has(ROOT_LOADING_KEY);

        if (totalChildren !== undefined && rootIdsCount < totalChildren && rootIdsCount > 0) {
            result.push({
                id: '__filter_load_more__',
                nodeType: 'loading',
                level: 0,
                isExpanded: false,
                isLoading: isLoadingRoot,
                isLoadingData: false,
                hasChildren: false,
                parentId: null,
                data: null,
            } as FlatNode<ContentData>);
        }

        return result;
    }
);

//
// * Actions
//

export function setFilterTreeState(state: TreeState<ContentTreeNodeData>): void {
    $filterTreeState.set(state);
}

export function updateFilterTreeState(updater: (state: TreeState<ContentTreeNodeData>) => TreeState<ContentTreeNodeData>): void {
    $filterTreeState.set(updater($filterTreeState.get()));
}

export function addFilterNode(options: CreateNodeOptions<ContentTreeNodeData>): void {
    updateFilterTreeState((state) => setNode(state, options));
}

export function addFilterNodes(nodes: CreateNodeOptions<ContentTreeNodeData>[]): void {
    if (nodes.length === 0) return;
    updateFilterTreeState((state) => setNodes(state, nodes));
}

export function setFilterRootIds(ids: string[]): void {
    updateFilterTreeState((state) => setRootIds(state, ids));
}

export function appendFilterRootIds(ids: string[]): void {
    if (ids.length === 0) return;
    updateFilterTreeState((state) => {
        const newRootIds = [...state.rootIds, ...ids];
        return setRootIds(state, newRootIds);
    });
}

export function setFilterChildren(parentId: string | null, childIds: string[]): void {
    updateFilterTreeState((state) => setChildren(state, parentId, childIds));
}

export function appendFilterChildren(parentId: string | null, childIds: string[]): void {
    if (childIds.length === 0) return;
    updateFilterTreeState((state) => appendChildren(state, parentId, childIds));
}

export function expandFilterNode(id: string): void {
    updateFilterTreeState((state) => expand(state, id));
}

export function collapseFilterNode(id: string): void {
    updateFilterTreeState((state) => collapse(state, id));
}

export function setFilterNodeLoading(id: string | null, loading: boolean): void {
    updateFilterTreeState((state) => setLoading(state, id, loading));
}

export function setFilterNodesLoadingData(ids: string[], loading: boolean): void {
    updateFilterTreeState((state) => setLoadingData(state, ids, loading));
}

export function setFilterNodeTotalChildren(id: string, totalChildren: number): void {
    updateFilterTreeState((state) => setNode(state, {id, totalChildren}));
}

export function filterNodeNeedsChildrenLoad(id: string): boolean {
    return needsChildrenLoad($filterTreeState.get(), id);
}

export function resetFilterTree(): void {
    $filterTreeState.set(createEmptyState<ContentTreeNodeData>());
    $filterRootTotalChildren.set(undefined);
}

export function setFilterRootTotalChildren(total: number): void {
    $filterRootTotalChildren.set(total);
}

export function getFilterRootTotalChildren(): number | undefined {
    return $filterRootTotalChildren.get();
}

export function filterRootHasMoreChildren(): boolean {
    const total = $filterRootTotalChildren.get();
    if (total === undefined) return false;
    const rootIds = $filterTreeState.get().rootIds;
    return rootIds.length < total;
}

//
// * Computed Loading States
//

/**
 * Filter loading state for UI components.
 * Returns 'loading' while filter results are being fetched, 'ok' otherwise.
 */
export const $filterLoadingState = computed($filterTreeState, (state): LoadingStateValue => {
    return state.loadingIds.has(ROOT_LOADING_KEY) ? 'loading' : 'ok';
});

//
// * Socket Event Subscriptions (self-initializing at module load)
//
// Note on removal behavior asymmetry with main tree (tree-list.store.ts):
// - Filter tree: Simple node removal without parent cleanup
// - Main tree: Removes nodes AND updates parent hasChildren/collapse state
//
// This is intentional because filter results are a flat query result.
// Parent-child relationships in filter tree are for display hierarchy only,
// not for managing tree structure state like the main tree.
//

$contentDeleted.subscribe((event) => {
    if (!event?.data) return;
    const ids = event.data.map((item) => item.getContentId().toString());

    updateFilterTreeState((state) => {
        const idsToRemove = ids.filter((id) => state.nodes.has(id));
        if (idsToRemove.length === 0) return state;
        return removeNodes(state, idsToRemove, true);
    });
});

$contentArchived.subscribe((event) => {
    if (!event?.data) return;
    const ids = event.data.map((item) => item.getContentId().toString());

    updateFilterTreeState((state) => {
        const idsToRemove = ids.filter((id) => state.nodes.has(id));
        if (idsToRemove.length === 0) return state;
        return removeNodes(state, idsToRemove, true);
    });
});

//
// * Filter Refresh Signal
//
// When content is created or duplicated, the filter results may be stale.
// This atom signals that the filter should be refreshed. Components with
// access to the current filter query can subscribe and call activateFilter().
//
// Note: We don't import $isFilterActive here to avoid circular dependency
// with active-tree.store.ts. Consumers should check filter state themselves.
//

/** Timestamp of last content change that may affect filter results */
export const $filterRefreshNeeded = atom<number>(0);

/** Clears the filter refresh signal (call after refreshing) */
export function clearFilterRefreshNeeded(): void {
    $filterRefreshNeeded.set(0);
}

// Content created - filter may need refresh to include new item
$contentCreated.subscribe((event) => {
    if (event?.data) {
        $filterRefreshNeeded.set(Date.now());
    }
});

// Content duplicated - filter may need refresh to include duplicate
$contentDuplicated.subscribe((event) => {
    if (event?.data) {
        $filterRefreshNeeded.set(Date.now());
    }
});
