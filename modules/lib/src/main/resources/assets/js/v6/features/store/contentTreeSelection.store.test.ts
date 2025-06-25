import {ContentTypeName} from '@enonic/lib-admin-ui/schema/content/ContentTypeName';
import {beforeEach, describe, expect, it} from 'vitest';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {PublishStatus} from '../../../app/publish/PublishStatus';
import {setFilterActive} from './active-tree.store';
import {clearContentCache, setContent} from './content.store';
import {
    $activeId,
    $currentIds,
    $currentItem,
    $currentItems,
    $isAllLoadedSelected,
    $isAllSelected,
    $isNoneSelected,
    $loadedSelectionCount,
    $selectAllMode,
    $selectedItems,
    $selection,
    $selectionCount,
    clearSelection,
    getCurrentItems,
    hasSelectedItems,
    isSelected,
    resetSelection,
    selectAll,
    setActive,
    setSelection,
    toggleSelection,
} from './contentTreeSelection.store';
import {addFilterNodes, resetFilterTree, setFilterRootIds} from './filter-tree.store';
import {addTreeNodes, collapseNode, expandNode, resetTree, setTreeRootIds} from './tree-list.store';
import type {ContentTreeNodeData} from './tree/types';

// Mock tree node data - minimal valid structure for testing
function createMockNodeData(id: string): ContentTreeNodeData {
    return {
        id,
        displayName: `Node ${id}`,
        name: `node-${id}`,
        publishStatus: PublishStatus.ONLINE,
        workflowStatus: null,
        contentType: new ContentTypeName('base:folder'),
        iconUrl: null,
    };
}

// Mock content
function createMockContent(id: string, name?: string): ContentSummaryAndCompareStatus {
    return {
        getId: () => id,
        getDisplayName: () => name ?? `Content ${id}`,
    } as ContentSummaryAndCompareStatus;
}

describe('contentTreeSelection.store', () => {
    beforeEach(() => {
        // Reset all state
        $selection.set(new Set());
        $activeId.set(null);
        $selectAllMode.set(false);
        clearContentCache();
        resetTree();
        setFilterActive(false);
    });

    describe('$selection', () => {
        it('defaults to empty set', () => {
            expect($selection.get().size).toBe(0);
        });
    });

    describe('$activeId', () => {
        it('defaults to null', () => {
            expect($activeId.get()).toBeNull();
        });
    });

    describe('$selectAllMode', () => {
        it('defaults to false', () => {
            expect($selectAllMode.get()).toBe(false);
        });
    });

    describe('setActive', () => {
        it('sets the active ID', () => {
            setActive('1');
            expect($activeId.get()).toBe('1');
        });

        it('can be set to null', () => {
            setActive('1');
            setActive(null);
            expect($activeId.get()).toBeNull();
        });
    });

    describe('toggleSelection', () => {
        it('adds ID when not selected', () => {
            toggleSelection('1');
            expect($selection.get().has('1')).toBe(true);
        });

        it('removes ID when already selected', () => {
            toggleSelection('1');
            expect($selection.get().has('1')).toBe(true);

            toggleSelection('1');
            expect($selection.get().has('1')).toBe(false);
        });

        it('works with multiple IDs', () => {
            toggleSelection('1');
            toggleSelection('2');

            expect($selection.get().has('1')).toBe(true);
            expect($selection.get().has('2')).toBe(true);
            expect($selection.get().size).toBe(2);
        });
    });

    describe('setSelection', () => {
        it('sets selection from array', () => {
            setSelection(['1', '2', '3']);
            expect($selection.get().size).toBe(3);
            expect($selection.get().has('1')).toBe(true);
            expect($selection.get().has('2')).toBe(true);
            expect($selection.get().has('3')).toBe(true);
        });

        it('sets selection from Set', () => {
            setSelection(new Set(['1', '2']));
            expect($selection.get().size).toBe(2);
        });

        it('replaces previous selection', () => {
            setSelection(['1', '2']);
            setSelection(['3']);

            expect($selection.get().size).toBe(1);
            expect($selection.get().has('3')).toBe(true);
            expect($selection.get().has('1')).toBe(false);
        });
    });

    describe('clearSelection', () => {
        it('clears all selected IDs', () => {
            setSelection(['1', '2', '3']);
            clearSelection();

            expect($selection.get().size).toBe(0);
        });

        it('disables selectAllMode', () => {
            $selectAllMode.set(true);
            clearSelection();

            expect($selectAllMode.get()).toBe(false);
        });
    });

    describe('isSelected', () => {
        it('returns true for selected ID', () => {
            setSelection(['1']);
            expect(isSelected('1')).toBe(true);
        });

        it('returns false for unselected ID', () => {
            expect(isSelected('1')).toBe(false);
        });
    });

    describe('hasSelectedItems', () => {
        it('returns false when nothing selected', () => {
            expect(hasSelectedItems()).toBe(false);
        });

        it('returns true when items are selected', () => {
            setSelection(['1']);
            expect(hasSelectedItems()).toBe(true);
        });
    });

    describe('resetSelection', () => {
        it('is an alias for clearSelection', () => {
            setSelection(['1', '2']);
            $selectAllMode.set(true);

            resetSelection();

            expect($selection.get().size).toBe(0);
            expect($selectAllMode.get()).toBe(false);
        });
    });

    describe('$selectionCount', () => {
        it('returns 0 when nothing selected', () => {
            expect($selectionCount.get()).toBe(0);
        });

        it('returns count of selected items', () => {
            setSelection(['1', '2', '3']);
            expect($selectionCount.get()).toBe(3);
        });
    });

    describe('$isNoneSelected', () => {
        it('returns true when nothing selected', () => {
            expect($isNoneSelected.get()).toBe(true);
        });

        it('returns false when items selected', () => {
            setSelection(['1']);
            expect($isNoneSelected.get()).toBe(false);
        });
    });

    describe('$selectedItems', () => {
        it('returns empty array when nothing selected', () => {
            expect($selectedItems.get()).toEqual([]);
        });

        it('returns content objects for selected IDs in cache', () => {
            const content1 = createMockContent('1');
            const content2 = createMockContent('2');

            setContent(content1);
            setContent(content2);
            setSelection(['1', '2']);

            const items = $selectedItems.get();
            expect(items.length).toBe(2);
            expect(items).toContain(content1);
            expect(items).toContain(content2);
        });

        it('filters out IDs not in cache', () => {
            const content1 = createMockContent('1');
            setContent(content1);
            setSelection(['1', '2', '3']); // Only '1' is in cache

            const items = $selectedItems.get();
            expect(items.length).toBe(1);
            expect(items[0]).toBe(content1);
        });
    });

    describe('$isAllSelected', () => {
        beforeEach(() => {
            // Add some nodes to tree
            addTreeNodes([
                {id: '1', data: createMockNodeData('1')},
                {id: '2', data: createMockNodeData('2')},
                {id: '3', data: createMockNodeData('3')},
            ]);
            setTreeRootIds(['1', '2', '3']);
        });

        it('returns false when nothing selected', () => {
            expect($isAllSelected.get()).toBe(false);
        });

        it('returns false when partially selected', () => {
            setSelection(['1', '2']);
            expect($isAllSelected.get()).toBe(false);
        });

        it('returns true when all nodes selected', () => {
            setSelection(['1', '2', '3']);
            expect($isAllSelected.get()).toBe(true);
        });

        it('returns false when tree is empty', () => {
            resetTree();
            setSelection(['1']);
            expect($isAllSelected.get()).toBe(false);
        });
    });

    describe('$currentIds', () => {
        it('returns empty array when nothing selected and no active', () => {
            expect($currentIds.get()).toEqual([]);
        });

        it('returns active ID when nothing selected', () => {
            setActive('1');
            expect($currentIds.get()).toEqual(['1']);
        });

        it('returns selection IDs when items selected', () => {
            setSelection(['1', '2']);
            setActive('3'); // Should be ignored

            const ids = $currentIds.get();
            expect(ids.length).toBe(2);
            expect(ids).toContain('1');
            expect(ids).toContain('2');
        });

        it('prioritizes selection over active', () => {
            setActive('active');
            setSelection(['selected']);

            expect($currentIds.get()).toEqual(['selected']);
        });
    });

    describe('$currentItems', () => {
        it('returns empty array when nothing selected and no active', () => {
            expect($currentItems.get()).toEqual([]);
        });

        it('returns active item when nothing selected', () => {
            const content = createMockContent('1');
            setContent(content);
            setActive('1');

            expect($currentItems.get()).toEqual([content]);
        });

        it('returns selected items when items selected', () => {
            const content1 = createMockContent('1');
            const content2 = createMockContent('2');
            setContent(content1);
            setContent(content2);
            setSelection(['1', '2']);

            const items = $currentItems.get();
            expect(items.length).toBe(2);
        });
    });

    describe('$currentItem', () => {
        it('returns null when nothing selected and no active', () => {
            expect($currentItem.get()).toBeNull();
        });

        it('returns active item when nothing selected', () => {
            const content = createMockContent('1');
            setContent(content);
            setActive('1');

            expect($currentItem.get()).toBe(content);
        });

        it('returns last selected item when items selected', () => {
            const content1 = createMockContent('1');
            const content2 = createMockContent('2');
            setContent(content1);
            setContent(content2);

            // Use array to ensure order
            $selection.set(new Set(['1', '2']));

            const item = $currentItem.get();
            expect(item).toBe(content2);
        });

        it('returns null when selected item not in cache', () => {
            setSelection(['nonexistent']);
            expect($currentItem.get()).toBeNull();
        });
    });

    describe('getCurrentItems', () => {
        it('returns current items array', () => {
            const content = createMockContent('1');
            setContent(content);
            setActive('1');

            expect(getCurrentItems()).toEqual([content]);
        });
    });

    describe('selectAll', () => {
        beforeEach(() => {
            // Set up tree with nodes
            addTreeNodes([
                {id: '1', data: createMockNodeData('1')},
                {id: '2', data: createMockNodeData('2')},
                {id: '3', data: null}, // Placeholder node
            ]);
            setTreeRootIds(['1', '2', '3']);
        });

        it('enables selectAllMode', () => {
            selectAll();
            expect($selectAllMode.get()).toBe(true);
        });

        it('selects only visible loaded nodes', () => {
            selectAll();

            // Only nodes with data should be selected
            expect($selection.get().has('1')).toBe(true);
            expect($selection.get().has('2')).toBe(true);
            expect($selection.get().has('3')).toBe(false); // Placeholder
        });
    });

    describe('$loadedSelectionCount', () => {
        beforeEach(() => {
            addTreeNodes([
                {id: '1', data: createMockNodeData('1')},
                {id: '2', data: createMockNodeData('2')},
                {id: '3', data: null}, // Placeholder
            ]);
            setTreeRootIds(['1', '2', '3']);
        });

        it('counts only visible loaded selected items', () => {
            setSelection(['1', '2', '3', '4']); // '3' is placeholder, '4' not in tree

            expect($loadedSelectionCount.get()).toBe(2);
        });
    });

    describe('$isAllLoadedSelected', () => {
        beforeEach(() => {
            addTreeNodes([
                {id: '1', data: createMockNodeData('1')},
                {id: '2', data: createMockNodeData('2')},
                {id: '3', data: null}, // Placeholder
            ]);
            setTreeRootIds(['1', '2', '3']);
        });

        it('returns false when nothing selected', () => {
            expect($isAllLoadedSelected.get()).toBe(false);
        });

        it('returns false when only some loaded items selected', () => {
            setSelection(['1']);
            expect($isAllLoadedSelected.get()).toBe(false);
        });

        it('returns true when all loaded items selected', () => {
            setSelection(['1', '2']);
            expect($isAllLoadedSelected.get()).toBe(true);
        });

        it('ignores placeholder nodes', () => {
            setSelection(['1', '2']); // Not selecting '3' (placeholder)
            expect($isAllLoadedSelected.get()).toBe(true);
        });
    });

    describe('filter mode transitions', () => {
        it('disables selectAllMode when entering filter mode', () => {
            $selectAllMode.set(true);

            setFilterActive(true);

            expect($selectAllMode.get()).toBe(false);
        });

        it('does not disable selectAllMode when filter already inactive', () => {
            $selectAllMode.set(true);

            // Setting to false when already false should not affect selectAllMode
            setFilterActive(false);

            expect($selectAllMode.get()).toBe(true);
        });

        it('preserves selection when switching modes', () => {
            setSelection(['1', '2']);

            setFilterActive(true);

            expect($selection.get().size).toBe(2);
            expect($selection.get().has('1')).toBe(true);
            expect($selection.get().has('2')).toBe(true);
        });
    });

    describe('auto-selection in selectAllMode', () => {
        it('auto-selects new loaded nodes when in selectAllMode', () => {
            // Enable select all mode
            $selectAllMode.set(true);
            $selection.set(new Set());

            // Add new node to tree
            addTreeNodes([{id: '1', data: createMockNodeData('1')}]);
            setTreeRootIds(['1']);

            // Node should be auto-selected
            expect($selection.get().has('1')).toBe(true);
        });

        it('does not auto-select when selectAllMode is off', () => {
            $selectAllMode.set(false);

            addTreeNodes([{id: '1', data: createMockNodeData('1')}]);
            setTreeRootIds(['1']);

            expect($selection.get().has('1')).toBe(false);
        });

        it('does not auto-select placeholder nodes', () => {
            $selectAllMode.set(true);

            addTreeNodes([{id: '1', data: null}]); // Placeholder
            setTreeRootIds(['1']);

            expect($selection.get().has('1')).toBe(false);
        });

        it('removes hidden nodes from selection when collapsing in selectAllMode', () => {
            // Setup: Add nodes with parent-child relationship
            addTreeNodes([
                {id: '1', data: createMockNodeData('1'), childIds: ['1-1', '1-2']},
                {id: '1-1', data: createMockNodeData('1-1'), parentId: '1'},
                {id: '1-2', data: createMockNodeData('1-2'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
            expandNode('1'); // Expand to show children

            // Select all (should select 1, 1-1, 1-2)
            selectAll();
            expect($selection.get().size).toBe(3);
            expect($selection.get().has('1')).toBe(true);
            expect($selection.get().has('1-1')).toBe(true);
            expect($selection.get().has('1-2')).toBe(true);

            // Collapse parent (children should be deselected)
            collapseNode('1');

            // Only parent should remain selected
            expect($selection.get().size).toBe(1);
            expect($selection.get().has('1')).toBe(true);
            expect($selection.get().has('1-1')).toBe(false);
            expect($selection.get().has('1-2')).toBe(false);
        });

        it('re-selects children when expanding after collapse in selectAllMode', () => {
            // Setup: Add nodes with parent-child relationship
            addTreeNodes([
                {id: '1', data: createMockNodeData('1'), childIds: ['1-1']},
                {id: '1-1', data: createMockNodeData('1-1'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
            expandNode('1');

            // Select all
            selectAll();
            expect($selection.get().size).toBe(2);

            // Collapse - child should be deselected
            collapseNode('1');
            expect($selection.get().size).toBe(1);

            // Expand again - child should be re-selected
            expandNode('1');
            expect($selection.get().size).toBe(2);
            expect($selection.get().has('1-1')).toBe(true);
        });
    });

    describe('manual selection (without selectAllMode)', () => {
        it('maintains selection through multiple collapse-expand cycles', () => {
            // Setup: Add parent with child
            addTreeNodes([
                {id: '1', data: createMockNodeData('1'), childIds: ['1-1']},
                {id: '1-1', data: createMockNodeData('1-1'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
            expandNode('1');

            // Manually select child (NOT using selectAll)
            setSelection(['1-1']);
            expect($selection.get().has('1-1')).toBe(true);
            expect($selectAllMode.get()).toBe(false);

            // First cycle - should maintain selection
            collapseNode('1');
            expandNode('1');
            expect($selection.get().has('1-1')).toBe(true);

            // Second cycle - should still maintain selection
            collapseNode('1');
            expandNode('1');
            expect($selection.get().has('1-1')).toBe(true);

            // Third cycle for good measure
            collapseNode('1');
            expandNode('1');
            expect($selection.get().has('1-1')).toBe(true);
        });

        it('does not affect selection when collapsing parent of selected child', () => {
            addTreeNodes([
                {id: '1', data: createMockNodeData('1'), childIds: ['1-1', '1-2']},
                {id: '1-1', data: createMockNodeData('1-1'), parentId: '1'},
                {id: '1-2', data: createMockNodeData('1-2'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
            expandNode('1');

            // Select both children manually
            setSelection(['1-1', '1-2']);
            expect($selection.get().size).toBe(2);

            // Collapse parent - store should keep selection (component handles visibility)
            collapseNode('1');
            expect($selection.get().size).toBe(2);
            expect($selection.get().has('1-1')).toBe(true);
            expect($selection.get().has('1-2')).toBe(true);
        });
    });

    describe('selectAllMode dynamic management', () => {
        beforeEach(() => {
            // Setup tree with parent and children
            addTreeNodes([
                {id: '1', data: createMockNodeData('1'), childIds: ['1-1', '1-2']},
                {id: '1-1', data: createMockNodeData('1-1'), parentId: '1'},
                {id: '1-2', data: createMockNodeData('1-2'), parentId: '1'},
                {id: '2', data: createMockNodeData('2'), childIds: ['2-1']},
                {id: '2-1', data: createMockNodeData('2-1'), parentId: '2'},
            ]);
            setTreeRootIds(['1', '2']);
            expandNode('1');
        });

        it('disables selectAllMode when visible item is unchecked after selectAll', () => {
            selectAll();
            expect($selectAllMode.get()).toBe(true);

            // Uncheck one item (simulating user unchecking checkbox)
            const current = $selection.get();
            const next = new Set(current);
            next.delete('1-1');
            setSelection(next);

            expect($selectAllMode.get()).toBe(false);
        });

        it('does not auto-select expanded children after user unchecked items', () => {
            selectAll();
            expect($selectAllMode.get()).toBe(true);

            // Uncheck one item
            const current = $selection.get();
            const next = new Set(current);
            next.delete('1-1');
            setSelection(next);
            expect($selectAllMode.get()).toBe(false);

            // Expand another node - children should NOT be auto-selected
            expandNode('2');
            expect($selection.get().has('2-1')).toBe(false);
        });

        it('enables selectAllMode when all items are selected via setSelection', () => {
            expect($selectAllMode.get()).toBe(false);

            // Select all items manually (simulating Cmd+A behavior)
            setSelection(['1', '1-1', '1-2', '2']);

            expect($selectAllMode.get()).toBe(true);
        });

        it('auto-selects expanded children when all items were selected via setSelection', () => {
            // Select all visible items manually
            setSelection(['1', '1-1', '1-2', '2']);
            expect($selectAllMode.get()).toBe(true);

            // Expand another node - children SHOULD be auto-selected
            expandNode('2');
            expect($selection.get().has('2-1')).toBe(true);
        });

        it('keeps selectAllMode true when items are removed due to collapse', () => {
            selectAll();
            expect($selectAllMode.get()).toBe(true);

            // Collapse removes items from selection (they're hidden, not unchecked)
            collapseNode('1');

            // selectAllMode should stay true
            expect($selectAllMode.get()).toBe(true);

            // And when expanding again, children should be re-selected
            expandNode('1');
            expect($selection.get().has('1-1')).toBe(true);
            expect($selection.get().has('1-2')).toBe(true);
        });

        it('disables selectAllMode when user unchecks all items one by one', () => {
            selectAll();
            expect($selectAllMode.get()).toBe(true);

            // Uncheck all items
            clearSelection();

            expect($selectAllMode.get()).toBe(false);
        });

        it('does not enable selectAllMode when selecting some but not all items', () => {
            expect($selectAllMode.get()).toBe(false);

            // Select only some items
            setSelection(['1', '1-1']);

            expect($selectAllMode.get()).toBe(false);
        });
    });

    describe('selectAllMode with filter/main view switching', () => {
        beforeEach(() => {
            // Setup main tree
            addTreeNodes([
                {id: '1', data: createMockNodeData('1')},
                {id: '2', data: createMockNodeData('2')},
            ]);
            setTreeRootIds(['1', '2']);
        });

        it('disables selectAllMode when entering filter mode', () => {
            selectAll();
            expect($selectAllMode.get()).toBe(true);

            setFilterActive(true);
            expect($selectAllMode.get()).toBe(false);
        });

        it('disables selectAllMode when leaving filter mode', () => {
            setFilterActive(true);
            // Setup filter tree nodes
            addFilterNodes([
                {id: 'f1', data: createMockNodeData('f1')},
                {id: 'f2', data: createMockNodeData('f2')},
            ]);
            setFilterRootIds(['f1', 'f2']);

            selectAll(); // Enable in filter mode
            expect($selectAllMode.get()).toBe(true);

            setFilterActive(false); // Switch to main
            expect($selectAllMode.get()).toBe(false);
        });

        it('does not auto-select main tree when leaving filter mode with selectAll enabled', () => {
            setFilterActive(true);
            // Setup filter tree nodes
            addFilterNodes([
                {id: 'f1', data: createMockNodeData('f1')},
            ]);
            setFilterRootIds(['f1']);

            selectAll();
            expect($selection.get().has('f1')).toBe(true);
            expect($selection.get().has('1')).toBe(false); // Main tree item not selected

            setFilterActive(false);

            // selectAllMode was disabled, so main tree nodes should NOT be auto-selected
            expect($selectAllMode.get()).toBe(false);
            // f1 should still be selected (selection IDs preserved)
            expect($selection.get().has('f1')).toBe(true);
        });

        it('preserves individual selections when switching views', () => {
            // Select item in main tree
            setSelection(['1']);

            setFilterActive(true);
            // Item should still be selected
            expect($selection.get().has('1')).toBe(true);

            setFilterActive(false);
            // Item should still be selected in main tree
            expect($selection.get().has('1')).toBe(true);
        });

        it('disables selectAllMode when filter results change', () => {
            setFilterActive(true);
            // Setup initial filter results
            addFilterNodes([
                {id: 'f1', data: createMockNodeData('f1')},
            ]);
            setFilterRootIds(['f1']);

            selectAll();
            expect($selectAllMode.get()).toBe(true);

            // Simulate new filter query (reset and set new root IDs)
            resetFilterTree();
            addFilterNodes([
                {id: 'f2', data: createMockNodeData('f2')},
            ]);
            setFilterRootIds(['f2']);

            // selectAllMode should be disabled due to filter change
            expect($selectAllMode.get()).toBe(false);
        });

        it('preserves selection when filter results change without selectAllMode', () => {
            setFilterActive(true);
            // Setup initial filter results
            addFilterNodes([
                {id: 'shared', data: createMockNodeData('shared')},
                {id: 'f1', data: createMockNodeData('f1')},
            ]);
            setFilterRootIds(['shared', 'f1']);

            // Manually select (not selectAll)
            setSelection(['shared']);
            expect($selectAllMode.get()).toBe(false);

            // Simulate new filter query with shared item still present
            resetFilterTree();
            addFilterNodes([
                {id: 'shared', data: createMockNodeData('shared')},
                {id: 'f2', data: createMockNodeData('f2')},
            ]);
            setFilterRootIds(['shared', 'f2']);

            // Selection should be preserved
            expect($selection.get().has('shared')).toBe(true);
            expect($selectAllMode.get()).toBe(false);
        });
    });
});
