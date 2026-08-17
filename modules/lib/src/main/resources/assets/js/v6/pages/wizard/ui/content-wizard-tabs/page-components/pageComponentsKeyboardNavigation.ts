import type { FlatNode } from '../../../../../shared/lib/tree-store';
import type { PageComponentNodeData } from './types';

const ROW_SELECTOR = '[role="treeitem"]';

export type PageComponentsNavigationKey =
    | 'ArrowDown'
    | 'ArrowLeft'
    | 'ArrowRight'
    | 'ArrowUp'
    | 'End'
    | 'Enter'
    | 'Home';

export type PageComponentsNavigationAction =
    | { type: 'focus'; index: number }
    | { type: 'select'; index: number }
    | { type: 'toggle'; index: number };

/** Position of a row among its siblings, for `aria-posinset` / `aria-setsize`. */
export type TreeItemPosition = {
    posInSet: number;
    setSize: number;
};

export function isPageComponentsNavigationKey(key: string): key is PageComponentsNavigationKey {
    return (
        key === 'ArrowDown' ||
        key === 'ArrowLeft' ||
        key === 'ArrowRight' ||
        key === 'ArrowUp' ||
        key === 'End' ||
        key === 'Enter' ||
        key === 'Home'
    );
}

export function resolvePageComponentsNavigation(
    nodes: FlatNode<PageComponentNodeData>[],
    currentIndex: number,
    key: PageComponentsNavigationKey,
): PageComponentsNavigationAction | null {
    const currentNode = nodes[currentIndex];
    if (currentNode == null) {
        return null;
    }

    if (key === 'Enter') {
        return { type: 'select', index: currentIndex };
    }

    if (key === 'Home') {
        return { type: 'focus', index: 0 };
    }

    if (key === 'End') {
        return { type: 'focus', index: nodes.length - 1 };
    }

    if (key === 'ArrowUp') {
        return currentIndex === 0 ? null : { type: 'focus', index: currentIndex - 1 };
    }

    if (key === 'ArrowDown') {
        return currentIndex === nodes.length - 1 ? null : { type: 'focus', index: currentIndex + 1 };
    }

    if (key === 'ArrowRight') {
        if (!currentNode.hasChildren) {
            return null;
        }

        if (!currentNode.isExpanded) {
            return { type: 'toggle', index: currentIndex };
        }

        const firstChildIndex = currentIndex + 1;
        return nodes[firstChildIndex]?.parentId === currentNode.id ? { type: 'focus', index: firstChildIndex } : null;
    }

    if (currentNode.hasChildren && currentNode.isExpanded) {
        return { type: 'toggle', index: currentIndex };
    }

    if (currentNode.parentId == null) {
        return null;
    }

    const parentIndex = nodes.findIndex((node) => node.id === currentNode.parentId);
    return parentIndex === -1 ? null : { type: 'focus', index: parentIndex };
}

/**
 * ARIA requires `aria-posinset` and `aria-setsize` on tree items that are not
 * wrapped in a `role="group"` — the rows here are rendered as one flat list.
 */
export function computeTreeItemPositions(nodes: FlatNode<PageComponentNodeData>[]): Map<string, TreeItemPosition> {
    const setSizes = new Map<string, number>();
    for (const node of nodes) {
        const parentKey = toParentKey(node.parentId);
        setSizes.set(parentKey, (setSizes.get(parentKey) ?? 0) + 1);
    }

    const positions = new Map<string, TreeItemPosition>();
    const counters = new Map<string, number>();
    for (const node of nodes) {
        const parentKey = toParentKey(node.parentId);
        const posInSet = (counters.get(parentKey) ?? 0) + 1;
        counters.set(parentKey, posInSet);
        positions.set(node.id, { posInSet, setSize: setSizes.get(parentKey) ?? 1 });
    }

    return positions;
}

export function getPageComponentsRows(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(ROW_SELECTOR));
}

export function getPageComponentsRow(container: HTMLElement, target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) {
        return null;
    }

    // Portalled content (the context menu) reaches the container's React handlers
    // without being a DOM descendant, so the row has to be verified against the container.
    const row = target.closest<HTMLElement>(ROW_SELECTOR);
    return row != null && container.contains(row) ? row : null;
}

export function getPageComponentsRowIndex(container: HTMLElement, row: HTMLElement): number {
    return getPageComponentsRows(container).indexOf(row);
}

export function focusPageComponentsRowAt(container: HTMLElement, index: number): boolean {
    const row = index < 0 ? undefined : getPageComponentsRows(container)[index];
    if (row == null) {
        return false;
    }

    row.focus();
    return true;
}

//
// * Internal
//

function toParentKey(parentId: string | null): string {
    return parentId ?? '';
}
