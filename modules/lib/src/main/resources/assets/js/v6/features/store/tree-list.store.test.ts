import {describe, it, expect, beforeEach} from 'vitest';
import {PublishStatus} from '../../../app/publish/PublishStatus';
import type {ContentSummaryAndCompareStatus} from '../../../app/content/ContentSummaryAndCompareStatus';
import {
    $treeState,
    $flatNodes,
    $mergedFlatNodes,
    addTreeNode,
    addTreeNodes,
    removeTreeNode,
    removeTreeNodes,
    setTreeChildren,
    appendTreeChildren,
    setTreeRootIds,
    expandNode,
    collapseNode,
    toggleNode,
    expandAllNodes,
    collapseAllNodes,
    expandPathToNode,
    setNodeLoading,
    resetTree,
    setNodeTotalChildren,
    getTreeNode,
    hasTreeNode,
    isNodeExpanded,
    isNodeLoading,
    nodeNeedsChildrenLoad,
    nodeHasMoreChildren,
    getTreeDescendantIds,
    type ContentTreeNodeData,
} from './tree-list.store';
import {clearContentCache, setContent, setContents} from './content.store';
import {addUpload, clearUploads} from './uploads.store';
import {emitContentCreated, emitContentDeleted, emitContentDuplicated, emitContentArchived} from './socket.store';
import type {ContentServerChangeItem} from '../../../app/event/ContentServerChangeItem';

// Mock ContentTreeNodeData
function createNodeData(id: string, displayName?: string): ContentTreeNodeData {
    return {
        id,
        displayName: displayName ?? `Node ${id}`,
        name: id,
        publishStatus: PublishStatus.ONLINE,
        workflowStatus: null,
        contentType: null as unknown as ContentTreeNodeData['contentType'],
        iconUrl: null,
    };
}

// Mock ContentSummaryAndCompareStatus for cache
function createMockContent(id: string, displayName?: string): ContentSummaryAndCompareStatus {
    const mockName = {
        isUnnamed: () => false,
        toString: () => id,
    };

    const mockPath = {
        hasParentContent: () => false,
        getParentPath: () => null,
        isRoot: () => true,
        equals: () => false,
        toString: () => `/${id}`,
    };

    const mockType = {
        getLocalName: () => 'page',
    };

    return {
        getId: () => id,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getType: () => mockType,
        getPublishStatus: () => PublishStatus.ONLINE,
        hasChildren: () => false,
        hasContentSummary: () => true,
        hasUploadItem: () => false,
        getPath: () => mockPath,
        getContentSummary: () => ({
            getIconUrl: () => null,
            getDisplayName: () => displayName ?? `Content ${id}`,
            getName: () => mockName,
            getType: () => mockType,
            isValid: () => true,
            isReady: () => false,
            isInProgress: () => false,
        }),
    } as unknown as ContentSummaryAndCompareStatus;
}

// Mock ContentSummaryAndCompareStatus with parent path for socket events
function createMockContentWithParent(
    id: string,
    parentPath: string,
    hasChildrenValue = false,
    displayName?: string
): ContentSummaryAndCompareStatus {
    const mockName = {
        isUnnamed: () => false,
        toString: () => id,
    };

    const pathStr = parentPath === '/' ? `/${id}` : `${parentPath}/${id}`;

    const mockPath = {
        hasParentContent: () => parentPath !== '/',
        getParentPath: () =>
            parentPath === '/'
                ? {
                      toString: () => '/',
                      isRoot: () => true,
                      equals: (other: {toString: () => string}) => other.toString() === '/',
                  }
                : {
                      toString: () => parentPath,
                      isRoot: () => false,
                      equals: (other: {toString: () => string}) => other.toString() === parentPath,
                  },
        isRoot: () => false,
        equals: (other: {toString: () => string}) => pathStr === other.toString(),
        toString: () => pathStr,
    };

    const mockType = {
        getLocalName: () => 'page',
    };

    return {
        getId: () => id,
        getDisplayName: () => displayName ?? `Content ${id}`,
        getType: () => mockType,
        getPublishStatus: () => PublishStatus.ONLINE,
        hasChildren: () => hasChildrenValue,
        hasContentSummary: () => true,
        hasUploadItem: () => false,
        getPath: () => mockPath,
        getContentSummary: () => ({
            getIconUrl: () => null,
            getDisplayName: () => displayName ?? `Content ${id}`,
            getName: () => mockName,
            getType: () => mockType,
            isValid: () => true,
            isReady: () => false,
            isInProgress: () => false,
        }),
    } as unknown as ContentSummaryAndCompareStatus;
}

// Mock ContentServerChangeItem for delete events
function createMockChangeItem(id: string): ContentServerChangeItem {
    return {
        getContentId: () => ({
            toString: () => id,
        }),
    } as unknown as ContentServerChangeItem;
}

describe('tree-list.store', () => {
    beforeEach(() => {
        resetTree();
        clearContentCache();
        clearUploads();
    });

    describe('addTreeNode', () => {
        it('adds a single node', () => {
            addTreeNode({id: '1', data: createNodeData('1')});

            expect(hasTreeNode('1')).toBe(true);
        });

        it('adds node with parent', () => {
            addTreeNode({id: '1', data: createNodeData('1'), childIds: ['1-1']});
            addTreeNode({id: '1-1', data: createNodeData('1-1'), parentId: '1'});

            const child = getTreeNode('1-1');
            expect(child?.parentId).toBe('1');
        });
    });

    describe('addTreeNodes', () => {
        it('adds multiple nodes', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1')},
                {id: '2', data: createNodeData('2')},
                {id: '3', data: createNodeData('3')},
            ]);

            expect(hasTreeNode('1')).toBe(true);
            expect(hasTreeNode('2')).toBe(true);
            expect(hasTreeNode('3')).toBe(true);
        });

        it('does nothing with empty array', () => {
            addTreeNodes([]);
            expect($treeState.get().nodes.size).toBe(0);
        });
    });

    describe('removeTreeNode', () => {
        it('removes node from tree', () => {
            addTreeNode({id: '1', data: createNodeData('1')});

            removeTreeNode('1');

            expect(hasTreeNode('1')).toBe(false);
        });

        it('removes descendants by default', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1'), childIds: ['1-1']},
                {id: '1-1', data: createNodeData('1-1'), parentId: '1'},
            ]);

            removeTreeNode('1');

            expect(hasTreeNode('1')).toBe(false);
            expect(hasTreeNode('1-1')).toBe(false);
        });
    });

    describe('removeTreeNodes', () => {
        it('removes multiple nodes', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1')},
                {id: '2', data: createNodeData('2')},
                {id: '3', data: createNodeData('3')},
            ]);

            removeTreeNodes(['1', '3']);

            expect(hasTreeNode('1')).toBe(false);
            expect(hasTreeNode('2')).toBe(true);
            expect(hasTreeNode('3')).toBe(false);
        });
    });

    describe('setTreeChildren', () => {
        it('sets children for parent node', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1')},
                {id: '1-1', data: createNodeData('1-1')},
                {id: '1-2', data: createNodeData('1-2')},
            ]);

            setTreeChildren('1', ['1-1', '1-2']);

            const parent = getTreeNode('1');
            expect(parent?.childIds).toEqual(['1-1', '1-2']);
        });

        it('sets root children with null parent', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1')},
                {id: '2', data: createNodeData('2')},
            ]);

            setTreeChildren(null, ['1', '2']);

            expect($treeState.get().rootIds).toEqual(['1', '2']);
        });
    });

    describe('appendTreeChildren', () => {
        it('appends children to existing', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1'), childIds: ['1-1']},
                {id: '1-1', data: createNodeData('1-1'), parentId: '1'},
                {id: '1-2', data: createNodeData('1-2')},
            ]);

            appendTreeChildren('1', ['1-2']);

            const parent = getTreeNode('1');
            expect(parent?.childIds).toEqual(['1-1', '1-2']);
        });
    });

    describe('expand/collapse operations', () => {
        beforeEach(() => {
            addTreeNodes([
                {id: '1', data: createNodeData('1'), hasChildren: true, childIds: ['1-1']},
                {id: '1-1', data: createNodeData('1-1'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
        });

        it('expandNode marks node as expanded', () => {
            expandNode('1');
            expect(isNodeExpanded('1')).toBe(true);
        });

        it('collapseNode marks node as collapsed', () => {
            expandNode('1');
            collapseNode('1');
            expect(isNodeExpanded('1')).toBe(false);
        });

        it('toggleNode toggles expansion state', () => {
            toggleNode('1');
            expect(isNodeExpanded('1')).toBe(true);

            toggleNode('1');
            expect(isNodeExpanded('1')).toBe(false);
        });

        it('expandAllNodes expands all nodes with children', () => {
            addTreeNode({id: '1-1-1', data: createNodeData('1-1-1'), parentId: '1-1', hasChildren: true});

            expandAllNodes();

            expect(isNodeExpanded('1')).toBe(true);
            expect(isNodeExpanded('1-1-1')).toBe(true);
        });

        it('collapseAllNodes collapses all nodes', () => {
            expandNode('1');

            collapseAllNodes();

            expect(isNodeExpanded('1')).toBe(false);
        });

        it('expandPathToNode expands ancestors', () => {
            addTreeNodes([
                {id: '1-1-1', data: createNodeData('1-1-1'), parentId: '1-1', hasChildren: true, childIds: ['1-1-1-1']},
                {id: '1-1-1-1', data: createNodeData('1-1-1-1'), parentId: '1-1-1'},
            ]);

            expandPathToNode('1-1-1-1');

            expect(isNodeExpanded('1')).toBe(true);
            expect(isNodeExpanded('1-1')).toBe(true);
            expect(isNodeExpanded('1-1-1')).toBe(true);
        });
    });

    describe('loading state', () => {
        it('setNodeLoading sets loading state', () => {
            setNodeLoading('1', true);
            expect(isNodeLoading('1')).toBe(true);

            setNodeLoading('1', false);
            expect(isNodeLoading('1')).toBe(false);
        });

        it('handles root-level loading with null', () => {
            setNodeLoading(null, true);
            expect(isNodeLoading(null)).toBe(true);
        });
    });

    describe('resetTree', () => {
        it('clears all tree state', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1')},
                {id: '2', data: createNodeData('2')},
            ]);
            expandNode('1');

            resetTree();

            expect($treeState.get().nodes.size).toBe(0);
            expect($treeState.get().rootIds).toEqual([]);
            expect($treeState.get().expandedIds.size).toBe(0);
        });
    });

    describe('setNodeTotalChildren', () => {
        it('sets totalChildren for pagination', () => {
            addTreeNode({id: '1', data: createNodeData('1')});

            setNodeTotalChildren('1', 100);

            expect(getTreeNode('1')?.totalChildren).toBe(100);
        });
    });

    describe('selectors', () => {
        describe('getTreeNode', () => {
            it('returns node by ID', () => {
                addTreeNode({id: '1', data: createNodeData('1', 'Test')});

                const node = getTreeNode('1');

                expect(node?.data?.displayName).toBe('Test');
            });

            it('returns undefined for non-existent node', () => {
                expect(getTreeNode('non-existent')).toBeUndefined();
            });
        });

        describe('nodeNeedsChildrenLoad', () => {
            it('returns true when hasChildren but no childIds', () => {
                addTreeNode({id: '1', data: createNodeData('1'), hasChildren: true});

                expect(nodeNeedsChildrenLoad('1')).toBe(true);
            });

            it('returns false when already loading', () => {
                addTreeNode({id: '1', data: createNodeData('1'), hasChildren: true});
                setNodeLoading('1', true);

                expect(nodeNeedsChildrenLoad('1')).toBe(false);
            });
        });

        describe('nodeHasMoreChildren', () => {
            it('returns true when loadedCount < totalChildren', () => {
                addTreeNode({id: '1', data: createNodeData('1'), childIds: ['1-1'], totalChildren: 10});

                expect(nodeHasMoreChildren('1')).toBe(true);
            });

            it('returns false when all loaded', () => {
                addTreeNode({id: '1', data: createNodeData('1'), childIds: ['1-1', '1-2'], totalChildren: 2});

                expect(nodeHasMoreChildren('1')).toBe(false);
            });
        });

        describe('getTreeDescendantIds', () => {
            it('returns all descendant IDs', () => {
                addTreeNodes([
                    {id: '1', data: createNodeData('1'), childIds: ['1-1', '1-2']},
                    {id: '1-1', data: createNodeData('1-1'), parentId: '1'},
                    {id: '1-2', data: createNodeData('1-2'), parentId: '1'},
                ]);

                const descendants = getTreeDescendantIds('1');

                expect(descendants.sort()).toEqual(['1-1', '1-2']);
            });
        });
    });

    describe('$flatNodes computed', () => {
        it('returns flattened tree for rendering', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1'), hasChildren: true, childIds: ['1-1']},
                {id: '1-1', data: createNodeData('1-1'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
            expandNode('1');

            const flat = $flatNodes.get();

            expect(flat).toHaveLength(2);
            expect(flat[0].id).toBe('1');
            expect(flat[0].level).toBe(1); // Level starts at 1 for VirtualizedTreeList
            expect(flat[1].id).toBe('1-1');
            expect(flat[1].level).toBe(2);
        });

        it('hides children of collapsed nodes', () => {
            addTreeNodes([
                {id: '1', data: createNodeData('1'), hasChildren: true, childIds: ['1-1']},
                {id: '1-1', data: createNodeData('1-1'), parentId: '1'},
            ]);
            setTreeRootIds(['1']);
            // Not expanded

            const flat = $flatNodes.get();

            expect(flat).toHaveLength(1);
            expect(flat[0].id).toBe('1');
        });
    });

    describe('$mergedFlatNodes computed', () => {
        it('includes content data from cache', () => {
            addTreeNodes([{id: '1', data: createNodeData('1', 'Tree Name')}]);
            setTreeRootIds(['1']);
            setContent(createMockContent('1', 'Cache Name'));

            const merged = $mergedFlatNodes.get();

            expect(merged).toHaveLength(1);
            const data = merged[0].data;
            expect(data && 'item' in data ? data.item?.getDisplayName() : undefined).toBe('Cache Name');
        });

        it('injects uploads at parent position', () => {
            addTreeNodes([{id: '1', data: createNodeData('1'), hasChildren: true}]);
            setTreeRootIds(['1']);
            expandNode('1');
            addUpload('upload-1', 'file.png', '1');

            const merged = $mergedFlatNodes.get();

            // Should have parent node and upload
            expect(merged.some((n) => n.id === 'upload-1')).toBe(true);
        });

        it('adds root uploads at the beginning', () => {
            addTreeNodes([{id: '1', data: createNodeData('1')}]);
            setTreeRootIds(['1']);
            addUpload('upload-1', 'file.png', null);

            const merged = $mergedFlatNodes.get();

            expect(merged[0].id).toBe('upload-1');
            expect(merged[1].id).toBe('1');
        });

        it('does not show child uploads when parent collapsed', () => {
            addTreeNodes([{id: '1', data: createNodeData('1'), hasChildren: true}]);
            setTreeRootIds(['1']);
            // Not expanded
            addUpload('upload-1', 'file.png', '1');

            const merged = $mergedFlatNodes.get();

            // Upload should not appear since parent is collapsed
            expect(merged.find((n) => n.id === 'upload-1')).toBeUndefined();
        });
    });

    describe('socket event handling', () => {
        describe('$contentCreated', () => {
            it('adds new content to tree when parent is loaded', () => {
                // Setup: parent node in tree with path in cache
                const parentContent = createMockContentWithParent('parent', '/');
                setContents([parentContent]);
                addTreeNode({id: 'parent', data: createNodeData('parent'), hasChildren: true, childIds: ['child1']});
                setTreeRootIds(['parent']);
                expandNode('parent');

                // Emit: child content created under parent
                const childContent = createMockContentWithParent('child', '/parent', false, 'New Child');
                emitContentCreated([childContent] as ContentSummaryAndCompareStatus[]);

                // Assert: child appears in tree
                expect(hasTreeNode('child')).toBe(true);
                const parent = getTreeNode('parent');
                expect(parent?.childIds).toContain('child');
            });

            it('does not add a new content to the tree if the parent did not have children loaded yet ', () => {
                // Setup: parent node in tree with path in cache
                const parentContent = createMockContentWithParent('parent', '/');
                setContents([parentContent]);
                addTreeNode({id: 'parent', data: createNodeData('parent'), hasChildren: true});
                setTreeRootIds(['parent']);
                expandNode('parent');

                // Emit: child content created under parent
                const childContent = createMockContentWithParent('child', '/parent', false, 'New Child');
                emitContentCreated([childContent] as ContentSummaryAndCompareStatus[]);

                // Assert: child appears in tree
                expect(!hasTreeNode('child')).toBe(true);
                const parent = getTreeNode('parent');
                expect(parent?.childIds).not.toContain('child');
            });

            it('does not add content when parent is not in tree', () => {
                // Setup: empty tree (no parent loaded)
                setTreeRootIds([]);

                // Emit: content created with non-existent parent
                const content = createMockContentWithParent('child', '/non-existent');
                emitContentCreated([content] as ContentSummaryAndCompareStatus[]);

                // Assert: content not added to tree
                expect(hasTreeNode('child')).toBe(false);
            });

            it('adds root-level content when root is loaded', () => {
                // Setup: tree with existing root items
                addTreeNode({id: '1', data: createNodeData('1')});
                setTreeRootIds(['1']);

                // Emit: root-level content created (no parent or root parent)
                const rootContent = createMockContentWithParent('new-root', '/');
                emitContentCreated([rootContent] as ContentSummaryAndCompareStatus[]);

                // Assert: new item prepended to rootIds
                const state = $treeState.get();
                expect(state.rootIds).toContain('new-root');
                expect(state.rootIds[0]).toBe('new-root'); // Prepended
            });

            it('updates parent hasChildren when first child created', () => {
                // Setup: parent with hasChildren=false
                const parentContent = createMockContentWithParent('parent', '/');
                setContents([parentContent]);
                addTreeNode({id: 'parent', data: createNodeData('parent'), hasChildren: false});
                setTreeRootIds(['parent']);

                // Verify parent starts with hasChildren=false
                expect(getTreeNode('parent')?.hasChildren).toBe(false);

                // Emit: first child created
                const childContent = createMockContentWithParent('child', '/parent');
                emitContentCreated([childContent] as ContentSummaryAndCompareStatus[]);

                // Assert: parent.hasChildren becomes true
                expect(getTreeNode('parent')?.hasChildren).toBe(true);
            });
        });

        describe('$contentDeleted', () => {
            it('removes content from tree', () => {
                // Setup: node in tree
                addTreeNode({id: '1', data: createNodeData('1')});
                setTreeRootIds(['1']);
                expect(hasTreeNode('1')).toBe(true);

                // Emit: content deleted
                emitContentDeleted([createMockChangeItem('1')]);

                // Assert: node removed
                expect(hasTreeNode('1')).toBe(false);
            });

            it('updates parent hasChildren when last child deleted', () => {
                // Setup: parent with single child, expanded
                addTreeNodes([
                    {id: 'parent', data: createNodeData('parent'), hasChildren: true, childIds: ['child']},
                    {id: 'child', data: createNodeData('child'), parentId: 'parent'},
                ]);
                setTreeRootIds(['parent']);
                expandNode('parent');

                // Emit: delete child
                emitContentDeleted([createMockChangeItem('child')]);

                // Assert: parent.hasChildren=false and collapsed
                expect(getTreeNode('parent')?.hasChildren).toBe(false);
                expect(isNodeExpanded('parent')).toBe(false);
            });

            it('does not affect parent hasChildren when siblings remain', () => {
                // Setup: parent with two children
                addTreeNodes([
                    {id: 'parent', data: createNodeData('parent'), hasChildren: true, childIds: ['child1', 'child2']},
                    {id: 'child1', data: createNodeData('child1'), parentId: 'parent'},
                    {id: 'child2', data: createNodeData('child2'), parentId: 'parent'},
                ]);
                setTreeRootIds(['parent']);

                // Emit: delete one child
                emitContentDeleted([createMockChangeItem('child1')]);

                // Assert: parent still hasChildren=true
                expect(getTreeNode('parent')?.hasChildren).toBe(true);
                expect(getTreeNode('parent')?.childIds).toEqual(['child2']);
            });
        });

        describe('$contentArchived', () => {
            it('removes content from tree on archive', () => {
                // Setup: node in tree
                addTreeNode({id: '1', data: createNodeData('1')});
                setTreeRootIds(['1']);
                expect(hasTreeNode('1')).toBe(true);

                // Emit: content archived
                emitContentArchived([createMockChangeItem('1')]);

                // Assert: node removed
                expect(hasTreeNode('1')).toBe(false);
            });

            it('updates parent hasChildren when last child archived', () => {
                // Setup: parent with single child
                addTreeNodes([
                    {id: 'parent', data: createNodeData('parent'), hasChildren: true, childIds: ['child']},
                    {id: 'child', data: createNodeData('child'), parentId: 'parent'},
                ]);
                setTreeRootIds(['parent']);

                // Emit: archive child
                emitContentArchived([createMockChangeItem('child')]);

                // Assert: parent.hasChildren=false
                expect(getTreeNode('parent')?.hasChildren).toBe(false);
            });
        });

        describe('$contentDuplicated', () => {
            it('adds duplicated content to tree when parent is loaded', () => {
                // Setup: parent node in tree with path in cache
                const parentContent = createMockContentWithParent('parent', '/');
                setContents([parentContent]);
                addTreeNode({id: 'parent', data: createNodeData('parent'), hasChildren: true, childIds: ['child1']});
                setTreeRootIds(['parent']);
                expandNode('parent');

                // Emit: duplicated content
                const duplicatedContent = createMockContentWithParent('duplicate', '/parent', false, 'Duplicated');
                emitContentDuplicated([duplicatedContent] as ContentSummaryAndCompareStatus[]);

                // Assert: duplicate appears in tree
                expect(hasTreeNode('duplicate')).toBe(true);
                const parent = getTreeNode('parent');
                expect(parent?.childIds).toContain('duplicate');
            });

            it('does not add a duplicated content to the tree when parent children are not loaded yet', () => {
                // Setup: parent node in tree with path in cache
                const parentContent = createMockContentWithParent('parent', '/');
                setContents([parentContent]);
                addTreeNode({id: 'parent', data: createNodeData('parent'), hasChildren: true});
                setTreeRootIds(['parent']);
                expandNode('parent');

                // Emit: duplicated content
                const duplicatedContent = createMockContentWithParent('duplicate', '/parent', false, 'Duplicated');
                emitContentDuplicated([duplicatedContent] as ContentSummaryAndCompareStatus[]);

                // Assert: duplicate appears in tree
                expect(hasTreeNode('duplicate')).not.toBe(true);
                const parent = getTreeNode('parent');
                expect(parent?.childIds).not.toContain('duplicate');
            });

            it('does not add duplicated content when parent is not in tree', () => {
                // Setup: empty tree
                setTreeRootIds([]);

                // Emit: duplicated content with non-existent parent
                const content = createMockContentWithParent('duplicate', '/non-existent');
                emitContentDuplicated([content] as ContentSummaryAndCompareStatus[]);

                // Assert: content not added
                expect(hasTreeNode('duplicate')).toBe(false);
            });
        });
    });
});
