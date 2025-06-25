/**
 * Tree flattening algorithm.
 * Converts hierarchical tree structure to flat array for virtualized rendering.
 */

import type {FlatNode, TreeState} from './types';
import {LOADING_NODE_PREFIX, ROOT_LOADING_KEY} from './types';

/**
 * Stack item for iterative DFS traversal.
 */
type StackItem = {
    id: string;
    level: number;
    parentId: string | null;
};

/**
 * Flattens tree state into array of FlatNode for rendering.
 *
 * Uses iterative DFS (depth-first search) with explicit stack.
 * Injects virtual loading nodes when:
 * - Children not yet loaded (hasChildren but no childIds)
 * - Currently loading children
 * - Has more children to load (pagination)
 *
 * @param state - Tree state to flatten
 * @returns Flat array of nodes in display order
 *
 * @example
 * ```typescript
 * const flatNodes = flattenTree(state);
 * // Use with Virtuoso or similar virtualized list
 * <Virtuoso data={flatNodes} itemContent={(_, node) => <Row node={node} />} />
 * ```
 */
export function flattenTree<T>(state: TreeState<T>): FlatNode<T>[] {
    const {nodes, rootIds, expandedIds, loadingIds, loadingDataIds} = state;
    const result: FlatNode<T>[] = [];

    // Initialize stack with root IDs in reverse order
    // (to maintain correct output order when popping)
    // Level starts at 1 for VirtualizedTreeList compatibility
    const stack: StackItem[] = [];
    for (let i = rootIds.length - 1; i >= 0; i--) {
        stack.push({id: rootIds[i], level: 1, parentId: null});
    }

    while (stack.length > 0) {
        const item = stack.pop();
        if (!item) break;
        const {id, level, parentId} = item;

        // Handle virtual loading node
        if (id.startsWith(LOADING_NODE_PREFIX)) {
            result.push({
                id,
                data: null,
                level,
                isExpanded: false,
                isLoading: true,
                isLoadingData: false,
                hasChildren: false,
                parentId,
                nodeType: 'loading',
            });
            continue;
        }

        const node = nodes.get(id);
        if (!node) continue;

        const isExpanded = expandedIds.has(id);
        const isLoading = loadingIds.has(id);
        const isLoadingData = loadingDataIds.has(id);

        // Add node to result
        result.push({
            id: node.id,
            data: node.data,
            level,
            isExpanded,
            isLoading,
            isLoadingData,
            hasChildren: node.hasChildren || node.childIds.length > 0,
            parentId: node.parentId,
            nodeType: 'node',
        });

        // Process children if expanded
        if (isExpanded && (node.hasChildren || node.childIds.length > 0)) {
            const childIds = node.childIds;
            const loadedCount = childIds.length;
            const totalCount = node.totalChildren ?? loadedCount;

            // Determine if we need a loading node
            const hasMoreChildren = loadedCount < totalCount;
            const childrenNotLoaded = loadedCount === 0 && node.hasChildren;
            const shouldShowLoading = childrenNotLoaded || isLoading || hasMoreChildren;

            // Push loading node first (will appear after all children due to stack reversal)
            if (shouldShowLoading) {
                const loadingId = `${LOADING_NODE_PREFIX}${id}__${loadedCount}`;
                stack.push({id: loadingId, level: level + 1, parentId: id});
            }

            // Push children in reverse order (for correct output order)
            for (let i = childIds.length - 1; i >= 0; i--) {
                stack.push({id: childIds[i], level: level + 1, parentId: id});
            }
        }
    }

    // Handle root-level loading indicator
    const isRootLoading = loadingIds.has(ROOT_LOADING_KEY);
    const hasNoRoots = rootIds.length === 0;

    if (isRootLoading && hasNoRoots) {
        result.push({
            id: `${LOADING_NODE_PREFIX}root__0`,
            data: null,
            level: 1,
            isExpanded: false,
            isLoading: true,
            isLoadingData: false,
            hasChildren: false,
            parentId: null,
            nodeType: 'loading',
        });
    }

    return result;
}

export function isLoadingNodeId(id: string): boolean {
    return id.startsWith(LOADING_NODE_PREFIX);
}

/**
 * Extracts parent ID from a loading node ID.
 * Returns null for root loading node.
 */
export function getLoadingNodeParentId(loadingNodeId: string): string | null {
    if (!loadingNodeId.startsWith(LOADING_NODE_PREFIX)) {
        return null;
    }

    const withoutPrefix = loadingNodeId.slice(LOADING_NODE_PREFIX.length);
    const parts = withoutPrefix.split('__');

    if (parts[0] === 'root') {
        return null;
    }

    return parts[0] || null;
}

export function getVisibleNodeCount<T>(flatNodes: FlatNode<T>[]): number {
    return flatNodes.filter(node => node.nodeType === 'node').length;
}

export function findFlatNode<T>(flatNodes: FlatNode<T>[], id: string): FlatNode<T> | undefined {
    return flatNodes.find(node => node.id === id);
}

export function getFlatNodeIndex<T>(flatNodes: FlatNode<T>[], id: string): number {
    return flatNodes.findIndex(node => node.id === id);
}

/**
 * Gets flat nodes within a level range.
 * Useful for getting nodes at a specific depth.
 */
export function getFlatNodesAtLevel<T>(flatNodes: FlatNode<T>[], level: number): FlatNode<T>[] {
    return flatNodes.filter(node => node.level === level);
}

/**
 * Gets flat nodes in a range (for virtualized viewport).
 * @param startIndex - Start index (inclusive)
 * @param endIndex - End index (exclusive)
 */
export function getFlatNodesInRange<T>(
    flatNodes: FlatNode<T>[],
    startIndex: number,
    endIndex: number
): FlatNode<T>[] {
    return flatNodes.slice(startIndex, endIndex);
}

/**
 * Gets IDs of flat nodes that need data loaded.
 * Filters out loading nodes and nodes that already have data.
 */
export function getPendingDataIds<T>(flatNodes: FlatNode<T>[]): string[] {
    return flatNodes
        .filter(node => node.nodeType === 'node' && node.data === null && !node.isLoadingData)
        .map(node => node.id);
}

/**
 * Gets IDs of flat nodes in a range that need data loaded.
 * Useful for loading data for visible viewport.
 */
export function getPendingDataIdsInRange<T>(
    flatNodes: FlatNode<T>[],
    startIndex: number,
    endIndex: number
): string[] {
    return getPendingDataIds(getFlatNodesInRange(flatNodes, startIndex, endIndex));
}
