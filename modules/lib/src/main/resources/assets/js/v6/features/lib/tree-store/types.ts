/**
 * Headless Tree Data Management Library
 *
 * Pure functions for managing hierarchical tree data with support for
 * virtualized rendering. No internal state - consumers manage state storage.
 */

/**
 * Internal representation of a tree node.
 * Normalized flat structure - no nested children.
 *
 * @template T - The type of the node's data payload
 */
export type TreeNode<T> = {
    /** Unique identifier for this node */
    id: string;
    /** Node data payload. null = ID loaded, data pending (lazy loading) */
    data: T | null;
    /** Parent node ID. null = root node */
    parentId: string | null;
    /** Ordered list of child node IDs */
    childIds: string[];
    /** True if node can be expanded (children may not be loaded yet) */
    hasChildren: boolean;
    /** Total count of children from server (for pagination). undefined = unknown */
    totalChildren?: number;
};

/**
 * Complete tree state stored as immutable data.
 * All state mutations return new TreeState objects.
 *
 * @template T - The type of the node's data payload
 */
export type TreeState<T> = {
    /** All nodes indexed by ID. Map for O(1) lookups */
    nodes: Map<string, TreeNode<T>>;
    /** Ordered list of root node IDs */
    rootIds: string[];
    /** Set of currently expanded node IDs */
    expandedIds: Set<string>;
    /** Set of node IDs currently loading children */
    loadingIds: Set<string>;
    /** Set of node IDs currently loading data (for ID-only pattern) */
    loadingDataIds: Set<string>;
};

/**
 * Output for rendering - result of flattening the tree.
 * Used by virtualized list components.
 *
 * @template T - The type of the node's data payload
 */
export type FlatNode<T> = {
    /** Unique identifier */
    id: string;
    /** Node data payload. null for loading nodes or pending data */
    data: T | null;
    /** Depth level in tree. 0 = root level */
    level: number;
    /** Whether this node is currently expanded */
    isExpanded: boolean;
    /** Whether this node is loading children */
    isLoading: boolean;
    /** Whether this node is loading its data */
    isLoadingData: boolean;
    /** Whether this node has children (or can have children) */
    hasChildren: boolean;
    /** Parent node ID. null = root node */
    parentId: string | null;
    /** Node type: 'node' for actual data, 'loading' for loading indicator */
    nodeType: 'node' | 'loading';
};

/**
 * Options for creating or updating nodes.
 * All fields except id are optional for updates.
 *
 * @template T - The type of the node's data payload
 */
export type CreateNodeOptions<T> = {
    /** Unique identifier (required) */
    id: string;
    /** Node data payload */
    data?: T | null;
    /** Parent node ID. null = root node */
    parentId?: string | null;
    /** Child node IDs */
    childIds?: string[];
    /** Whether node has children */
    hasChildren?: boolean;
    /** Total children count (for pagination) */
    totalChildren?: number;
};

/**
 * Constant for root-level loading state key.
 * Used in loadingIds Set for root children loading.
 */
export const ROOT_LOADING_KEY = '__root__';

/**
 * Prefix for virtual loading node IDs.
 */
export const LOADING_NODE_PREFIX = '__loading__';
