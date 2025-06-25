import {describe, it, expect} from 'vitest';
import {
    createEmptyState,
    setNode,
    setNodes,
    setNodeData,
    updateNodeData,
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
    moveNode,
} from './actions';

describe('createEmptyState', () => {
    it('creates empty state with all required fields', () => {
        const state = createEmptyState();
        expect(state.nodes.size).toBe(0);
        expect(state.rootIds).toEqual([]);
        expect(state.expandedIds.size).toBe(0);
        expect(state.loadingIds.size).toBe(0);
        expect(state.loadingDataIds.size).toBe(0);
    });
});

describe('setNode', () => {
    it('adds new node to empty state', () => {
        const state = createEmptyState<{name: string}>();
        const result = setNode(state, {id: '1', data: {name: 'Test'}});

        expect(result.nodes.size).toBe(1);
        expect(result.nodes.get('1')).toEqual({
            id: '1',
            data: {name: 'Test'},
            parentId: null,
            childIds: [],
            hasChildren: false,
            totalChildren: undefined,
        });
    });

    it('merges with existing node', () => {
        let state = createEmptyState<{name: string}>();
        state = setNode(state, {id: '1', data: {name: 'Test'}, hasChildren: true});
        state = setNode(state, {id: '1', data: {name: 'Updated'}});

        expect(state.nodes.get('1')?.data).toEqual({name: 'Updated'});
        expect(state.nodes.get('1')?.hasChildren).toBe(true);
    });

    it('preserves immutability', () => {
        const state = createEmptyState<null>();
        const result = setNode(state, {id: '1', data: null});

        expect(result).not.toBe(state);
        expect(result.nodes).not.toBe(state.nodes);
    });

    it('creates node with null data by default', () => {
        const state = createEmptyState<{name: string}>();
        const result = setNode(state, {id: '1'});

        expect(result.nodes.get('1')?.data).toBeNull();
    });

    it('sets parentId correctly', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null});
        state = setNode(state, {id: '1-1', data: null, parentId: '1'});

        expect(state.nodes.get('1-1')?.parentId).toBe('1');
    });
});

describe('setNodes', () => {
    it('adds multiple nodes in batch', () => {
        const state = createEmptyState<{name: string}>();
        const result = setNodes(state, [
            {id: '1', data: {name: 'A'}},
            {id: '2', data: {name: 'B'}},
            {id: '3', data: {name: 'C'}},
        ]);

        expect(result.nodes.size).toBe(3);
    });

    it('updates multiple existing nodes', () => {
        let state = createEmptyState<{name: string}>();
        state = setNodes(state, [
            {id: '1', data: {name: 'A'}, hasChildren: true},
            {id: '2', data: {name: 'B'}},
        ]);

        state = setNodes(state, [
            {id: '1', data: {name: 'Updated A'}},
            {id: '2', hasChildren: true},
        ]);

        expect(state.nodes.get('1')?.data?.name).toBe('Updated A');
        expect(state.nodes.get('1')?.hasChildren).toBe(true);
        expect(state.nodes.get('2')?.hasChildren).toBe(true);
    });
});

describe('setNodeData', () => {
    it('updates node data', () => {
        let state = createEmptyState<{name: string}>();
        state = setNode(state, {id: '1', data: {name: 'Old'}});

        const result = setNodeData(state, '1', {name: 'New'});

        expect(result.nodes.get('1')?.data).toEqual({name: 'New'});
    });

    it('returns same state if node does not exist', () => {
        const state = createEmptyState<{name: string}>();
        const result = setNodeData(state, 'non-existent', {name: 'Test'});

        expect(result).toBe(state);
    });
});

describe('updateNodeData', () => {
    it('merges partial data into existing node', () => {
        let state = createEmptyState<{name: string; value: number}>();
        state = setNode(state, {id: '1', data: {name: 'Test', value: 1}});

        const result = updateNodeData(state, '1', {value: 2});

        expect(result.nodes.get('1')?.data).toEqual({name: 'Test', value: 2});
    });

    it('returns same state if node has null data', () => {
        let state = createEmptyState<{name: string}>();
        state = setNode(state, {id: '1', data: null});

        const result = updateNodeData(state, '1', {name: 'Test'});

        expect(result).toBe(state);
    });
});

describe('removeNode', () => {
    it('removes node and descendants by default', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1', childIds: ['1-2-1']},
            {id: '1-2-1', data: null, parentId: '1-2'},
        ]);
        state = setRootIds(state, ['1']);

        const result = removeNode(state, '1');

        expect(result.nodes.size).toBe(0);
        expect(result.rootIds).toEqual([]);
    });

    it('promotes children to grandparent when removeDescendants=false', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1', '1-1-2']},
            {id: '1-1-1', data: null, parentId: '1-1'},
            {id: '1-1-2', data: null, parentId: '1-1'},
        ]);
        state = setRootIds(state, ['1']);

        const result = removeNode(state, '1-1', false);

        // '1-1' is removed, children promoted to '1'
        expect(result.nodes.has('1-1')).toBe(false);
        expect(result.nodes.get('1')?.childIds).toEqual(['1-1-1', '1-1-2']);
        expect(result.nodes.get('1-1-1')?.parentId).toBe('1');
        expect(result.nodes.get('1-1-2')?.parentId).toBe('1');
    });

    it('promotes children to root when removing root node with removeDescendants=false', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);

        const result = removeNode(state, '1', false);

        // '1' is removed, children promoted to root
        expect(result.nodes.has('1')).toBe(false);
        expect(result.rootIds).toEqual(['1-1', '1-2']);
        expect(result.nodes.get('1-1')?.parentId).toBe(null);
        expect(result.nodes.get('1-2')?.parentId).toBe(null);
    });

    it('cleans up expanded/loading states', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null});
        state = expand(state, '1');
        state = setLoading(state, '1', true);
        state = setLoadingData(state, ['1'], true);

        const result = removeNode(state, '1');

        expect(result.expandedIds.has('1')).toBe(false);
        expect(result.loadingIds.has('1')).toBe(false);
        expect(result.loadingDataIds.has('1')).toBe(false);
    });

    it('updates parent childIds when removing child', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
        ]);

        const result = removeNode(state, '1-1');

        expect(result.nodes.get('1')?.childIds).toEqual(['1-2']);
    });

    it('returns same state if node does not exist', () => {
        const state = createEmptyState<null>();
        const result = removeNode(state, 'non-existent');

        expect(result).toBe(state);
    });
});

describe('removeNodes', () => {
    it('removes multiple nodes in single operation', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
            {id: '3', data: null},
        ]);
        state = setRootIds(state, ['1', '2', '3']);

        const result = removeNodes(state, ['1', '3']);

        expect(result.nodes.size).toBe(1);
        expect(result.nodes.has('2')).toBe(true);
        expect(result.rootIds).toEqual(['2']);
    });

    it('removes descendants of all specified nodes', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '2', data: null, childIds: ['2-1', '2-2']},
            {id: '2-1', data: null, parentId: '2'},
            {id: '2-2', data: null, parentId: '2'},
        ]);
        state = setRootIds(state, ['1', '2']);

        const result = removeNodes(state, ['1', '2']);

        expect(result.nodes.size).toBe(0);
        expect(result.rootIds).toEqual([]);
    });

    it('updates parent childIds when removing multiple children', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2', '1-3']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
            {id: '1-3', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);

        const result = removeNodes(state, ['1-1', '1-3']);

        expect(result.nodes.get('1')?.childIds).toEqual(['1-2']);
    });

    it('returns same state for empty ids array', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null});

        const result = removeNodes(state, []);

        expect(result).toBe(state);
    });

    it('cleans up expanded/loading states for all removed nodes', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
        ]);
        state = expand(state, '1');
        state = expand(state, '2');
        state = setLoading(state, '1', true);
        state = setLoadingData(state, ['1', '2'], true);

        const result = removeNodes(state, ['1', '2']);

        expect(result.expandedIds.size).toBe(0);
        expect(result.loadingIds.size).toBe(0);
        expect(result.loadingDataIds.size).toBe(0);
    });
});

describe('setChildren', () => {
    it('sets root children when parentId is null', () => {
        const state = createEmptyState<null>();
        const result = setChildren(state, null, ['1', '2', '3']);

        expect(result.rootIds).toEqual(['1', '2', '3']);
    });

    it('sets children for existing node', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null});

        const result = setChildren(state, '1', ['1-1', '1-2']);

        expect(result.nodes.get('1')?.childIds).toEqual(['1-1', '1-2']);
        expect(result.nodes.get('1')?.hasChildren).toBe(true);
    });

    it('replaces existing children', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null, childIds: ['old-1', 'old-2']});

        const result = setChildren(state, '1', ['new-1']);

        expect(result.nodes.get('1')?.childIds).toEqual(['new-1']);
    });

    it('returns same state if parent does not exist', () => {
        const state = createEmptyState<null>();
        const result = setChildren(state, 'non-existent', ['1']);

        expect(result).toBe(state);
    });
});

describe('appendChildren', () => {
    it('appends to root children', () => {
        let state = createEmptyState<null>();
        state = setRootIds(state, ['1', '2']);

        const result = appendChildren(state, null, ['3', '4']);

        expect(result.rootIds).toEqual(['1', '2', '3', '4']);
    });

    it('appends to existing node children', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null, childIds: ['1-1']});

        const result = appendChildren(state, '1', ['1-2', '1-3']);

        expect(result.nodes.get('1')?.childIds).toEqual(['1-1', '1-2', '1-3']);
    });
});

describe('setRootIds', () => {
    it('sets root IDs', () => {
        const state = createEmptyState<null>();
        const result = setRootIds(state, ['a', 'b', 'c']);

        expect(result.rootIds).toEqual(['a', 'b', 'c']);
    });

    it('replaces existing root IDs', () => {
        let state = createEmptyState<null>();
        state = setRootIds(state, ['old']);

        const result = setRootIds(state, ['new']);

        expect(result.rootIds).toEqual(['new']);
    });
});

describe('expand/collapse/toggle', () => {
    it('expand adds to expandedIds', () => {
        const state = createEmptyState<null>();
        const result = expand(state, '1');

        expect(result.expandedIds.has('1')).toBe(true);
    });

    it('expand returns same state if already expanded', () => {
        let state = createEmptyState<null>();
        state = expand(state, '1');

        const result = expand(state, '1');

        expect(result).toBe(state);
    });

    it('collapse removes from expandedIds', () => {
        let state = createEmptyState<null>();
        state = expand(state, '1');

        const result = collapse(state, '1');

        expect(result.expandedIds.has('1')).toBe(false);
    });

    it('collapse returns same state if not expanded', () => {
        const state = createEmptyState<null>();
        const result = collapse(state, '1');

        expect(result).toBe(state);
    });

    it('toggle switches state', () => {
        let state = createEmptyState<null>();

        state = toggle(state, '1');
        expect(state.expandedIds.has('1')).toBe(true);

        state = toggle(state, '1');
        expect(state.expandedIds.has('1')).toBe(false);
    });
});

describe('expandAll', () => {
    it('expands specific IDs', () => {
        const state = createEmptyState<null>();
        const result = expandAll(state, ['1', '2', '3']);

        expect(result.expandedIds.has('1')).toBe(true);
        expect(result.expandedIds.has('2')).toBe(true);
        expect(result.expandedIds.has('3')).toBe(true);
    });

    it('expands all nodes with children when no IDs provided', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, hasChildren: true},
            {id: '2', data: null, childIds: ['2-1']},
            {id: '2-1', data: null, parentId: '2'},
            {id: '3', data: null}, // No children
        ]);

        const result = expandAll(state);

        expect(result.expandedIds.has('1')).toBe(true);
        expect(result.expandedIds.has('2')).toBe(true);
        expect(result.expandedIds.has('3')).toBe(false);
    });
});

describe('collapseAll', () => {
    it('collapses specific IDs', () => {
        let state = createEmptyState<null>();
        state = expand(state, '1');
        state = expand(state, '2');
        state = expand(state, '3');

        const result = collapseAll(state, ['1', '2']);

        expect(result.expandedIds.has('1')).toBe(false);
        expect(result.expandedIds.has('2')).toBe(false);
        expect(result.expandedIds.has('3')).toBe(true);
    });

    it('collapses all when no IDs provided', () => {
        let state = createEmptyState<null>();
        state = expand(state, '1');
        state = expand(state, '2');

        const result = collapseAll(state);

        expect(result.expandedIds.size).toBe(0);
    });
});

describe('expandToNode', () => {
    it('expands all ancestors', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);

        const result = expandToNode(state, '1-1-1');

        expect(result.expandedIds.has('1')).toBe(true);
        expect(result.expandedIds.has('1-1')).toBe(true);
        expect(result.expandedIds.has('1-1-1')).toBe(false); // Target not expanded
    });

    it('handles root nodes', () => {
        let state = createEmptyState<null>();
        state = setNode(state, {id: '1', data: null});

        const result = expandToNode(state, '1');

        expect(result.expandedIds.size).toBe(0);
    });
});

describe('setLoading', () => {
    it('sets loading state for node', () => {
        const state = createEmptyState<null>();
        const result = setLoading(state, '1', true);

        expect(result.loadingIds.has('1')).toBe(true);
    });

    it('clears loading state', () => {
        let state = createEmptyState<null>();
        state = setLoading(state, '1', true);

        const result = setLoading(state, '1', false);

        expect(result.loadingIds.has('1')).toBe(false);
    });

    it('uses ROOT_LOADING_KEY for null id', () => {
        const state = createEmptyState<null>();
        const result = setLoading(state, null, true);

        expect(result.loadingIds.has('__root__')).toBe(true);
    });
});

describe('setLoadingData', () => {
    it('sets loading data state for multiple nodes', () => {
        const state = createEmptyState<null>();
        const result = setLoadingData(state, ['1', '2', '3'], true);

        expect(result.loadingDataIds.has('1')).toBe(true);
        expect(result.loadingDataIds.has('2')).toBe(true);
        expect(result.loadingDataIds.has('3')).toBe(true);
    });

    it('clears loading data state', () => {
        let state = createEmptyState<null>();
        state = setLoadingData(state, ['1', '2'], true);

        const result = setLoadingData(state, ['1'], false);

        expect(result.loadingDataIds.has('1')).toBe(false);
        expect(result.loadingDataIds.has('2')).toBe(true);
    });
});

describe('moveNode', () => {
    it('moves node to new parent', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '2', data: null},
        ]);
        state = setRootIds(state, ['1', '2']);

        const result = moveNode(state, '1-1', '2');

        expect(result.nodes.get('1')?.childIds).toEqual([]);
        expect(result.nodes.get('2')?.childIds).toEqual(['1-1']);
        expect(result.nodes.get('1-1')?.parentId).toBe('2');
    });

    it('moves node to root', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);

        const result = moveNode(state, '1-1', null);

        expect(result.rootIds).toContain('1-1');
        expect(result.nodes.get('1-1')?.parentId).toBe(null);
        expect(result.nodes.get('1')?.childIds).toEqual([]);
    });

    it('moves node to specific index', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1', '1-2']},
            {id: '1-1', data: null, parentId: '1'},
            {id: '1-2', data: null, parentId: '1'},
            {id: '2', data: null, childIds: ['2-1']},
            {id: '2-1', data: null, parentId: '2'},
        ]);

        const result = moveNode(state, '1-1', '2', 0);

        expect(result.nodes.get('2')?.childIds).toEqual(['1-1', '2-1']);
    });

    it('moves root node to another parent', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null},
            {id: '2', data: null},
        ]);
        state = setRootIds(state, ['1', '2']);

        const result = moveNode(state, '1', '2');

        expect(result.rootIds).toEqual(['2']);
        expect(result.nodes.get('2')?.childIds).toContain('1');
        expect(result.nodes.get('1')?.parentId).toBe('2');
    });

    it('returns same state if node does not exist', () => {
        const state = createEmptyState<null>();
        const result = moveNode(state, 'non-existent', '1');

        expect(result).toBe(state);
    });

    it('returns same state when moving to same parent', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
        ]);

        const result = moveNode(state, '1-1', '1');

        expect(result).toBe(state);
    });

    it('returns same state when moving node to itself', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [{id: '1', data: null}]);
        state = setRootIds(state, ['1']);

        const result = moveNode(state, '1', '1');

        expect(result).toBe(state);
    });

    it('prevents cycle by not moving node into its descendant', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1', childIds: ['1-1-1']},
            {id: '1-1-1', data: null, parentId: '1-1'},
        ]);
        state = setRootIds(state, ['1']);

        // Try to move '1' into its grandchild '1-1-1'
        const result = moveNode(state, '1', '1-1-1');

        // Should return unchanged state
        expect(result).toBe(state);
    });

    it('prevents cycle by not moving node into its direct child', () => {
        let state = createEmptyState<null>();
        state = setNodes(state, [
            {id: '1', data: null, childIds: ['1-1']},
            {id: '1-1', data: null, parentId: '1'},
        ]);
        state = setRootIds(state, ['1']);

        // Try to move '1' into its direct child '1-1'
        const result = moveNode(state, '1', '1-1');

        // Should return unchanged state
        expect(result).toBe(state);
    });
});
