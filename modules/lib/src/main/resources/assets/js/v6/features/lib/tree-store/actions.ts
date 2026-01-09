/**
 * Pure state mutation functions for tree data.
 * Each function takes state and returns new state (immutable updates).
 */

import type {CreateNodeOptions, TreeNode, TreeState} from './types';
import {ROOT_LOADING_KEY} from './types';

/**
 * Creates an empty tree state.
 */
export function createEmptyState<T>(): TreeState<T> {
    return {
        nodes: new Map(),
        rootIds: [],
        expandedIds: new Set(),
        loadingIds: new Set(),
        loadingDataIds: new Set(),
    };
}

// ============================================================================
// Node Management
// ============================================================================

/**
 * Creates or updates a single node.
 * If node exists, merges with existing values.
 */
export function setNode<T>(state: TreeState<T>, options: CreateNodeOptions<T>): TreeState<T> {
    const nodes = new Map(state.nodes);
    const existing = nodes.get(options.id);

    const node: TreeNode<T> = {
        id: options.id,
        data: options.data !== undefined ? options.data : (existing?.data ?? null),
        parentId: options.parentId !== undefined ? options.parentId : (existing?.parentId ?? null),
        childIds: options.childIds ?? existing?.childIds ?? [],
        hasChildren: options.hasChildren ?? existing?.hasChildren ?? false,
        totalChildren: options.totalChildren ?? existing?.totalChildren,
    };

    nodes.set(options.id, node);

    return {...state, nodes};
}

/**
 * Creates or updates multiple nodes in a single operation.
 * More efficient than calling setNode multiple times.
 */
export function setNodes<T>(state: TreeState<T>, nodeOptions: CreateNodeOptions<T>[]): TreeState<T> {
    const nodes = new Map(state.nodes);

    for (const options of nodeOptions) {
        const existing = nodes.get(options.id);

        const node: TreeNode<T> = {
            id: options.id,
            data: options.data !== undefined ? options.data : (existing?.data ?? null),
            parentId: options.parentId !== undefined ? options.parentId : (existing?.parentId ?? null),
            childIds: options.childIds ?? existing?.childIds ?? [],
            hasChildren: options.hasChildren ?? existing?.hasChildren ?? false,
            totalChildren: options.totalChildren ?? existing?.totalChildren,
        };

        nodes.set(options.id, node);
    }

    return {...state, nodes};
}

/**
 * Updates only the data portion of a node.
 * Returns same state if node doesn't exist.
 */
export function setNodeData<T>(state: TreeState<T>, id: string, data: T): TreeState<T> {
    const existing = state.nodes.get(id);
    if (!existing) return state;

    const nodes = new Map(state.nodes);
    nodes.set(id, {...existing, data});

    return {...state, nodes};
}

/**
 * Partially updates node data (merge).
 * Returns same state if node doesn't exist or has no data.
 */
export function updateNodeData<T>(state: TreeState<T>, id: string, patch: Partial<T>): TreeState<T> {
    const existing = state.nodes.get(id);
    if (!existing || existing.data === null) return state;

    const nodes = new Map(state.nodes);
    nodes.set(id, {
        ...existing,
        data: {...existing.data, ...patch},
    });

    return {...state, nodes};
}

/**
 * Removes a node and optionally its descendants.
 */
export function removeNode<T>(
    state: TreeState<T>,
    id: string,
    removeDescendants = true
): TreeState<T> {
    const node = state.nodes.get(id);
    if (!node) return state;

    const nodes = new Map(state.nodes);
    const idsToRemove = [id];

    // Collect descendant IDs if needed
    if (removeDescendants) {
        const stack = [...node.childIds];
        while (stack.length > 0) {
            const childId = stack.pop();
            if (childId === undefined) break;
            idsToRemove.push(childId);
            const child = nodes.get(childId);
            if (child) {
                stack.push(...child.childIds);
            }
        }
    }

    // Remove all collected nodes
    for (const removeId of idsToRemove) {
        nodes.delete(removeId);
    }

    // Update parent's childIds
    if (node.parentId) {
        const parent = nodes.get(node.parentId);
        if (parent) {
            nodes.set(node.parentId, {
                ...parent,
                childIds: parent.childIds.filter(cid => cid !== id),
            });
        }
    }

    // Update rootIds if removed node was a root
    let rootIds = state.rootIds;
    if (rootIds.includes(id)) {
        rootIds = rootIds.filter(rid => rid !== id);
    }

    // Clean up expanded/loading states
    const expandedIds = new Set(state.expandedIds);
    const loadingIds = new Set(state.loadingIds);
    const loadingDataIds = new Set(state.loadingDataIds);

    for (const removeId of idsToRemove) {
        expandedIds.delete(removeId);
        loadingIds.delete(removeId);
        loadingDataIds.delete(removeId);
    }

    return {
        ...state,
        nodes,
        rootIds,
        expandedIds,
        loadingIds,
        loadingDataIds,
    };
}

/**
 * Removes multiple nodes.
 */
export function removeNodes<T>(
    state: TreeState<T>,
    ids: string[],
    removeDescendants = true
): TreeState<T> {
    let result = state;
    for (const id of ids) {
        result = removeNode(result, id, removeDescendants);
    }
    return result;
}

/**
 * Sets children for a node (replaces existing childIds).
 * If parentId is null, sets root children.
 */
export function setChildren<T>(
    state: TreeState<T>,
    parentId: string | null,
    childIds: string[]
): TreeState<T> {
    if (parentId === null) {
        return {...state, rootIds: childIds};
    }

    const parent = state.nodes.get(parentId);
    if (!parent) return state;

    const nodes = new Map(state.nodes);
    nodes.set(parentId, {
        ...parent,
        childIds,
        hasChildren: childIds.length > 0 || (parent.totalChildren ?? 0) > 0,
    });

    return {...state, nodes};
}

/**
 * Appends children to existing childIds.
 */
export function appendChildren<T>(
    state: TreeState<T>,
    parentId: string | null,
    childIds: string[]
): TreeState<T> {
    if (parentId === null) {
        return {...state, rootIds: [...state.rootIds, ...childIds]};
    }

    const parent = state.nodes.get(parentId);
    if (!parent) return state;

    const nodes = new Map(state.nodes);
    nodes.set(parentId, {
        ...parent,
        childIds: [...parent.childIds, ...childIds],
        hasChildren: true,
    });

    return {...state, nodes};
}

/**
 * Sets root node IDs.
 */
export function setRootIds<T>(state: TreeState<T>, ids: string[]): TreeState<T> {
    return {...state, rootIds: ids};
}

// ============================================================================
// Expand / Collapse
// ============================================================================

/**
 * Expands a single node.
 */
export function expand<T>(state: TreeState<T>, id: string): TreeState<T> {
    if (state.expandedIds.has(id)) return state;

    const expandedIds = new Set(state.expandedIds);
    expandedIds.add(id);

    return {...state, expandedIds};
}

/**
 * Collapses a single node.
 */
export function collapse<T>(state: TreeState<T>, id: string): TreeState<T> {
    if (!state.expandedIds.has(id)) return state;

    const expandedIds = new Set(state.expandedIds);
    expandedIds.delete(id);

    return {...state, expandedIds};
}

/**
 * Toggles expand state of a node.
 */
export function toggle<T>(state: TreeState<T>, id: string): TreeState<T> {
    return state.expandedIds.has(id) ? collapse(state, id) : expand(state, id);
}

/**
 * Expands multiple nodes or all expandable nodes.
 * If ids not provided, expands all nodes that have children.
 */
export function expandAll<T>(state: TreeState<T>, ids?: string[]): TreeState<T> {
    const expandedIds = new Set(state.expandedIds);

    if (ids) {
        for (const id of ids) {
            expandedIds.add(id);
        }
    } else {
        // Expand all nodes that have children
        for (const [id, node] of state.nodes) {
            if (node.hasChildren || node.childIds.length > 0) {
                expandedIds.add(id);
            }
        }
    }

    return {...state, expandedIds};
}

/**
 * Collapses multiple nodes or all nodes.
 * If ids not provided, collapses all.
 */
export function collapseAll<T>(state: TreeState<T>, ids?: string[]): TreeState<T> {
    if (!ids) {
        return {...state, expandedIds: new Set()};
    }

    const expandedIds = new Set(state.expandedIds);
    for (const id of ids) {
        expandedIds.delete(id);
    }

    return {...state, expandedIds};
}

/**
 * Expands path from root to a specific node.
 * Useful for "reveal in tree" functionality.
 */
export function expandToNode<T>(state: TreeState<T>, id: string): TreeState<T> {
    const expandedIds = new Set(state.expandedIds);

    let currentId: string | null = id;
    while (currentId !== null) {
        const node = state.nodes.get(currentId);
        if (!node) break;

        if (node.parentId !== null) {
            expandedIds.add(node.parentId);
        }
        currentId = node.parentId;
    }

    return {...state, expandedIds};
}

// ============================================================================
// Loading State
// ============================================================================

/**
 * Sets loading state for node children.
 * Use null for root-level loading.
 */
export function setLoading<T>(
    state: TreeState<T>,
    id: string | null,
    loading: boolean
): TreeState<T> {
    const key = id ?? ROOT_LOADING_KEY;
    const loadingIds = new Set(state.loadingIds);

    if (loading) {
        loadingIds.add(key);
    } else {
        loadingIds.delete(key);
    }

    return {...state, loadingIds};
}

/**
 * Sets loading state for node data (for ID-only loading pattern).
 */
export function setLoadingData<T>(
    state: TreeState<T>,
    ids: string[],
    loading: boolean
): TreeState<T> {
    const loadingDataIds = new Set(state.loadingDataIds);

    for (const id of ids) {
        if (loading) {
            loadingDataIds.add(id);
        } else {
            loadingDataIds.delete(id);
        }
    }

    return {...state, loadingDataIds};
}

// ============================================================================
// Move Operations
// ============================================================================

/**
 * Moves a node to a new parent.
 * @param index - Position in new parent's children. If undefined, appends at end.
 */
export function moveNode<T>(
    state: TreeState<T>,
    id: string,
    newParentId: string | null,
    index?: number
): TreeState<T> {
    const node = state.nodes.get(id);
    if (!node) return state;

    const nodes = new Map(state.nodes);
    let rootIds = [...state.rootIds];

    // Remove from old parent
    if (node.parentId === null) {
        rootIds = rootIds.filter(rid => rid !== id);
    } else {
        const oldParent = nodes.get(node.parentId);
        if (oldParent) {
            nodes.set(node.parentId, {
                ...oldParent,
                childIds: oldParent.childIds.filter(cid => cid !== id),
            });
        }
    }

    // Add to new parent
    if (newParentId === null) {
        if (index !== undefined) {
            rootIds.splice(index, 0, id);
        } else {
            rootIds.push(id);
        }
    } else {
        const newParent = nodes.get(newParentId);
        if (newParent) {
            const newChildIds = [...newParent.childIds];
            if (index !== undefined) {
                newChildIds.splice(index, 0, id);
            } else {
                newChildIds.push(id);
            }
            nodes.set(newParentId, {
                ...newParent,
                childIds: newChildIds,
                hasChildren: true,
            });
        }
    }

    // Update node's parentId
    nodes.set(id, {...node, parentId: newParentId});

    return {...state, nodes, rootIds};
}
