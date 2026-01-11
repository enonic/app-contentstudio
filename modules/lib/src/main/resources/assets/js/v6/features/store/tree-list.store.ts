import {atom, computed} from 'nanostores';
import type {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import type {PublishStatus} from '../../../app/publish/PublishStatus';
import type {WorkflowStateStatus} from '../../../app/wizard/WorkflowStateManager';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
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
    flattenTree,
    getNode,
    hasNode,
    isExpanded,
    isLoading,
    needsChildrenLoad,
    hasMoreChildren,
    getDescendantIds,
    ROOT_LOADING_KEY,
    type TreeState,
    type TreeNode,
    type FlatNode,
    type CreateNodeOptions,
} from '../lib/tree-store';
import {$uploads, type UploadItem} from './uploads.store';
import {$contentCache} from './content.store';
import type {ContentData} from '../views/browse/grid/ContentData';
import type {ContentUploadData} from '../views/browse/grid/ContentUploadData';

//
// * Types
//

/**
 * Lightweight data stored in tree nodes.
 * Full content data is looked up from $contentCache using the id.
 */
export type ContentTreeNodeData = {
    /** Content ID - used to look up full data from content cache */
    id: string;
    /** Display name for quick rendering */
    displayName: string;
    /** Content name (path segment) */
    name: string;
    /** Publish status for visual indicators */
    publishStatus: PublishStatus;
    /** Workflow status */
    workflowStatus: WorkflowStateStatus | null;
    /** Content type name */
    contentType: ContentTypeName;
    /** Icon URL */
    iconUrl: string | null;
};

export type ContentTreeState = TreeState<ContentTreeNodeData>;
export type ContentTreeNode = TreeNode<ContentTreeNodeData>;
export type ContentFlatNode = FlatNode<ContentTreeNodeData>;

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
 * Converts a tree FlatNode to ContentData format for rendering.
 */
function convertToContentFlatNode(
    node: FlatNode<ContentTreeNodeData>,
    cache: Record<string, ContentSummaryAndCompareStatus>
): FlatNode<ContentData | ContentUploadData> {
    if (node.nodeType === 'loading' || !node.data) {
        // Loading node or missing data - return as-is with minimal data
        return {
            ...node,
            data: node.data
                ? {
                      id: node.data.id,
                      displayName: node.data.displayName,
                      name: node.data.name,
                      publishStatus: node.data.publishStatus,
                      workflowStatus: node.data.workflowStatus,
                      contentType: node.data.contentType,
                      iconUrl: node.data.iconUrl,
                      hasChildren: node.hasChildren,
                      item: cache[node.id], // May be undefined
                  }
                : null,
        } as FlatNode<ContentData | ContentUploadData>;
    }

    const content = cache[node.id];
    const data = node.data;

    return {
        ...node,
        data: {
            id: data.id,
            displayName: data.displayName,
            name: data.name,
            publishStatus: data.publishStatus,
            workflowStatus: data.workflowStatus,
            contentType: data.contentType,
            iconUrl: data.iconUrl,
            hasChildren: node.hasChildren,
            item: content, // Full ContentSummaryAndCompareStatus from cache
        },
    } as FlatNode<ContentData | ContentUploadData>;
}

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

/**
 * Sets tree state directly (used for batch updates).
 */
export function setTreeState(state: ContentTreeState): void {
    $treeState.set(state);
}

/**
 * Updates tree state with a pure function.
 */
export function updateTreeState(updater: (state: ContentTreeState) => ContentTreeState): void {
    $treeState.set(updater($treeState.get()));
}

/**
 * Adds or updates a single node in the tree.
 */
export function addTreeNode(options: CreateNodeOptions<ContentTreeNodeData>): void {
    updateTreeState((state) => setNode(state, options));
}

/**
 * Adds or updates multiple nodes in the tree.
 */
export function addTreeNodes(nodes: CreateNodeOptions<ContentTreeNodeData>[]): void {
    if (nodes.length === 0) return;
    updateTreeState((state) => setNodes(state, nodes));
}

/**
 * Removes a node from the tree.
 */
export function removeTreeNode(id: string, removeDescendants = true): void {
    updateTreeState((state) => removeNode(state, id, removeDescendants));
}

/**
 * Removes multiple nodes from the tree.
 */
export function removeTreeNodes(ids: string[], removeDescendants = true): void {
    if (ids.length === 0) return;
    updateTreeState((state) => removeNodes(state, ids, removeDescendants));
}

/**
 * Sets children for a parent node (replaces existing children).
 */
export function setTreeChildren(parentId: string | null, childIds: string[]): void {
    updateTreeState((state) => setChildren(state, parentId, childIds));
}

/**
 * Appends children to a parent node (for pagination).
 */
export function appendTreeChildren(parentId: string | null, childIds: string[]): void {
    if (childIds.length === 0) return;
    updateTreeState((state) => appendChildren(state, parentId, childIds));
}

/**
 * Sets root node IDs.
 */
export function setTreeRootIds(ids: string[]): void {
    updateTreeState((state) => setRootIds(state, ids));
}

/**
 * Expands a tree node.
 */
export function expandNode(id: string): void {
    updateTreeState((state) => expand(state, id));
}

/**
 * Collapses a tree node.
 */
export function collapseNode(id: string): void {
    updateTreeState((state) => collapse(state, id));
}

/**
 * Toggles node expansion.
 */
export function toggleNode(id: string): void {
    updateTreeState((state) => toggle(state, id));
}

/**
 * Expands all nodes (or specific nodes).
 */
export function expandAllNodes(ids?: string[]): void {
    updateTreeState((state) => expandAll(state, ids));
}

/**
 * Collapses all nodes (or specific nodes).
 */
export function collapseAllNodes(ids?: string[]): void {
    updateTreeState((state) => collapseAll(state, ids));
}

/**
 * Expands path to a specific node (reveals it in tree).
 */
export function expandPathToNode(id: string): void {
    updateTreeState((state) => expandToNode(state, id));
}

/**
 * Sets loading state for a node's children.
 * Pass null for root-level loading.
 */
export function setNodeLoading(id: string | null, loading: boolean): void {
    updateTreeState((state) => setLoading(state, id, loading));
}

/**
 * Resets the tree to empty state.
 */
export function resetTree(): void {
    $treeState.set(createEmptyState<ContentTreeNodeData>());
    $rootTotalChildren.set(undefined);
}

/**
 * Sets total children count for root level (used for pagination).
 */
export function setRootTotalChildren(total: number): void {
    $rootTotalChildren.set(total);
}

/**
 * Gets total children count for root level.
 */
export function getRootTotalChildren(): number | undefined {
    return $rootTotalChildren.get();
}

/**
 * Checks if root has more children to load.
 */
export function rootHasMoreChildren(): boolean {
    const total = $rootTotalChildren.get();
    if (total === undefined) return false;
    const rootIds = $treeState.get().rootIds;
    return rootIds.length < total;
}

/**
 * Updates totalChildren for a node (used for pagination).
 */
export function setNodeTotalChildren(id: string, totalChildren: number): void {
    updateTreeState((state) => setNode(state, {id, totalChildren}));
}

//
// * Selectors (convenience wrappers)
//

/**
 * Gets a node by ID.
 */
export function getTreeNode(id: string): ContentTreeNode | undefined {
    return getNode($treeState.get(), id);
}

/**
 * Checks if a node exists.
 */
export function hasTreeNode(id: string): boolean {
    return hasNode($treeState.get(), id);
}

/**
 * Checks if a node is expanded.
 */
export function isNodeExpanded(id: string): boolean {
    return isExpanded($treeState.get(), id);
}

/**
 * Checks if a node is loading.
 */
export function isNodeLoading(id: string | null): boolean {
    return isLoading($treeState.get(), id);
}

/**
 * Checks if a node needs its children loaded.
 */
export function nodeNeedsChildrenLoad(id: string): boolean {
    return needsChildrenLoad($treeState.get(), id);
}

/**
 * Checks if a node has more children to load (pagination).
 */
export function nodeHasMoreChildren(id: string): boolean {
    return hasMoreChildren($treeState.get(), id);
}

/**
 * Gets all descendant IDs of a node.
 */
export function getTreeDescendantIds(id: string): string[] {
    return getDescendantIds($treeState.get(), id);
}

//
// * Computed Loading States
//

export type LoadingStateValue = 'loading' | 'ok';

/**
 * Root loading state for toolbar and other components.
 * Returns 'loading' while root children are being fetched, 'ok' otherwise.
 */
export const $rootLoadingState = computed($treeState, (state): LoadingStateValue => {
    return state.loadingIds.has(ROOT_LOADING_KEY) ? 'loading' : 'ok';
});
