/**
 * Headless Tree Data Management Library
 *
 * Pure functions for managing hierarchical tree data with support for
 * virtualized rendering. No internal state - consumers manage state storage.
 *
 * @example
 * ```typescript
 * // With nanostores
 * import { atom, computed } from 'nanostores';
 * import { createEmptyState, setNodes, expand, flattenTree, TreeState } from './lib/tree-store';
 *
 * const $treeState = atom<TreeState<MyData>>(createEmptyState());
 * const $flatNodes = computed($treeState, flattenTree);
 *
 * // Update state
 * $treeState.set(setNodes($treeState.get(), [{ id: '1', data: myData }]));
 * $treeState.set(expand($treeState.get(), '1'));
 *
 * // Read flat nodes for rendering
 * const nodes = $flatNodes.get();
 * ```
 */

// Types
export type {
    TreeNode,
    TreeState,
    FlatNode,
    CreateNodeOptions,
} from './types';

export {
    ROOT_LOADING_KEY,
    LOADING_NODE_PREFIX,
} from './types';

// Actions (state mutations)
export {
    createEmptyState,
    // Node management
    setNode,
    setNodes,
    setNodeData,
    updateNodeData,
    removeNode,
    removeNodes,
    setChildren,
    appendChildren,
    setRootIds,
    // Expand/Collapse
    expand,
    collapse,
    toggle,
    expandAll,
    collapseAll,
    expandToNode,
    // Loading state
    setLoading,
    setLoadingData,
    // Move operations
    moveNode,
} from './actions';

// Selectors (state queries)
export {
    getNode,
    hasNode,
    isExpanded,
    isLoading,
    isLoadingData,
    getAncestorIds,
    getDescendantIds,
    getSiblingIds,
    getNodeLevel,
    isAncestorOf,
    isDescendantOf,
    getParent,
    getChildren,
    getRootNodes,
    findNodes,
    findNode,
    getNodesWithPendingData,
    getNodesWithData,
    getNodeCount,
    getExpandedCount,
    isEmpty,
    getPathToNode,
    areAncestorsExpanded,
    needsChildrenLoad,
    hasMoreChildren,
} from './selectors';

// Flatten (tree to flat list)
export {
    flattenTree,
    isLoadingNodeId,
    getLoadingNodeParentId,
    getVisibleNodeCount,
    findFlatNode,
    getFlatNodeIndex,
    getFlatNodesAtLevel,
    getFlatNodesInRange,
    getPendingDataIds,
    getPendingDataIdsInRange,
} from './flatten';
