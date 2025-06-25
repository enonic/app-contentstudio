import {describe, it, expect} from 'vitest';
import {renderHook, act} from '@testing-library/preact';
import {useTreeStore} from './react';
import {createEmptyState, setNodes, setRootIds} from './actions';

type TestData = {name: string};

describe('useTreeStore', () => {
    describe('initialization', () => {
        it('creates empty state by default', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            expect(result.current.state.nodes.size).toBe(0);
            expect(result.current.state.rootIds).toEqual([]);
            expect(result.current.flatNodes).toEqual([]);
        });

        it('uses initial state when provided', () => {
            let initialState = createEmptyState<TestData>();
            initialState = setNodes(initialState, [
                {id: '1', data: {name: 'Node 1'}},
                {id: '2', data: {name: 'Node 2'}},
            ]);
            initialState = setRootIds(initialState, ['1', '2']);

            const {result} = renderHook(() => useTreeStore<TestData>({initialState}));

            expect(result.current.state.nodes.size).toBe(2);
            expect(result.current.state.rootIds).toEqual(['1', '2']);
            expect(result.current.flatNodes.length).toBe(2);
        });
    });

    describe('node management', () => {
        it('setNode adds a new node', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
            });

            expect(result.current.state.nodes.size).toBe(1);
            expect(result.current.state.nodes.get('1')?.data).toEqual({name: 'Test'});
        });

        it('setNodes adds multiple nodes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}},
                    {id: '2', data: {name: 'Node 2'}},
                ]);
            });

            expect(result.current.state.nodes.size).toBe(2);
        });

        it('setNodeData updates node data', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Original'}});
            });

            act(() => {
                result.current.setNodeData('1', {name: 'Updated'});
            });

            expect(result.current.state.nodes.get('1')?.data).toEqual({name: 'Updated'});
        });

        it('updateNodeData partially updates node data', () => {
            const {result} = renderHook(() => useTreeStore<{name: string; count: number}>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test', count: 5}});
            });

            act(() => {
                result.current.updateNodeData('1', {count: 10});
            });

            expect(result.current.state.nodes.get('1')?.data).toEqual({name: 'Test', count: 10});
        });

        it('removeNode removes a node', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
                result.current.setRootIds(['1']);
            });

            expect(result.current.state.nodes.size).toBe(1);

            act(() => {
                result.current.removeNode('1');
            });

            expect(result.current.state.nodes.size).toBe(0);
        });

        it('removeNodes removes multiple nodes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}},
                    {id: '2', data: {name: 'Node 2'}},
                    {id: '3', data: {name: 'Node 3'}},
                ]);
                result.current.setRootIds(['1', '2', '3']);
            });

            act(() => {
                result.current.removeNodes(['1', '2']);
            });

            expect(result.current.state.nodes.size).toBe(1);
            expect(result.current.hasNode('3')).toBe(true);
        });

        it('setRootIds sets root IDs', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}},
                    {id: '2', data: {name: 'Node 2'}},
                ]);
                result.current.setRootIds(['1', '2']);
            });

            expect(result.current.state.rootIds).toEqual(['1', '2']);
        });

        it('setChildren sets children for a parent', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child 1'}, parentId: '1'},
                    {id: '1-2', data: {name: 'Child 2'}, parentId: '1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1', '1-2']);
            });

            expect(result.current.state.nodes.get('1')?.childIds).toEqual(['1-1', '1-2']);
        });

        it('appendChildren appends to existing children', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child 1'}, parentId: '1'},
                    {id: '1-2', data: {name: 'Child 2'}, parentId: '1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1']);
            });

            act(() => {
                result.current.appendChildren('1', ['1-2']);
            });

            expect(result.current.state.nodes.get('1')?.childIds).toEqual(['1-1', '1-2']);
        });
    });

    describe('expand/collapse', () => {
        it('expand adds node to expandedIds', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}, hasChildren: true});
                result.current.setRootIds(['1']);
            });

            act(() => {
                result.current.expand('1');
            });

            expect(result.current.isExpanded('1')).toBe(true);
        });

        it('collapse removes node from expandedIds', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}, hasChildren: true});
                result.current.setRootIds(['1']);
                result.current.expand('1');
            });

            act(() => {
                result.current.collapse('1');
            });

            expect(result.current.isExpanded('1')).toBe(false);
        });

        it('toggle switches expanded state', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}, hasChildren: true});
                result.current.setRootIds(['1']);
            });

            expect(result.current.isExpanded('1')).toBe(false);

            act(() => {
                result.current.toggle('1');
            });

            expect(result.current.isExpanded('1')).toBe(true);

            act(() => {
                result.current.toggle('1');
            });

            expect(result.current.isExpanded('1')).toBe(false);
        });

        it('expandAll expands all nodes with children', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}, hasChildren: true},
                    {id: '2', data: {name: 'Node 2'}, hasChildren: true},
                    {id: '3', data: {name: 'Node 3'}, hasChildren: false},
                ]);
                result.current.setRootIds(['1', '2', '3']);
            });

            act(() => {
                result.current.expandAll();
            });

            expect(result.current.isExpanded('1')).toBe(true);
            expect(result.current.isExpanded('2')).toBe(true);
            expect(result.current.isExpanded('3')).toBe(false);
        });

        it('collapseAll collapses all nodes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}, hasChildren: true},
                    {id: '2', data: {name: 'Node 2'}, hasChildren: true},
                ]);
                result.current.setRootIds(['1', '2']);
                result.current.expandAll();
            });

            expect(result.current.isExpanded('1')).toBe(true);
            expect(result.current.isExpanded('2')).toBe(true);

            act(() => {
                result.current.collapseAll();
            });

            expect(result.current.isExpanded('1')).toBe(false);
            expect(result.current.isExpanded('2')).toBe(false);
        });

        it('expandToNode expands all ancestors', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Level 0'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Level 1'}, parentId: '1', hasChildren: true},
                    {id: '1-1-1', data: {name: 'Level 2'}, parentId: '1-1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1']);
                result.current.setChildren('1-1', ['1-1-1']);
            });

            act(() => {
                result.current.expandToNode('1-1-1');
            });

            expect(result.current.isExpanded('1')).toBe(true);
            expect(result.current.isExpanded('1-1')).toBe(true);
        });
    });

    describe('loading state', () => {
        it('setLoading sets loading state for a node', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
                result.current.setRootIds(['1']);
            });

            expect(result.current.isLoading('1')).toBe(false);

            act(() => {
                result.current.setLoading('1', true);
            });

            expect(result.current.isLoading('1')).toBe(true);

            act(() => {
                result.current.setLoading('1', false);
            });

            expect(result.current.isLoading('1')).toBe(false);
        });

        it('setLoadingData sets loading data state for multiple nodes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}},
                    {id: '2', data: {name: 'Node 2'}},
                ]);
                result.current.setRootIds(['1', '2']);
            });

            act(() => {
                result.current.setLoadingData(['1', '2'], true);
            });

            expect(result.current.isLoadingData('1')).toBe(true);
            expect(result.current.isLoadingData('2')).toBe(true);

            act(() => {
                result.current.setLoadingData(['1'], false);
            });

            expect(result.current.isLoadingData('1')).toBe(false);
            expect(result.current.isLoadingData('2')).toBe(true);
        });
    });

    describe('selectors', () => {
        it('getNode returns node by id', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
            });

            expect(result.current.getNode('1')?.data).toEqual({name: 'Test'});
            expect(result.current.getNode('nonexistent')).toBeUndefined();
        });

        it('hasNode checks if node exists', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            expect(result.current.hasNode('1')).toBe(false);

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
            });

            expect(result.current.hasNode('1')).toBe(true);
        });

        it('getAncestorIds returns ancestor chain', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Level 0'}},
                    {id: '1-1', data: {name: 'Level 1'}, parentId: '1'},
                    {id: '1-1-1', data: {name: 'Level 2'}, parentId: '1-1'},
                ]);
            });

            expect(result.current.getAncestorIds('1-1-1')).toEqual(['1-1', '1']);
        });

        it('getDescendantIds returns all descendants', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Root'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child 1'}, parentId: '1', hasChildren: true},
                    {id: '1-2', data: {name: 'Child 2'}, parentId: '1'},
                    {id: '1-1-1', data: {name: 'Grandchild'}, parentId: '1-1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1', '1-2']);
                result.current.setChildren('1-1', ['1-1-1']);
            });

            const descendants = result.current.getDescendantIds('1');
            expect(descendants).toContain('1-1');
            expect(descendants).toContain('1-2');
            expect(descendants).toContain('1-1-1');
        });

        it('getSiblingIds returns siblings', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Sibling 1'}, parentId: '1'},
                    {id: '1-2', data: {name: 'Sibling 2'}, parentId: '1'},
                    {id: '1-3', data: {name: 'Sibling 3'}, parentId: '1'},
                ]);
                result.current.setChildren('1', ['1-1', '1-2', '1-3']);
            });

            expect(result.current.getSiblingIds('1-2')).toEqual(['1-1', '1-3']);
        });

        it('getNodeLevel returns correct depth (1-based)', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Level 1'}},
                    {id: '1-1', data: {name: 'Level 2'}, parentId: '1'},
                    {id: '1-1-1', data: {name: 'Level 3'}, parentId: '1-1'},
                ]);
            });

            expect(result.current.getNodeLevel('1')).toBe(1);
            expect(result.current.getNodeLevel('1-1')).toBe(2);
            expect(result.current.getNodeLevel('1-1-1')).toBe(3);
        });

        it('getParent returns parent node', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}},
                    {id: '1-1', data: {name: 'Child'}, parentId: '1'},
                ]);
            });

            expect(result.current.getParent('1-1')?.data).toEqual({name: 'Parent'});
            expect(result.current.getParent('1')).toBeUndefined();
        });

        it('getChildren returns child nodes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child 1'}, parentId: '1'},
                    {id: '1-2', data: {name: 'Child 2'}, parentId: '1'},
                ]);
                result.current.setChildren('1', ['1-1', '1-2']);
            });

            const children = result.current.getChildren('1');
            expect(children.length).toBe(2);
            expect(children.map(c => c.data?.name)).toEqual(['Child 1', 'Child 2']);
        });

        it('getRootNodes returns root-level nodes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Root 1'}},
                    {id: '2', data: {name: 'Root 2'}},
                    {id: '1-1', data: {name: 'Child'}, parentId: '1'},
                ]);
                result.current.setRootIds(['1', '2']);
            });

            const roots = result.current.getRootNodes();
            expect(roots.length).toBe(2);
            expect(roots.map(r => r.id)).toEqual(['1', '2']);
        });

        it('getPathToNode returns path from root', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Level 0'}},
                    {id: '1-1', data: {name: 'Level 1'}, parentId: '1'},
                    {id: '1-1-1', data: {name: 'Level 2'}, parentId: '1-1'},
                ]);
            });

            expect(result.current.getPathToNode('1-1-1')).toEqual(['1', '1-1', '1-1-1']);
        });

        it('needsChildrenLoad returns true for unexpanded nodes with children', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}, hasChildren: true},
                ]);
                result.current.setRootIds(['1']);
            });

            expect(result.current.needsChildrenLoad('1')).toBe(true);

            act(() => {
                result.current.setChildren('1', []); // Children loaded (empty)
            });

            expect(result.current.needsChildrenLoad('1')).toBe(false);
        });

        it('areAncestorsExpanded checks if all ancestors are expanded', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Level 0'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Level 1'}, parentId: '1', hasChildren: true},
                    {id: '1-1-1', data: {name: 'Level 2'}, parentId: '1-1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1']);
                result.current.setChildren('1-1', ['1-1-1']);
            });

            expect(result.current.areAncestorsExpanded('1-1-1')).toBe(false);

            act(() => {
                result.current.expand('1');
            });

            expect(result.current.areAncestorsExpanded('1-1-1')).toBe(false);

            act(() => {
                result.current.expand('1-1');
            });

            expect(result.current.areAncestorsExpanded('1-1-1')).toBe(true);
        });
    });

    describe('moveNode', () => {
        it('moves node to new parent', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent 1'}, hasChildren: true},
                    {id: '2', data: {name: 'Parent 2'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child'}, parentId: '1'},
                ]);
                result.current.setRootIds(['1', '2']);
                result.current.setChildren('1', ['1-1']);
            });

            act(() => {
                result.current.moveNode('1-1', '2');
            });

            expect(result.current.getNode('1-1')?.parentId).toBe('2');
            expect(result.current.getNode('1')?.childIds).not.toContain('1-1');
            expect(result.current.getNode('2')?.childIds).toContain('1-1');
        });

        it('moves node to root', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Parent'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child'}, parentId: '1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1']);
            });

            act(() => {
                result.current.moveNode('1-1', null);
            });

            expect(result.current.getNode('1-1')?.parentId).toBeNull();
            expect(result.current.state.rootIds).toContain('1-1');
        });
    });

    describe('clear', () => {
        it('resets state to empty', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}},
                    {id: '2', data: {name: 'Node 2'}},
                ]);
                result.current.setRootIds(['1', '2']);
                result.current.expand('1');
            });

            expect(result.current.state.nodes.size).toBe(2);

            act(() => {
                result.current.clear();
            });

            expect(result.current.state.nodes.size).toBe(0);
            expect(result.current.state.rootIds).toEqual([]);
            expect(result.current.state.expandedIds.size).toBe(0);
        });
    });

    describe('flatNodes computation', () => {
        it('updates flatNodes when state changes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            expect(result.current.flatNodes).toEqual([]);

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Node 1'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Child'}, parentId: '1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1']);
            });

            expect(result.current.flatNodes.length).toBe(1); // Only root visible

            act(() => {
                result.current.expand('1');
            });

            expect(result.current.flatNodes.length).toBe(2); // Root + child visible
        });

        it('includes correct level in flatNodes (1-based)', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNodes([
                    {id: '1', data: {name: 'Level 1'}, hasChildren: true},
                    {id: '1-1', data: {name: 'Level 2'}, parentId: '1', hasChildren: true},
                    {id: '1-1-1', data: {name: 'Level 3'}, parentId: '1-1'},
                ]);
                result.current.setRootIds(['1']);
                result.current.setChildren('1', ['1-1']);
                result.current.setChildren('1-1', ['1-1-1']);
                result.current.expandAll();
            });

            expect(result.current.flatNodes[0].level).toBe(1);
            expect(result.current.flatNodes[1].level).toBe(2);
            expect(result.current.flatNodes[2].level).toBe(3);
        });
    });

    describe('state stability', () => {
        it('multiple instances maintain separate state', () => {
            const {result: result1} = renderHook(() => useTreeStore<TestData>());
            const {result: result2} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result1.current.setNode({id: '1', data: {name: 'Hook 1'}});
            });

            act(() => {
                result2.current.setNode({id: '2', data: {name: 'Hook 2'}});
            });

            expect(result1.current.state.nodes.size).toBe(1);
            expect(result1.current.hasNode('1')).toBe(true);
            expect(result1.current.hasNode('2')).toBe(false);

            expect(result2.current.state.nodes.size).toBe(1);
            expect(result2.current.hasNode('1')).toBe(false);
            expect(result2.current.hasNode('2')).toBe(true);
        });

        it('selectors update after state changes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}, hasChildren: true});
                result.current.setRootIds(['1']);
            });

            const initialExpanded = result.current.isExpanded('1');
            expect(initialExpanded).toBe(false);

            act(() => {
                result.current.expand('1');
            });

            // Selector should now return updated value
            expect(result.current.isExpanded('1')).toBe(true);
        });
    });

    describe('reference stability', () => {
        it('returns stable action references across renders', () => {
            const {result, rerender} = renderHook(() => useTreeStore<TestData>());

            const firstSetNode = result.current.setNode;
            const firstSetNodes = result.current.setNodes;
            const firstSetLoading = result.current.setLoading;
            const firstClear = result.current.clear;

            rerender();

            expect(result.current.setNode).toBe(firstSetNode);
            expect(result.current.setNodes).toBe(firstSetNodes);
            expect(result.current.setLoading).toBe(firstSetLoading);
            expect(result.current.clear).toBe(firstClear);
        });

        it('returns stable selector references across renders', () => {
            const {result, rerender} = renderHook(() => useTreeStore<TestData>());

            const firstGetNode = result.current.getNode;
            const firstIsLoading = result.current.isLoading;
            const firstHasNode = result.current.hasNode;

            rerender();

            expect(result.current.getNode).toBe(firstGetNode);
            expect(result.current.isLoading).toBe(firstIsLoading);
            expect(result.current.hasNode).toBe(firstHasNode);
        });

        it('returns stable action references after state changes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            const firstSetNode = result.current.setNode;
            const firstSetLoading = result.current.setLoading;

            // Modify state
            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
                result.current.setRootIds(['1']);
            });

            // Actions should still be the same reference
            expect(result.current.setNode).toBe(firstSetNode);
            expect(result.current.setLoading).toBe(firstSetLoading);
        });

        it('returns stable selector references after state changes', () => {
            const {result} = renderHook(() => useTreeStore<TestData>());

            const firstGetNode = result.current.getNode;
            const firstIsLoading = result.current.isLoading;

            // Modify state
            act(() => {
                result.current.setNode({id: '1', data: {name: 'Test'}});
                result.current.setRootIds(['1']);
            });

            // Selectors should still be the same reference
            expect(result.current.getNode).toBe(firstGetNode);
            expect(result.current.isLoading).toBe(firstIsLoading);
        });
    });
});
