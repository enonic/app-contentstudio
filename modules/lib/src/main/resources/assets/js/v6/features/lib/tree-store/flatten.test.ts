import {describe, it, expect} from 'vitest';
import {
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
import {createEmptyState, setNodes, setRootIds, expand, setLoading, setLoadingData} from './actions';
import {LOADING_NODE_PREFIX} from './types';

describe('flattenTree', () => {
    it('returns empty array for empty state', () => {
        const state = createEmptyState<null>();
        const result = flattenTree(state);
        expect(result).toEqual([]);
    });

    it('flattens root nodes with level 1', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: {name: 'B'}},
        ]);
        state = setRootIds(state, ['1', '2']);

        const result = flattenTree(state);

        expect(result).toHaveLength(2);
        expect(result[0].level).toBe(1);
        expect(result[1].level).toBe(1);
    });

    it('maintains correct order (DFS pre-order)', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2'], hasChildren: true},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
            {id: '2', data: null},
        ]);
        state = setRootIds(state, ['1', '2']);
        state = expand(state, '1');

        const result = flattenTree(state);
        const ids = result.map(n => n.id);

        expect(ids).toEqual(['1', '1-1', '1-2', '2']);
    });

    it('excludes collapsed children', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1'], hasChildren: true},
            {id: '1-1', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);
        // Not expanded

        const result = flattenTree(state);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('calculates correct levels for nested nodes', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1'], hasChildren: true},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1'], hasChildren: true},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');
        state = expand(state, '1-1');

        const result = flattenTree(state);

        expect(result[0].level).toBe(1); // root
        expect(result[1].level).toBe(2); // child
        expect(result[2].level).toBe(3); // grandchild
    });

    it('injects loading node when hasChildren but no childIds', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, hasChildren: true, childIds: []},
        ]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');

        const result = flattenTree(state);

        expect(result).toHaveLength(2);
        expect(result[1].nodeType).toBe('loading');
        expect(result[1].level).toBe(2);
    });

    it('injects loading node when isLoading', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, hasChildren: true, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');
        state = setLoading(state, '1', true);

        const result = flattenTree(state);

        // Should have: 1, 1-1, loading
        expect(result).toHaveLength(3);
        expect(result[2].nodeType).toBe('loading');
    });

    it('injects loading node for pagination (hasMore)', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, hasChildren: true, childIds: ['1-1'], totalChildren: 5},
            {id: '1-1', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');

        const result = flattenTree(state);

        // Should have: 1, 1-1, loading (because 1 < 5)
        expect(result).toHaveLength(3);
        expect(result[2].nodeType).toBe('loading');
    });

    it('does not inject loading node when all children loaded', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, hasChildren: true, childIds: ['1-1', '1-2'], totalChildren: 2},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');

        const result = flattenTree(state);

        // Should have: 1, 1-1, 1-2 (no loading because 2 === 2)
        expect(result).toHaveLength(3);
        expect(result.every(n => n.nodeType === 'node')).toBe(true);
    });

    it('sets correct flags on flat nodes', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'Test'}, hasChildren: true},
        ]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');
        state = setLoading(state, '1', true);

        const result = flattenTree(state);

        expect(result[0]).toMatchObject({
            id: '1',
            data: {name: 'Test'},
            isExpanded: true,
            isLoading: true,
            hasChildren: true,
            nodeType: 'node',
        });
    });

    it('sets isLoadingData flag correctly', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1']);
        state = setLoadingData(state, ['1'], true);

        const result = flattenTree(state);

        expect(result[0].isLoadingData).toBe(true);
    });

    it('handles root-level loading indicator', () => {
        let state = createEmptyState<null>();
        state = setLoading(state, null, true);

        const result = flattenTree(state);

        expect(result).toHaveLength(1);
        expect(result[0].nodeType).toBe('loading');
        expect(result[0].level).toBe(1);
    });

    it('does not show root loading when roots exist', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1']);
        state = setLoading(state, null, true);

        const result = flattenTree(state);

        // Should only have the node, not the loading indicator
        expect(result).toHaveLength(1);
        expect(result[0].nodeType).toBe('node');
    });

    it('skips missing nodes gracefully', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1', 'missing', '2']); // 'missing' and '2' don't exist

        const result = flattenTree(state);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe('1');
    });

    it('handles deeply nested tree', () => {
        let state = createEmptyState<null>();
        const nodes = [];
        const depth = 10;

        for (let i = 0; i < depth; i++) {
            const id = `level-${i}`;
            const parentId = i === 0 ? null : `level-${i - 1}`;
            const childIds = i < depth - 1 ? [`level-${i + 1}`] : [];
            nodes.push({id, data: null, parentId, childIds, hasChildren: childIds.length > 0});
        }

        state = setNodes(state, nodes);
        state = setRootIds(state, ['level-0']);

        // Expand all
        for (let i = 0; i < depth - 1; i++) {
            state = expand(state, `level-${i}`);
        }

        const result = flattenTree(state);

        expect(result).toHaveLength(depth);
        expect(result[depth - 1].level).toBe(depth);
    });
});

describe('isLoadingNodeId', () => {
    it('returns true for loading node IDs', () => {
        expect(isLoadingNodeId(`${LOADING_NODE_PREFIX}1__0`)).toBe(true);
        expect(isLoadingNodeId(`${LOADING_NODE_PREFIX}parent-123__5`)).toBe(true);
        expect(isLoadingNodeId(`${LOADING_NODE_PREFIX}root__0`)).toBe(true);
    });

    it('returns false for regular node IDs', () => {
        expect(isLoadingNodeId('1')).toBe(false);
        expect(isLoadingNodeId('node-123')).toBe(false);
        expect(isLoadingNodeId('')).toBe(false);
    });
});

describe('getLoadingNodeParentId', () => {
    it('extracts parent ID from loading node', () => {
        expect(getLoadingNodeParentId(`${LOADING_NODE_PREFIX}parent-123__5`)).toBe('parent-123');
        expect(getLoadingNodeParentId(`${LOADING_NODE_PREFIX}1__0`)).toBe('1');
    });

    it('returns null for root loading node', () => {
        expect(getLoadingNodeParentId(`${LOADING_NODE_PREFIX}root__0`)).toBe(null);
    });

    it('returns null for non-loading node IDs', () => {
        expect(getLoadingNodeParentId('1')).toBe(null);
        expect(getLoadingNodeParentId('regular-id')).toBe(null);
    });
});

describe('getVisibleNodeCount', () => {
    it('counts only actual nodes, not loading indicators', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, hasChildren: true},
            {id: '2', data: null},
        ]);
        state = setRootIds(state, ['1', '2']);
        state = expand(state, '1');

        const flatNodes = flattenTree(state);
        const count = getVisibleNodeCount(flatNodes);

        // 2 nodes + 1 loading indicator, but count should be 2
        expect(count).toBe(2);
    });
});

describe('findFlatNode', () => {
    it('finds node by ID', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: {name: 'B'}},
        ]);
        state = setRootIds(state, ['1', '2']);

        const flatNodes = flattenTree(state);
        const found = findFlatNode(flatNodes, '2');

        expect(found?.data?.name).toBe('B');
    });

    it('returns undefined for non-existent ID', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1']);

        const flatNodes = flattenTree(state);
        const found = findFlatNode(flatNodes, 'non-existent');

        expect(found).toBeUndefined();
    });
});

describe('getFlatNodeIndex', () => {
    it('returns index of node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
            {id: '3', data: null},
        ]);
        state = setRootIds(state, ['1', '2', '3']);

        const flatNodes = flattenTree(state);

        expect(getFlatNodeIndex(flatNodes, '1')).toBe(0);
        expect(getFlatNodeIndex(flatNodes, '2')).toBe(1);
        expect(getFlatNodeIndex(flatNodes, '3')).toBe(2);
    });

    it('returns -1 for non-existent ID', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1']);

        const flatNodes = flattenTree(state);

        expect(getFlatNodeIndex(flatNodes, 'non-existent')).toBe(-1);
    });
});

describe('getFlatNodesAtLevel', () => {
    it('returns nodes at specific level', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2'], hasChildren: true},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
            {id: '2', data: null},
        ]);
        state = setRootIds(state, ['1', '2']);
        state = expand(state, '1');

        const flatNodes = flattenTree(state);
        const level1 = getFlatNodesAtLevel(flatNodes, 1);
        const level2 = getFlatNodesAtLevel(flatNodes, 2);

        expect(level1.map(n => n.id)).toEqual(['1', '2']);
        expect(level2.map(n => n.id)).toEqual(['1-1', '1-2']);
    });
});

describe('getFlatNodesInRange', () => {
    it('returns nodes in range', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
            {id: '3', data: null},
            {id: '4', data: null},
        ]);
        state = setRootIds(state, ['1', '2', '3', '4']);

        const flatNodes = flattenTree(state);
        const range = getFlatNodesInRange(flatNodes, 1, 3);

        expect(range.map(n => n.id)).toEqual(['2', '3']);
    });
});

describe('getPendingDataIds', () => {
    it('returns IDs of nodes with null data', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: null},
            {id: '3', data: null},
            {id: '4', data: {name: 'D'}},
        ]);
        state = setRootIds(state, ['1', '2', '3', '4']);

        const flatNodes = flattenTree(state);
        const pending = getPendingDataIds(flatNodes);

        expect(pending).toEqual(['2', '3']);
    });

    it('excludes nodes that are already loading data', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
        ]);
        state = setRootIds(state, ['1', '2']);
        state = setLoadingData(state, ['1'], true);

        const flatNodes = flattenTree(state);
        const pending = getPendingDataIds(flatNodes);

        expect(pending).toEqual(['2']);
    });

    it('excludes loading placeholder nodes', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, hasChildren: true}]);
        state = setRootIds(state, ['1']);
        state = expand(state, '1');

        const flatNodes = flattenTree(state);
        const pending = getPendingDataIds(flatNodes);

        // Only the actual node, not the loading placeholder
        expect(pending).toEqual(['1']);
    });
});

describe('getPendingDataIdsInRange', () => {
    it('returns pending IDs within range', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: null},
            {id: '3', data: null},
            {id: '4', data: {name: 'D'}},
        ]);
        state = setRootIds(state, ['1', '2', '3', '4']);

        const flatNodes = flattenTree(state);
        const pending = getPendingDataIdsInRange(flatNodes, 1, 3);

        expect(pending).toEqual(['2', '3']);
    });

    it('handles range at start', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: {name: 'B'}},
        ]);
        state = setRootIds(state, ['1', '2']);

        const flatNodes = flattenTree(state);
        const pending = getPendingDataIdsInRange(flatNodes, 0, 1);

        expect(pending).toEqual(['1']);
    });
});
