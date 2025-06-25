import {atom, computed} from 'nanostores';
import {$contentDeleted, $contentArchived, $contentCreated, $contentDuplicated} from './socket.store';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {calcWorkflowStateStatus} from '../utils/cms/content/workflow';
import {resolveDisplayName, resolveSubName} from '../utils/cms/content/prettify';
import {
    createEmptyState,
    setNode,
    setNodes,
    removeNode,
    removeNodes,
    setChildren,
    appendChildren,
    setRootIds,
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    expandToNode,
    setLoading,
    setLoadingData,
    flattenTree,
    getNode,
    hasNode,
    isExpanded,
    isLoading,
    needsChildrenLoad,
    hasMoreChildren,
    getDescendantIds,
    ROOT_LOADING_KEY,
    type FlatNode,
    type CreateNodeOptions,
} from '../lib/tree-store';
import {$uploads, type UploadItem} from './uploads.store';
import {$contentCache, getIdByPath} from './content.store';
import type {ContentData} from '../views/browse/grid/ContentData';
import type {ContentUploadData} from '../views/browse/grid/ContentUploadData';
import {convertToContentFlatNode} from './tree/utils';
import type {
    ContentTreeNodeData,
    ContentTreeState,
    ContentTreeNode,
    ContentFlatNode,
    LoadingStateValue,
} from './tree/types';

// Re-export types for backwards compatibility
export type {ContentTreeNodeData, ContentTreeState, ContentTreeNode, ContentFlatNode, LoadingStateValue};

//
// * Store
//

/** Tree structure state */
export const $treeState = atom<ContentTreeState>(createEmptyState<ContentTreeNodeData>());

/** Root-level total children count for pagination */
const $rootTotalChildren = atom<number | undefined>(undefined);

//
// * Computed Stores
//

/** Flattened tree nodes for virtualized rendering */
export const $flatNodes = computed($treeState, flattenTree);

/**
 * Merged flat nodes with uploads injected.
 * This is what ContentTreeList consumes for rendering.
 */
export const $mergedFlatNodes = computed([$flatNodes, $uploads, $contentCache], (flatNodes, uploads, cache) => {
    const result: FlatNode<ContentData | ContentUploadData>[] = [];

    // Group uploads by parent
    const uploadsByParent = new Map<string | null, UploadItem[]>();
    for (const upload of Object.values(uploads)) {
        const parentId = upload.parentId ?? null;
        const existing = uploadsByParent.get(parentId) || [];
        existing.push(upload);
        uploadsByParent.set(parentId, existing);
    }

    // Add root-level uploads at the beginning
    const rootUploads = uploadsByParent.get(null);
    if (rootUploads) {
        for (const upload of rootUploads) {
            result.push(createUploadFlatNode(upload, 0));
        }
    }

    // Process tree nodes and inject child uploads
    for (const node of flatNodes) {
        // Convert tree node to content data format
        result.push(convertToContentFlatNode(node, cache));

        // Check if this is an expanded parent with uploads
        const nodeUploads = uploadsByParent.get(node.id);
        if (nodeUploads && node.isExpanded) {
            const childLevel = node.level + 1;
            for (const upload of nodeUploads) {
                result.push(createUploadFlatNode(upload, childLevel));
            }
        }
    }

    return result;
});

/**
 * Creates a flat node for an upload item.
 */
function createUploadFlatNode(upload: UploadItem, level: number): FlatNode<ContentUploadData> {
    return {
        id: upload.id,
        data: {
            id: upload.id,
            name: upload.name,
            progress: upload.progress,
            parentId: upload.parentId ?? '',
            hasChildren: false,
        },
        level,
        isExpanded: false,
        isLoading: false,
        isLoadingData: false,
        hasChildren: false,
        parentId: upload.parentId ?? null,
        nodeType: 'node',
    };
}

//
// * Actions
//

export function setTreeState(state: ContentTreeState): void {
    $treeState.set(state);
}

export function updateTreeState(updater: (state: ContentTreeState) => ContentTreeState): void {
    $treeState.set(updater($treeState.get()));
}

export function addTreeNode(options: CreateNodeOptions<ContentTreeNodeData>): void {
    updateTreeState((state) => setNode(state, options));
}

export function addTreeNodes(nodes: CreateNodeOptions<ContentTreeNodeData>[]): void {
    if (nodes.length === 0) return;
    updateTreeState((state) => setNodes(state, nodes));
}

export function removeTreeNode(id: string, removeDescendants = true): void {
    updateTreeState((state) => removeNode(state, id, removeDescendants));
}

export function removeTreeNodes(ids: string[], removeDescendants = true): void {
    if (ids.length === 0) return;
    updateTreeState((state) => removeNodes(state, ids, removeDescendants));
}

export function setTreeChildren(parentId: string | null, childIds: string[]): void {
    updateTreeState((state) => setChildren(state, parentId, childIds));
}

export function appendTreeChildren(parentId: string | null, childIds: string[]): void {
    if (childIds.length === 0) return;
    updateTreeState((state) => appendChildren(state, parentId, childIds));
}

export function setTreeRootIds(ids: string[]): void {
    updateTreeState((state) => setRootIds(state, ids));
}

export function expandNode(id: string): void {
    updateTreeState((state) => expand(state, id));
}

export function collapseNode(id: string): void {
    updateTreeState((state) => collapse(state, id));
}

export function toggleNode(id: string): void {
    updateTreeState((state) => toggle(state, id));
}

export function expandAllNodes(ids?: string[]): void {
    updateTreeState((state) => expandAll(state, ids));
}

export function collapseAllNodes(ids?: string[]): void {
    updateTreeState((state) => collapseAll(state, ids));
}

export function expandPathToNode(id: string): void {
    updateTreeState((state) => expandToNode(state, id));
}

export function setNodeLoading(id: string | null, loading: boolean): void {
    updateTreeState((state) => setLoading(state, id, loading));
}

export function setNodesLoadingData(ids: string[], loading: boolean): void {
    updateTreeState((state) => setLoadingData(state, ids, loading));
}

export function resetTree(): void {
    $treeState.set(createEmptyState<ContentTreeNodeData>());
    $rootTotalChildren.set(undefined);
}

export function setRootTotalChildren(total: number): void {
    $rootTotalChildren.set(total);
}

export function getRootTotalChildren(): number | undefined {
    return $rootTotalChildren.get();
}

export function rootHasMoreChildren(): boolean {
    const total = $rootTotalChildren.get();
    if (total === undefined) return false;
    const rootIds = $treeState.get().rootIds;
    return rootIds.length < total;
}

export function setNodeTotalChildren(id: string, totalChildren: number): void {
    updateTreeState((state) => setNode(state, {id, totalChildren}));
}

//
// * Selectors (convenience wrappers)
//

export function getTreeNode(id: string): ContentTreeNode | undefined {
    return getNode($treeState.get(), id);
}

export function hasTreeNode(id: string): boolean {
    return hasNode($treeState.get(), id);
}

export function isNodeExpanded(id: string): boolean {
    return isExpanded($treeState.get(), id);
}

export function isNodeLoading(id: string | null): boolean {
    return isLoading($treeState.get(), id);
}

export function nodeNeedsChildrenLoad(id: string): boolean {
    return needsChildrenLoad($treeState.get(), id);
}

export function nodeHasMoreChildren(id: string): boolean {
    return hasMoreChildren($treeState.get(), id);
}

export function getTreeDescendantIds(id: string): string[] {
    return getDescendantIds($treeState.get(), id);
}

//
// * Computed Loading States
//

/**
 * Root loading state for toolbar and other components.
 * Returns 'loading' while root children are being fetched, 'ok' otherwise.
 */
export const $rootLoadingState = computed($treeState, (state): LoadingStateValue => {
    return state.loadingIds.has(ROOT_LOADING_KEY) ? 'loading' : 'ok';
});

//
// * Socket Event Subscriptions (self-initializing at module load)
//

// Helper: Remove content and update parents in single transaction
function removeContentFromTree(ids: string[]): void {
    updateTreeState((state) => {
        // Collect parent IDs before removal
        const parentIds = new Set<string>();
        for (const id of ids) {
            const node = state.nodes.get(id);
            if (node?.parentId && !ids.includes(node.parentId)) {
                parentIds.add(node.parentId);
            }
        }

        // Remove nodes
        let newState = removeNodes(state, ids, true);

        // Collapse parents that have no children left (hasChildren already updated by removeNodes)
        for (const parentId of parentIds) {
            const parent = newState.nodes.get(parentId);
            if (parent?.childIds.length === 0 && newState.expandedIds.has(parentId)) {
                newState = collapse(newState, parentId);
            }
        }

        return newState;
    });
}

$contentDeleted.subscribe((event) => {
    if (event?.data) {
        const ids = event.data.map((item) => item.getContentId().toString());
        removeContentFromTree(ids);
    }
});

$contentArchived.subscribe((event) => {
    if (event?.data) {
        const ids = event.data.map((item) => item.getContentId().toString());
        removeContentFromTree(ids);
    }
});

// Helper: Convert content to tree node data
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

// Helper: Find parent ID by path (O(1) lookup via path index)
function findParentIdByPath(content: ContentSummaryAndCompareStatus): string | null {
    const path = content.getPath();
    if (!path?.hasParentContent()) return null;

    const parentPath = path.getParentPath();
    if (!parentPath || parentPath.isRoot()) return null;

    const parentId = getIdByPath(parentPath.toString());
    if (!parentId) return null;

    // Verify parent is in tree
    return $treeState.get().nodes.has(parentId) ? parentId : null;
}

// Helper: Add newly created content to tree
// Uses single state update to avoid stale state race conditions
function addContentToTree(content: ContentSummaryAndCompareStatus): void {
    const id = content.getId();
    if (hasTreeNode(id)) return; // Already in tree

    const parentId = findParentIdByPath(content);

    updateTreeState((state) => {
        if (parentId === null) {
            if (state.rootIds.length === 0) return state;
        } else {
            const parent = state.nodes.get(parentId);
            if (!parent) return state;
            const hasUnloadedChildren = parent.childIds.length === 0 && (parent.hasChildren || (parent.totalChildren ?? 0) > 0);
            if (hasUnloadedChildren || state.loadingIds.has(parentId)) return state;
        }

        // Add node to tree
        let newState = setNode(state, {
            id,
            data: toTreeNodeData(content),
            parentId,
            hasChildren: content.hasChildren(),
        });

        // Update parent's children list
        if (parentId) {
            const parent = newState.nodes.get(parentId);
            if (parent && !parent.childIds.includes(id)) {
                newState = appendChildren(newState, parentId, [id]);
            }
            // Update hasChildren if this is first child
            if (!parent?.hasChildren) {
                newState = setNode(newState, {id: parentId, hasChildren: true});
            }
        } else {
            if (!newState.rootIds.includes(id)) {
                newState = setRootIds(newState, [id, ...newState.rootIds]); // Prepend (newest first)
            }
        }

        return newState;
    });
}

// Socket: Content created
$contentCreated.subscribe((event) => {
    if (!event?.data) return;
    for (const content of event.data) {
        addContentToTree(content);
    }
});

// Socket: Content duplicated
$contentDuplicated.subscribe((event) => {
    if (!event?.data) return;
    for (const content of event.data) {
        addContentToTree(content);
    }
});

//
// * Aliases for Main Tree (Phase 8: Filter Mode Support)
//
// These aliases make it explicit that these stores/actions operate on the main tree
// (as opposed to the filter tree in filter-tree.store.ts).
//

/** Main tree state - alias for $treeState */
export {$treeState as $mainTreeState};

/** Main flat nodes - alias for $flatNodes */
export {$flatNodes as $mainFlatNodes};

/** Main merged flat nodes - alias for $mergedFlatNodes */
export {$mergedFlatNodes as $mainMergedFlatNodes};

/** Expand node in main tree */
export {expandNode as expandMainNode};

/** Collapse node in main tree */
export {collapseNode as collapseMainNode};

/** Check if main node needs children load */
export {nodeNeedsChildrenLoad as mainNodeNeedsChildrenLoad};
