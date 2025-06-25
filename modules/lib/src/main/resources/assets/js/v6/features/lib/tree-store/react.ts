/**
 * React hook for managing tree state without external store dependencies.
 *
 * For nanostore integration, use the pure functions directly with atom/computed.
 * This hook provides a self-contained alternative for simpler use cases.
 */

import {useCallback, useMemo, useRef, useSyncExternalStore} from 'react';
import type {FlatNode, TreeState, CreateNodeOptions} from './types';
import * as actions from './actions';
import {flattenTree} from './flatten';
import {
    getNode,
    hasNode,
    isExpanded,
    isLoading,
    isLoadingData,
    getAncestorIds,
    getDescendantIds,
    getSiblingIds,
    getNodeLevel,
    getParent,
    getChildren,
    getRootNodes,
    needsChildrenLoad,
    hasMoreChildren,
    areAncestorsExpanded,
    getPathToNode,
} from './selectors';

/**
 * Options for useTreeStore hook.
 */
export type UseTreeStoreOptions<T> = {
    /** Initial state (optional) */
    initialState?: TreeState<T>;
};

/**
 * Return type of useTreeStore hook.
 */
export type UseTreeStoreReturn<T> = {
    // State
    state: TreeState<T>;
    flatNodes: FlatNode<T>[];

    // Node management
    setNode: (options: CreateNodeOptions<T>) => void;
    setNodes: (options: CreateNodeOptions<T>[]) => void;
    setNodeData: (id: string, data: T) => void;
    updateNodeData: (id: string, patch: Partial<T>) => void;
    removeNode: (id: string, removeDescendants?: boolean) => void;
    removeNodes: (ids: string[], removeDescendants?: boolean) => void;
    setChildren: (parentId: string | null, childIds: string[]) => void;
    appendChildren: (parentId: string | null, childIds: string[]) => void;
    setRootIds: (ids: string[]) => void;

    // Expand/Collapse
    expand: (id: string) => void;
    collapse: (id: string) => void;
    toggle: (id: string) => void;
    expandAll: (ids?: string[]) => void;
    collapseAll: (ids?: string[]) => void;
    expandToNode: (id: string) => void;

    // Loading state
    setLoading: (id: string | null, loading: boolean) => void;
    setLoadingData: (ids: string[], loading: boolean) => void;

    // Queries
    getNode: (id: string) => ReturnType<typeof getNode<T>>;
    hasNode: (id: string) => boolean;
    isExpanded: (id: string) => boolean;
    isLoading: (id: string | null) => boolean;
    isLoadingData: (id: string) => boolean;
    getAncestorIds: (id: string) => string[];
    getDescendantIds: (id: string) => string[];
    getSiblingIds: (id: string) => string[];
    getNodeLevel: (id: string) => number;
    getParent: (id: string) => ReturnType<typeof getParent<T>>;
    getChildren: (id: string) => ReturnType<typeof getChildren<T>>;
    getRootNodes: () => ReturnType<typeof getRootNodes<T>>;
    needsChildrenLoad: (id: string) => boolean;
    hasMoreChildren: (id: string) => boolean;
    areAncestorsExpanded: (id: string) => boolean;
    getPathToNode: (id: string) => string[];

    // Move
    moveNode: (id: string, newParentId: string | null, index?: number) => void;

    // Reset
    clear: () => void;
};

/**
 * React hook for managing tree state without external store dependencies.
 *
 * For nanostore integration, use the pure functions directly with atom/computed.
 * This hook provides a self-contained alternative for simpler use cases.
 *
 * @example
 * ```tsx
 * function TreeView() {
 *   const { flatNodes, expand, collapse, toggle } = useTreeStore<MyData>();
 *
 *   return (
 *     <VirtualizedTreeList
 *       items={flatNodes}
 *       onExpand={expand}
 *       onCollapse={collapse}
 *     >
 *       {({ items, getItemProps, containerProps }) => (
 *         <Virtuoso data={items} {...containerProps} />
 *       )}
 *     </VirtualizedTreeList>
 *   );
 * }
 * ```
 */
export function useTreeStore<T>(options: UseTreeStoreOptions<T> = {}): UseTreeStoreReturn<T> {
    const {initialState} = options;

    // Internal state ref + subscribers pattern for useSyncExternalStore
    const stateRef = useRef<TreeState<T>>(initialState ?? actions.createEmptyState<T>());
    const subscribersRef = useRef<Set<() => void>>(new Set());

    const subscribe = useCallback((callback: () => void) => {
        subscribersRef.current.add(callback);
        return () => {
            subscribersRef.current.delete(callback);
        };
    }, []);

    const getSnapshot = useCallback(() => stateRef.current, []);

    const setState = useCallback((newState: TreeState<T>) => {
        stateRef.current = newState;
        subscribersRef.current.forEach(cb => cb());
    }, []);

    // Subscribe to state changes
    const state = useSyncExternalStore(subscribe, getSnapshot);

    // Memoized flat nodes
    const flatNodes = useMemo(() => flattenTree(state), [state]);

    // Create bound action functions
    const boundActions = useMemo(
        () => ({
            setNode: (opts: CreateNodeOptions<T>) => setState(actions.setNode(stateRef.current, opts)),
            setNodes: (opts: CreateNodeOptions<T>[]) =>
                setState(actions.setNodes(stateRef.current, opts)),
            setNodeData: (id: string, data: T) =>
                setState(actions.setNodeData(stateRef.current, id, data)),
            updateNodeData: (id: string, patch: Partial<T>) =>
                setState(actions.updateNodeData(stateRef.current, id, patch)),
            removeNode: (id: string, removeDesc?: boolean) =>
                setState(actions.removeNode(stateRef.current, id, removeDesc)),
            removeNodes: (ids: string[], removeDesc?: boolean) =>
                setState(actions.removeNodes(stateRef.current, ids, removeDesc)),
            setChildren: (parentId: string | null, childIds: string[]) =>
                setState(actions.setChildren(stateRef.current, parentId, childIds)),
            appendChildren: (parentId: string | null, childIds: string[]) =>
                setState(actions.appendChildren(stateRef.current, parentId, childIds)),
            setRootIds: (ids: string[]) => setState(actions.setRootIds(stateRef.current, ids)),
            expand: (id: string) => setState(actions.expand(stateRef.current, id)),
            collapse: (id: string) => setState(actions.collapse(stateRef.current, id)),
            toggle: (id: string) => setState(actions.toggle(stateRef.current, id)),
            expandAll: (ids?: string[]) => setState(actions.expandAll(stateRef.current, ids)),
            collapseAll: (ids?: string[]) => setState(actions.collapseAll(stateRef.current, ids)),
            expandToNode: (id: string) => setState(actions.expandToNode(stateRef.current, id)),
            setLoading: (id: string | null, loading: boolean) =>
                setState(actions.setLoading(stateRef.current, id, loading)),
            setLoadingData: (ids: string[], loading: boolean) =>
                setState(actions.setLoadingData(stateRef.current, ids, loading)),
            moveNode: (id: string, newParentId: string | null, index?: number) =>
                setState(actions.moveNode(stateRef.current, id, newParentId, index)),
            clear: () => setState(actions.createEmptyState<T>()),
        }),
        [setState]
    );

    // Create bound selector functions
    const selectors = useMemo(
        () => ({
            getNode: (id: string) => getNode(state, id),
            hasNode: (id: string) => hasNode(state, id),
            isExpanded: (id: string) => isExpanded(state, id),
            isLoading: (id: string | null) => isLoading(state, id),
            isLoadingData: (id: string) => isLoadingData(state, id),
            getAncestorIds: (id: string) => getAncestorIds(state, id),
            getDescendantIds: (id: string) => getDescendantIds(state, id),
            getSiblingIds: (id: string) => getSiblingIds(state, id),
            getNodeLevel: (id: string) => getNodeLevel(state, id),
            getParent: (id: string) => getParent(state, id),
            getChildren: (id: string) => getChildren(state, id),
            getRootNodes: () => getRootNodes(state),
            needsChildrenLoad: (id: string) => needsChildrenLoad(state, id),
            hasMoreChildren: (id: string) => hasMoreChildren(state, id),
            areAncestorsExpanded: (id: string) => areAncestorsExpanded(state, id),
            getPathToNode: (id: string) => getPathToNode(state, id),
        }),
        [state]
    );

    return {
        state,
        flatNodes,
        ...boundActions,
        ...selectors,
    };
}
