import { afterEach, describe, expect, it } from 'vitest';
import type { FlatNode } from '../../../../../shared/lib/tree-store';
import {
    computeTreeItemPositions,
    focusPageComponentsRowAt,
    getPageComponentsRow,
    getPageComponentsRowIndex,
    getPageComponentsRows,
    isPageComponentsNavigationKey,
    resolvePageComponentsNavigation,
} from './pageComponentsKeyboardNavigation';
import type { PageComponentNodeData } from './types';

type NodeOptions = {
    hasChildren?: boolean;
    isExpanded?: boolean;
};

function createNode(
    id: string,
    parentId: string | null,
    level: number,
    options: NodeOptions = {},
): FlatNode<PageComponentNodeData> {
    return {
        id,
        parentId,
        level,
        data: {
            displayName: id,
            nodeType: 'part',
            draggable: true,
            layoutFragment: false,
            hasDescriptor: true,
        },
        isExpanded: options.isExpanded ?? false,
        isLoading: false,
        isLoadingData: false,
        hasChildren: options.hasChildren ?? false,
        nodeType: 'node',
    };
}

// 0 '/'          expanded
// 1   '/main'    expanded
// 2     '/main/0'
// 3     '/main/1'  collapsed, has children
// 4     '/main/2'
// 5   '/footer'
function createTree(): FlatNode<PageComponentNodeData>[] {
    return [
        createNode('/', null, 1, { hasChildren: true, isExpanded: true }),
        createNode('/main', '/', 2, { hasChildren: true, isExpanded: true }),
        createNode('/main/0', '/main', 3),
        createNode('/main/1', '/main', 3, { hasChildren: true }),
        createNode('/main/2', '/main', 3),
        createNode('/footer', '/', 2),
    ];
}

describe('isPageComponentsNavigationKey', () => {
    it('should accept the navigation keys', () => {
        for (const key of ['ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'End', 'Enter', 'Home']) {
            expect(isPageComponentsNavigationKey(key)).toBe(true);
        }
    });

    it('should reject keys owned by the drag sensor and other keys', () => {
        for (const key of [' ', 'Space', 'Escape', 'Tab', 'a']) {
            expect(isPageComponentsNavigationKey(key)).toBe(false);
        }
    });
});

describe('resolvePageComponentsNavigation', () => {
    it('should return null for an index outside the list', () => {
        const nodes = createTree();

        expect(resolvePageComponentsNavigation(nodes, -1, 'ArrowDown')).toBeNull();
        expect(resolvePageComponentsNavigation(nodes, nodes.length, 'ArrowDown')).toBeNull();
        expect(resolvePageComponentsNavigation([], 0, 'Home')).toBeNull();
    });

    it('should move to the next and previous visible row', () => {
        const nodes = createTree();

        expect(resolvePageComponentsNavigation(nodes, 2, 'ArrowDown')).toEqual({ type: 'focus', index: 3 });
        expect(resolvePageComponentsNavigation(nodes, 2, 'ArrowUp')).toEqual({ type: 'focus', index: 1 });
    });

    it('should not wrap around at the list edges', () => {
        const nodes = createTree();

        expect(resolvePageComponentsNavigation(nodes, 0, 'ArrowUp')).toBeNull();
        expect(resolvePageComponentsNavigation(nodes, nodes.length - 1, 'ArrowDown')).toBeNull();
    });

    it('should jump to the first and last row', () => {
        const nodes = createTree();

        expect(resolvePageComponentsNavigation(nodes, 3, 'Home')).toEqual({ type: 'focus', index: 0 });
        expect(resolvePageComponentsNavigation(nodes, 3, 'End')).toEqual({ type: 'focus', index: 5 });
    });

    it('should select the current row on Enter', () => {
        const nodes = createTree();

        expect(resolvePageComponentsNavigation(nodes, 4, 'Enter')).toEqual({ type: 'select', index: 4 });
        expect(resolvePageComponentsNavigation(nodes, 0, 'Enter')).toEqual({ type: 'select', index: 0 });
    });

    describe('ArrowRight', () => {
        it('should do nothing on a leaf', () => {
            expect(resolvePageComponentsNavigation(createTree(), 2, 'ArrowRight')).toBeNull();
        });

        it('should expand a collapsed row', () => {
            expect(resolvePageComponentsNavigation(createTree(), 3, 'ArrowRight')).toEqual({
                type: 'toggle',
                index: 3,
            });
        });

        it('should move to the first child of an expanded row', () => {
            expect(resolvePageComponentsNavigation(createTree(), 1, 'ArrowRight')).toEqual({
                type: 'focus',
                index: 2,
            });
        });

        it('should do nothing when an expanded row renders no children', () => {
            const nodes = [
                createNode('/', null, 1, { hasChildren: true, isExpanded: true }),
                createNode('/footer', null, 1),
            ];

            expect(resolvePageComponentsNavigation(nodes, 0, 'ArrowRight')).toBeNull();
        });
    });

    describe('ArrowLeft', () => {
        it('should collapse an expanded row', () => {
            expect(resolvePageComponentsNavigation(createTree(), 1, 'ArrowLeft')).toEqual({
                type: 'toggle',
                index: 1,
            });
        });

        it('should move to the parent of a leaf', () => {
            expect(resolvePageComponentsNavigation(createTree(), 2, 'ArrowLeft')).toEqual({
                type: 'focus',
                index: 1,
            });
        });

        it('should move to the parent of a collapsed row instead of collapsing again', () => {
            expect(resolvePageComponentsNavigation(createTree(), 3, 'ArrowLeft')).toEqual({
                type: 'focus',
                index: 1,
            });
        });

        it('should do nothing on a root row', () => {
            const nodes = [createNode('/', null, 1)];

            expect(resolvePageComponentsNavigation(nodes, 0, 'ArrowLeft')).toBeNull();
        });

        it('should do nothing when the parent is not visible', () => {
            const nodes = [createNode('/main/0', '/main', 3)];

            expect(resolvePageComponentsNavigation(nodes, 0, 'ArrowLeft')).toBeNull();
        });
    });
});

describe('computeTreeItemPositions', () => {
    it('should number each row within its own sibling set', () => {
        const positions = computeTreeItemPositions(createTree());

        expect(positions.get('/')).toEqual({ posInSet: 1, setSize: 1 });
        expect(positions.get('/main')).toEqual({ posInSet: 1, setSize: 2 });
        expect(positions.get('/footer')).toEqual({ posInSet: 2, setSize: 2 });
        expect(positions.get('/main/0')).toEqual({ posInSet: 1, setSize: 3 });
        expect(positions.get('/main/1')).toEqual({ posInSet: 2, setSize: 3 });
        expect(positions.get('/main/2')).toEqual({ posInSet: 3, setSize: 3 });
    });

    it('should return an empty map for an empty tree', () => {
        expect(computeTreeItemPositions([]).size).toBe(0);
    });
});

describe('DOM helpers', () => {
    afterEach(() => {
        document.body.replaceChildren();
    });

    function createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.innerHTML = `
            <div role="tree">
                <div role="treeitem" tabindex="-1"><span class="label">first</span></div>
                <div role="treeitem" tabindex="-1"><span class="label">second</span></div>
                <div role="treeitem" tabindex="0"><span class="label">third</span></div>
            </div>
        `;
        document.body.replaceChildren(container);
        return container;
    }

    it('should collect the rows in document order', () => {
        const container = createContainer();

        expect(getPageComponentsRows(container).map((row) => row.textContent?.trim())).toEqual([
            'first',
            'second',
            'third',
        ]);
    });

    it('should resolve the row from a descendant of the row', () => {
        const container = createContainer();
        const label = container.querySelectorAll('.label')[1];

        const row = getPageComponentsRow(container, label);

        expect(row).not.toBeNull();
        expect(getPageComponentsRowIndex(container, row)).toBe(1);
    });

    it('should ignore rows rendered outside the container', () => {
        const container = createContainer();
        const portalled = document.createElement('div');
        portalled.setAttribute('role', 'treeitem');
        document.body.append(portalled);

        expect(getPageComponentsRow(container, portalled)).toBeNull();
    });

    it('should ignore targets that are not elements', () => {
        const container = createContainer();

        expect(getPageComponentsRow(container, null)).toBeNull();
        expect(getPageComponentsRow(container, new EventTarget())).toBeNull();
    });

    it('should focus the row at the given index', () => {
        const container = createContainer();

        expect(focusPageComponentsRowAt(container, 1)).toBe(true);
        expect(document.activeElement).toBe(getPageComponentsRows(container)[1]);
    });

    it('should report failure for an index without a row', () => {
        const container = createContainer();

        expect(focusPageComponentsRowAt(container, -1)).toBe(false);
        expect(focusPageComponentsRowAt(container, 3)).toBe(false);
    });
});
