import {describe, it, expect} from 'vitest';
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
import {createEmptyState, setNodes, setRootIds, expand, setLoading, setLoadingData} from './actions';

describe('getNode', () => {
    it('returns node by ID', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [{id: '1', data: {name: 'Test'}}]);

        const node = getNode(state, '1');

        expect(node?.data).toEqual({name: 'Test'});
    });

    it('returns undefined for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(getNode(state, 'non-existent')).toBeUndefined();
    });
});

describe('hasNode', () => {
    it('returns true for existing node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(hasNode(state, '1')).toBe(true);
    });

    it('returns false for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(hasNode(state, '1')).toBe(false);
    });
});

describe('isExpanded', () => {
    it('returns true for expanded node', () => {
        let state = createEmptyState<null>();
        state = expand(state, '1');

        expect(isExpanded(state, '1')).toBe(true);
    });

    it('returns false for collapsed node', () => {
        const state = createEmptyState<null>();
        expect(isExpanded(state, '1')).toBe(false);
    });
});

describe('isLoading', () => {
    it('returns true for loading node', () => {
        let state = createEmptyState<null>();
        state = setLoading(state, '1', true);

        expect(isLoading(state, '1')).toBe(true);
    });

    it('returns false for non-loading node', () => {
        const state = createEmptyState<null>();
        expect(isLoading(state, '1')).toBe(false);
    });

    it('handles root-level loading with null ID', () => {
        let state = createEmptyState<null>();
        state = setLoading(state, null, true);

        expect(isLoading(state, null)).toBe(true);
    });
});

describe('isLoadingData', () => {
    it('returns true for node loading data', () => {
        let state = createEmptyState<null>();
        state = setLoadingData(state, ['1'], true);

        expect(isLoadingData(state, '1')).toBe(true);
    });

    it('returns false for node not loading data', () => {
        const state = createEmptyState<null>();
        expect(isLoadingData(state, '1')).toBe(false);
    });
});

describe('getAncestorIds', () => {
    it('returns ancestors from parent to root', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);

        const ancestors = getAncestorIds(state, '1-1-1');

        expect(ancestors).toEqual(['1-1', '1']);
    });

    it('returns empty array for root node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(getAncestorIds(state, '1')).toEqual([]);
    });

    it('returns empty array for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(getAncestorIds(state, 'non-existent')).toEqual([]);
    });
});

describe('getDescendantIds', () => {
    it('returns all descendants in depth-first order', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
            {id: '1-2', data: null, parentId: '1'},
        ]);

        const descendants = getDescendantIds(state, '1');

        // Implementation uses stack with pop(), so processes children from last to first
        // '1-2' is processed first, then '1-1' and its descendant '1-1-1'
        expect(descendants).toEqual(['1-2', '1-1', '1-1-1']);
    });

    it('returns empty array for leaf node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(getDescendantIds(state, '1')).toEqual([]);
    });

    it('returns empty array for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(getDescendantIds(state, 'non-existent')).toEqual([]);
    });
});

describe('getSiblingIds', () => {
    it('returns sibling IDs for child node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2', '1-3']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
            {id: '1-3', data: null, parentId: '1'},
        ]);

        const siblings = getSiblingIds(state, '1-2');

        expect(siblings).toEqual(['1-1', '1-3']);
    });

    it('returns sibling root IDs for root node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
            {id: '3', data: null},
        ]);
        state = setRootIds(state, ['1', '2', '3']);

        const siblings = getSiblingIds(state, '2');

        expect(siblings).toEqual(['1', '3']);
    });

    it('returns empty array for only child', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
        ]);

        expect(getSiblingIds(state, '1-1')).toEqual([]);
    });

    it('returns empty array for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(getSiblingIds(state, 'non-existent')).toEqual([]);
    });
});

describe('getNodeLevel', () => {
    it('returns 1 for root nodes', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1']);

        expect(getNodeLevel(state, '1')).toBe(1);
    });

    it('returns correct level for nested nodes', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);

        expect(getNodeLevel(state, '1-1')).toBe(2);
        expect(getNodeLevel(state, '1-1-1')).toBe(3);
    });
});

describe('isAncestorOf', () => {
    it('returns true when ancestor relationship exists', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);

        expect(isAncestorOf(state, '1', '1-1-1')).toBe(true);
        expect(isAncestorOf(state, '1-1', '1-1-1')).toBe(true);
    });

    it('returns false when no ancestor relationship', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
        ]);

        expect(isAncestorOf(state, '1', '2')).toBe(false);
    });

    it('returns false for same node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(isAncestorOf(state, '1', '1')).toBe(false);
    });
});

describe('isDescendantOf', () => {
    it('returns true when descendant relationship exists', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
        ]);

        expect(isDescendantOf(state, '1-1', '1')).toBe(true);
    });

    it('returns false when no descendant relationship', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
        ]);

        expect(isDescendantOf(state, '1', '2')).toBe(false);
    });
});

describe('getParent', () => {
    it('returns parent node', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'Parent'}, childIds: ['1-1']},
            {id: '1-1', data: {name: 'Child'}, parentId: '1'},
        ]);

        const parent = getParent(state, '1-1');

        expect(parent?.data?.name).toBe('Parent');
    });

    it('returns undefined for root node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(getParent(state, '1')).toBeUndefined();
    });

    it('returns undefined for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(getParent(state, 'non-existent')).toBeUndefined();
    });
});

describe('getChildren', () => {
    it('returns child nodes', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'Parent'}, childIds: ['1-1', '1-2']},
            {id: '1-1', data: {name: 'Child 1'}, parentId: '1'},
            {id: '1-2', data: {name: 'Child 2'}, parentId: '1'},
        ]);

        const children = getChildren(state, '1');

        expect(children).toHaveLength(2);
        expect(children[0].data?.name).toBe('Child 1');
        expect(children[1].data?.name).toBe('Child 2');
    });

    it('returns empty array for leaf node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(getChildren(state, '1')).toEqual([]);
    });

    it('returns empty array for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(getChildren(state, 'non-existent')).toEqual([]);
    });

    it('filters out missing child nodes gracefully', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', 'missing']},
            {id: '1-1', data: null, parentId: '1'},
        ]);

        const children = getChildren(state, '1');

        expect(children).toHaveLength(1);
        expect(children[0].id).toBe('1-1');
    });
});

describe('getRootNodes', () => {
    it('returns root nodes in order', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: {name: 'B'}},
            {id: '3', data: {name: 'C'}},
        ]);
        state = setRootIds(state, ['1', '2', '3']);

        const roots = getRootNodes(state);

        expect(roots).toHaveLength(3);
        expect(roots.map(n => n.data?.name)).toEqual(['A', 'B', 'C']);
    });

    it('returns empty array for empty tree', () => {
        const state = createEmptyState<null>();
        expect(getRootNodes(state)).toEqual([]);
    });

    it('filters out missing root nodes gracefully', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1', 'missing']);

        const roots = getRootNodes(state);

        expect(roots).toHaveLength(1);
        expect(roots[0].id).toBe('1');
    });
});

describe('findNodes', () => {
    it('finds nodes matching predicate', () => {
        let state = createEmptyState<{active: boolean}>();
        state = setNodes(state, [
            {id: '1', data: {active: true}},
            {id: '2', data: {active: false}},
            {id: '3', data: {active: true}},
        ]);

        const found = findNodes(state, node => node.data?.active === true);

        expect(found).toHaveLength(2);
        expect(found.map(n => n.id).sort()).toEqual(['1', '3']);
    });

    it('returns empty array when no matches', () => {
        let state = createEmptyState<{active: boolean}>();
        state = setNodes(state, [{id: '1', data: {active: false}}]);

        const found = findNodes(state, node => node.data?.active === true);

        expect(found).toEqual([]);
    });
});

describe('findNode', () => {
    it('finds first node matching predicate', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: {name: 'B'}},
        ]);

        const found = findNode(state, node => node.data?.name === 'B');

        expect(found?.id).toBe('2');
    });

    it('returns undefined when no match', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [{id: '1', data: {name: 'A'}}]);

        const found = findNode(state, node => node.data?.name === 'Z');

        expect(found).toBeUndefined();
    });
});

describe('getNodesWithPendingData', () => {
    it('returns IDs of nodes with null data', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: null},
            {id: '3', data: null},
            {id: '4', data: {name: 'D'}},
        ]);

        const pending = getNodesWithPendingData(state);

        expect(pending.sort()).toEqual(['2', '3']);
    });

    it('returns empty array when all data loaded', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: {name: 'B'}},
        ]);

        expect(getNodesWithPendingData(state)).toEqual([]);
    });
});

describe('getNodesWithData', () => {
    it('returns IDs of nodes with data', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: null},
            {id: '3', data: {name: 'C'}},
        ]);

        const loaded = getNodesWithData(state);

        expect(loaded.sort()).toEqual(['1', '3']);
    });
});

describe('getNodeCount', () => {
    it('returns total node count', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
            {id: '3', data: null},
        ]);

        expect(getNodeCount(state)).toBe(3);
    });

    it('returns 0 for empty tree', () => {
        const state = createEmptyState<null>();
        expect(getNodeCount(state)).toBe(0);
    });
});

describe('getExpandedCount', () => {
    it('returns expanded node count', () => {
        let state = createEmptyState<null>();
        state = expand(state, '1');
        state = expand(state, '2');

        expect(getExpandedCount(state)).toBe(2);
    });

    it('returns 0 when none expanded', () => {
        const state = createEmptyState<null>();
        expect(getExpandedCount(state)).toBe(0);
    });
});

describe('isEmpty', () => {
    it('returns true for empty tree', () => {
        const state = createEmptyState<null>();
        expect(isEmpty(state)).toBe(true);
    });

    it('returns false for non-empty tree', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(isEmpty(state)).toBe(false);
    });
});

describe('getPathToNode', () => {
    it('returns path from root to node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);

        const path = getPathToNode(state, '1-1-1');

        expect(path).toEqual(['1', '1-1', '1-1-1']);
    });

    it('returns single item for root node', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(getPathToNode(state, '1')).toEqual(['1']);
    });
});

describe('areAncestorsExpanded', () => {
    it('returns true when all ancestors expanded', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);
        state = expand(state, '1');
        state = expand(state, '1-1');

        expect(areAncestorsExpanded(state, '1-1-1')).toBe(true);
    });

    it('returns false when any ancestor collapsed', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);
        state = expand(state, '1');
        // 1-1 not expanded

        expect(areAncestorsExpanded(state, '1-1-1')).toBe(false);
    });

    it('returns true for root node (no ancestors)', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);

        expect(areAncestorsExpanded(state, '1')).toBe(true);
    });
});

describe('needsChildrenLoad', () => {
    it('returns true when hasChildren but no childIds', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, hasChildren: true}]);

        expect(needsChildrenLoad(state, '1')).toBe(true);
    });

    it('returns false when already loading', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, hasChildren: true}]);
        state = setLoading(state, '1', true);

        expect(needsChildrenLoad(state, '1')).toBe(false);
    });

    it('returns false when children loaded', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, hasChildren: true, childIds: ['1-1']}]);

        expect(needsChildrenLoad(state, '1')).toBe(false);
    });

    it('returns false when hasChildren is false', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, hasChildren: false}]);

        expect(needsChildrenLoad(state, '1')).toBe(false);
    });

    it('returns false for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(needsChildrenLoad(state, 'non-existent')).toBe(false);
    });
});

describe('hasMoreChildren', () => {
    it('returns true when loadedCount < totalChildren', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, childIds: ['1-1'], totalChildren: 10}]);

        expect(hasMoreChildren(state, '1')).toBe(true);
    });

    it('returns false when all loaded', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, childIds: ['1-1', '1-2'], totalChildren: 2}]);

        expect(hasMoreChildren(state, '1')).toBe(false);
    });

    it('returns false when totalChildren undefined', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null, childIds: ['1-1']}]);

        expect(hasMoreChildren(state, '1')).toBe(false);
    });

    it('returns false for non-existent node', () => {
        const state = createEmptyState<null>();
        expect(hasMoreChildren(state, 'non-existent')).toBe(false);
    });
});
