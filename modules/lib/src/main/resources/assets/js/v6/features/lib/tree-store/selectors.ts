/**
 * Pure query functions for reading tree state.
 * These functions do not modify state.
 */

import type {TreeNode, TreeState} from './types';
import {ROOT_LOADING_KEY} from './types';

/**
 * Gets a single node by ID.
 */
export function getNode<T>(state: TreeState<T>, id: string): TreeNode<T> | undefined {
    return state.nodes.get(id);
}

/**
 * Checks if a node exists.
 */
export function hasNode<T>(state: TreeState<T>, id: string): boolean {
    return state.nodes.has(id);
}

/**
 * Checks if a node is expanded.
 */
export function isExpanded<T>(state: TreeState<T>, id: string): boolean {
    return state.expandedIds.has(id);
}

/**
 * Checks if a node's children are loading.
 * Use null to check root-level loading.
 */
export function isLoading<T>(state: TreeState<T>, id: string | null): boolean {
    return state.loadingIds.has(id ?? ROOT_LOADING_KEY);
}

/**
 * Checks if a node's data is loading (for ID-only pattern).
 */
export function isLoadingData<T>(state: TreeState<T>, id: string): boolean {
    return state.loadingDataIds.has(id);
}

/**
 * Gets all ancestor IDs from node to root (parent first, root last).
 */
export function getAncestorIds<T>(state: TreeState<T>, id: string): string[] {
    const ancestors: string[] = [];

    let currentId: string | null = id;
    while (currentId !== null) {
        const node = state.nodes.get(currentId);
        if (!node || node.parentId === null) break;

        ancestors.push(node.parentId);
        currentId = node.parentId;
    }

    return ancestors;
}

/**
 * Gets all descendant IDs (depth-first order).
 */
export function getDescendantIds<T>(state: TreeState<T>, id: string): string[] {
    const descendants: string[] = [];
    const node = state.nodes.get(id);
    if (!node) return descendants;

    const stack = [...node.childIds];
    while (stack.length > 0) {
        const childId = stack.pop();
        if (childId === undefined) break;
        descendants.push(childId);

        const child = state.nodes.get(childId);
        if (child) {
            // Push in reverse order to maintain DFS order
            for (let i = child.childIds.length - 1; i >= 0; i--) {
                stack.push(child.childIds[i]);
            }
        }
    }

    return descendants;
}

/**
 * Gets sibling IDs (nodes with same parent, excluding self).
 */
export function getSiblingIds<T>(state: TreeState<T>, id: string): string[] {
    const node = state.nodes.get(id);
    if (!node) return [];

    if (node.parentId === null) {
        return state.rootIds.filter(rid => rid !== id);
    }

    const parent = state.nodes.get(node.parentId);
    return parent ? parent.childIds.filter(cid => cid !== id) : [];
}

/**
 * Gets depth level of a node (0 = root level).
 */
export function getNodeLevel<T>(state: TreeState<T>, id: string): number {
    return getAncestorIds(state, id).length;
}

/**
 * Checks if one node is an ancestor of another.
 */
export function isAncestorOf<T>(
    state: TreeState<T>,
    ancestorId: string,
    descendantId: string
): boolean {
    const ancestors = getAncestorIds(state, descendantId);
    return ancestors.includes(ancestorId);
}

/**
 * Checks if one node is a descendant of another.
 */
export function isDescendantOf<T>(
    state: TreeState<T>,
    descendantId: string,
    ancestorId: string
): boolean {
    return isAncestorOf(state, ancestorId, descendantId);
}

/**
 * Gets the parent node of a node.
 */
export function getParent<T>(state: TreeState<T>, id: string): TreeNode<T> | undefined {
    const node = state.nodes.get(id);
    if (!node || node.parentId === null) return undefined;
    return state.nodes.get(node.parentId);
}

/**
 * Gets child nodes of a node.
 */
export function getChildren<T>(state: TreeState<T>, id: string): TreeNode<T>[] {
    const node = state.nodes.get(id);
    if (!node) return [];

    return node.childIds
        .map(childId => state.nodes.get(childId))
        .filter((child): child is TreeNode<T> => child !== undefined);
}

/**
 * Gets root nodes.
 */
export function getRootNodes<T>(state: TreeState<T>): TreeNode<T>[] {
    return state.rootIds
        .map(id => state.nodes.get(id))
        .filter((node): node is TreeNode<T> => node !== undefined);
}

/**
 * Finds nodes matching a predicate.
 */
export function findNodes<T>(
    state: TreeState<T>,
    predicate: (node: TreeNode<T>) => boolean
): TreeNode<T>[] {
    const result: TreeNode<T>[] = [];

    for (const node of state.nodes.values()) {
        if (predicate(node)) {
            result.push(node);
        }
    }

    return result;
}

/**
 * Finds a single node matching a predicate.
 */
export function findNode<T>(
    state: TreeState<T>,
    predicate: (node: TreeNode<T>) => boolean
): TreeNode<T> | undefined {
    for (const node of state.nodes.values()) {
        if (predicate(node)) {
            return node;
        }
    }
    return undefined;
}

/**
 * Gets IDs of nodes with pending data (data === null).
 * Useful for lazy-loading visible nodes.
 */
export function getNodesWithPendingData<T>(state: TreeState<T>): string[] {
    const pending: string[] = [];

    for (const [id, node] of state.nodes) {
        if (node.data === null) {
            pending.push(id);
        }
    }

    return pending;
}

/**
 * Gets IDs of nodes with loaded data (data !== null).
 */
export function getNodesWithData<T>(state: TreeState<T>): string[] {
    const loaded: string[] = [];

    for (const [id, node] of state.nodes) {
        if (node.data !== null) {
            loaded.push(id);
        }
    }

    return loaded;
}

/**
 * Gets total node count.
 */
export function getNodeCount<T>(state: TreeState<T>): number {
    return state.nodes.size;
}

/**
 * Gets expanded node count.
 */
export function getExpandedCount<T>(state: TreeState<T>): number {
    return state.expandedIds.size;
}

/**
 * Checks if tree is empty.
 */
export function isEmpty<T>(state: TreeState<T>): boolean {
    return state.nodes.size === 0;
}

/**
 * Gets the path (array of node IDs) from root to a node.
 * Returns array from root to node (inclusive).
 */
export function getPathToNode<T>(state: TreeState<T>, id: string): string[] {
    const path = [id, ...getAncestorIds(state, id)];
    return path.reverse();
}

/**
 * Checks if all ancestors of a node are expanded.
 * Useful for determining if a node is visible in the tree.
 */
export function areAncestorsExpanded<T>(state: TreeState<T>, id: string): boolean {
    const ancestors = getAncestorIds(state, id);
    return ancestors.every(ancestorId => state.expandedIds.has(ancestorId));
}

/**
 * Checks if a node needs children to be loaded.
 * Returns true if node has children but childIds is empty and not loading.
 */
export function needsChildrenLoad<T>(state: TreeState<T>, id: string): boolean {
    const node = state.nodes.get(id);
    if (!node) return false;

    return (
        node.hasChildren &&
        node.childIds.length === 0 &&
        !state.loadingIds.has(id)
    );
}

/**
 * Checks if a node has more children to load (pagination).
 */
export function hasMoreChildren<T>(state: TreeState<T>, id: string): boolean {
    const node = state.nodes.get(id);
    if (!node || node.totalChildren === undefined) return false;

    return node.childIds.length < node.totalChildren;
}
