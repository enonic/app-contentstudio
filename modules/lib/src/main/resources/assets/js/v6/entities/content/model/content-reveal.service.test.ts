import { errAsync, okAsync } from 'neverthrow';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Content } from '../../../../app/content/Content';
import type { ContentSummary } from '../../../../app/content/ContentSummary';
import type { Project } from '../../../../app/settings/data/project/Project';
import { AppError } from '../../../shared/api/errors';
import { $activeProject } from '../../project/activeProject.store';
import { setFilterActive } from './active-tree.store';
import { clearRevealScroll, $revealScrollTarget } from './content-reveal.store';
import { $activeId, $currentItem, $selection, clearSelection } from './content-selection.store';
import { addTreeNode, hasTreeNode, isNodeExpanded, resetTree, setTreeChildren, setTreeRootIds } from './content-tree.store';
import { clearAllContentCaches, setContents } from './content.commands';

const mocks = vi.hoisted(() => ({
    fetchContentByPath: vi.fn(),
    fetchRootChildrenIdsOnly: vi.fn(),
    fetchChildrenIdsOnly: vi.fn(),
    fetchContentByIds: vi.fn(),
}));

vi.mock('../api/content.api', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/content.api')>()),
    fetchContentByPath: mocks.fetchContentByPath,
}));

vi.mock('../api/content-fetcher', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../api/content-fetcher')>()),
    fetchRootChildrenIdsOnly: mocks.fetchRootChildrenIdsOnly,
    fetchChildrenIdsOnly: mocks.fetchChildrenIdsOnly,
    fetchContentByIds: mocks.fetchContentByIds,
}));

import { revealContentByPath } from './content-reveal.service';

// Minimal ContentSummary/Content stub: enough for setContents (getId/getPath),
// getIdByPath (path index), fetchContentByPath results (getContentId), and
// $currentItem resolution (cached object identity).
function mk(id: string, path: string): ContentSummary {
    return {
        getId: () => id,
        getContentId: () => ({ toString: () => id }),
        getPath: () => ({ toString: () => path }),
        getDisplayName: () => `Content ${id}`,
    } as unknown as ContentSummary;
}

describe('content-reveal.service', () => {
    beforeEach(() => {
        $activeProject.set({ getName: () => 'default' } as unknown as Project);
        resetTree();
        clearAllContentCaches();
        clearSelection();
        $selection.set(new Set());
        $activeId.set(null);
        setFilterActive(false);
        clearRevealScroll();

        mocks.fetchContentByPath.mockReset().mockReturnValue(errAsync(new AppError('not found')));
        mocks.fetchRootChildrenIdsOnly.mockReset().mockResolvedValue(undefined);
        mocks.fetchChildrenIdsOnly.mockReset().mockResolvedValue(undefined);
        mocks.fetchContentByIds.mockReset().mockResolvedValue([]);
    });

    afterEach(() => {
        $activeProject.set(undefined);
        vi.restoreAllMocks();
    });

    // Seeds a fully-loaded /a/b/c tree with its cache populated.
    function seedLoadedTree(): void {
        setContents([mk('a', '/a'), mk('b', '/a/b'), mk('c', '/a/b/c')]);
        addTreeNode({ id: 'a', parentId: null, hasChildren: true, childIds: ['b'] });
        addTreeNode({ id: 'b', parentId: 'a', hasChildren: true, childIds: ['c'] });
        addTreeNode({ id: 'c', parentId: 'b' });
        setTreeRootIds(['a']);
    }

    it('selects, scrolls to, and expands ancestors of an already-loaded content', async () => {
        seedLoadedTree();

        await revealContentByPath('/a/b/c');

        expect($activeId.get()).toBe('c');
        expect($revealScrollTarget.get()).toBe('c');
        expect(isNodeExpanded('a')).toBe(true);
        expect(isNodeExpanded('b')).toBe(true);
        expect(mocks.fetchContentByPath).not.toHaveBeenCalled();
        expect(mocks.fetchRootChildrenIdsOnly).not.toHaveBeenCalled();
        expect(mocks.fetchChildrenIdsOnly).not.toHaveBeenCalled();
        expect(mocks.fetchContentByIds).toHaveBeenCalledWith(['c']);
    });

    it('progressively loads root + ancestors, then selects the leaf', async () => {
        const byPath: Record<string, ContentSummary> = {
            '/a': mk('a', '/a'),
            '/a/b': mk('b', '/a/b'),
            '/a/b/c': mk('c', '/a/b/c'),
        };
        mocks.fetchContentByPath.mockImplementation((p: string) =>
            byPath[p] ? okAsync(byPath[p] as unknown as Content) : errAsync(new AppError('not found')),
        );
        mocks.fetchRootChildrenIdsOnly.mockImplementation(() => {
            addTreeNode({ id: 'a', parentId: null, hasChildren: true });
            setTreeRootIds(['a']);
            return Promise.resolve();
        });
        mocks.fetchChildrenIdsOnly.mockImplementation((parentId: string) => {
            if (parentId === 'a') {
                addTreeNode({ id: 'b', parentId: 'a', hasChildren: true });
                setTreeChildren('a', ['b']);
            } else if (parentId === 'b') {
                addTreeNode({ id: 'c', parentId: 'b' });
                setTreeChildren('b', ['c']);
            }
            return Promise.resolve();
        });

        await revealContentByPath('/a/b/c');

        expect(mocks.fetchRootChildrenIdsOnly).toHaveBeenCalledTimes(1);
        expect(mocks.fetchChildrenIdsOnly).toHaveBeenCalledWith('a');
        expect(mocks.fetchChildrenIdsOnly).toHaveBeenCalledWith('b');
        expect(isNodeExpanded('a')).toBe(true);
        expect(isNodeExpanded('b')).toBe(true);
        expect(hasTreeNode('c')).toBe(true);
        expect($activeId.get()).toBe('c');
        expect($revealScrollTarget.get()).toBe('c');
    });

    it('aborts without selecting when the path cannot be resolved', async () => {
        const onBeforeSelect = vi.fn();

        await revealContentByPath('/missing', { onBeforeSelect });

        expect($activeId.get()).toBeNull();
        expect($revealScrollTarget.get()).toBeNull();
        expect(onBeforeSelect).not.toHaveBeenCalled();
        expect(mocks.fetchContentByIds).not.toHaveBeenCalled();
    });

    it('does not select when the leaf never lands in the tree', async () => {
        setContents([mk('a', '/a'), mk('b', '/a/b'), mk('c', '/a/b/c')]);
        addTreeNode({ id: 'a', parentId: null, hasChildren: true, childIds: ['b'] });
        addTreeNode({ id: 'b', parentId: 'a', hasChildren: true }); // needs children, but mock won't add 'c'
        setTreeRootIds(['a']);

        await revealContentByPath('/a/b/c');

        expect($activeId.get()).toBeNull();
        expect($revealScrollTarget.get()).toBeNull();
        expect(mocks.fetchContentByIds).not.toHaveBeenCalled();
    });

    it('prefetches the leaf into cache before selecting (preview bridge guard)', async () => {
        // Progressive build with an empty cache; only the prefetch populates the leaf.
        const byPath: Record<string, ContentSummary> = {
            '/a': mk('a', '/a'),
            '/a/b': mk('b', '/a/b'),
            '/a/b/c': mk('c', '/a/b/c'),
        };
        mocks.fetchContentByPath.mockImplementation((p: string) =>
            byPath[p] ? okAsync(byPath[p] as unknown as Content) : errAsync(new AppError('not found')),
        );
        mocks.fetchRootChildrenIdsOnly.mockImplementation(() => {
            addTreeNode({ id: 'a', parentId: null, hasChildren: true });
            setTreeRootIds(['a']);
            return Promise.resolve();
        });
        mocks.fetchChildrenIdsOnly.mockImplementation((parentId: string) => {
            if (parentId === 'a') {
                addTreeNode({ id: 'b', parentId: 'a', hasChildren: true });
                setTreeChildren('a', ['b']);
            } else if (parentId === 'b') {
                addTreeNode({ id: 'c', parentId: 'b' });
                setTreeChildren('b', ['c']);
            }
            return Promise.resolve();
        });

        let activeIdWhenPrefetched: string | null = 'unset';
        mocks.fetchContentByIds.mockImplementation((ids: string[]) => {
            activeIdWhenPrefetched = $activeId.get(); // must run before setActive
            setContents([mk('c', '/a/b/c')]);
            return Promise.resolve([]);
        });

        await revealContentByPath('/a/b/c');

        expect(mocks.fetchContentByIds).toHaveBeenCalledWith(['c']);
        expect(activeIdWhenPrefetched).toBeNull(); // prefetch precedes selection
        expect($currentItem.get()?.getId()).toBe('c'); // bridge would resolve the item
    });

    it('invokes onBeforeSelect exactly once, immediately before selecting', async () => {
        seedLoadedTree();
        let activeIdAtCallback: string | null = 'unset';
        const onBeforeSelect = vi.fn(() => {
            activeIdAtCallback = $activeId.get();
        });

        await revealContentByPath('/a/b/c', { onBeforeSelect });

        expect(onBeforeSelect).toHaveBeenCalledTimes(1);
        expect(activeIdAtCallback).toBeNull();
        expect($activeId.get()).toBe('c');
    });

    it('in filter mode selects only, skipping expand and scroll', async () => {
        setFilterActive(true);
        setContents([mk('c', '/a/b/c')]);

        await revealContentByPath('/a/b/c');

        expect($activeId.get()).toBe('c');
        expect(mocks.fetchContentByIds).toHaveBeenCalledWith(['c']);
        expect(mocks.fetchRootChildrenIdsOnly).not.toHaveBeenCalled();
        expect(mocks.fetchChildrenIdsOnly).not.toHaveBeenCalled();
        expect($revealScrollTarget.get()).toBeNull();
    });

    it('does nothing for a degenerate path', async () => {
        await revealContentByPath('');

        expect($activeId.get()).toBeNull();
        expect(mocks.fetchContentByPath).not.toHaveBeenCalled();
        expect(mocks.fetchContentByIds).not.toHaveBeenCalled();
    });
});
