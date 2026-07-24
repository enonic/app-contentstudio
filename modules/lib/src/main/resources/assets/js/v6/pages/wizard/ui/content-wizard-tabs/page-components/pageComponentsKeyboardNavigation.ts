import type {FlatNode} from '../../../../../shared/lib/tree-store';
import type {PageComponentNodeData} from './types';

export const PAGE_COMPONENTS_ROW_CLASS = 'page-components-list-item';

export type PageComponentsNavigationKey = 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'ArrowUp';

export type PageComponentsNavigationAction =
    | { type: 'focus'; nodeId: string }
    | { type: 'toggle'; nodeId: string };

export function resolvePageComponentsNavigation(
    nodes: FlatNode<PageComponentNodeData>[],
    currentNodeId: string,
    key: PageComponentsNavigationKey,
): PageComponentsNavigationAction | null {
    const currentIndex = nodes.findIndex((node) => node.id === currentNodeId);
    if (currentIndex === -1) {
        return null;
    }

    const currentNode = nodes[currentIndex];

    if (key === 'ArrowUp') {
        const previousNode = nodes[currentIndex - 1];
        return previousNode == null ? null : {type: 'focus', nodeId: previousNode.id};
    }

    if (key === 'ArrowDown') {
        const nextNode = nodes[currentIndex + 1];
        return nextNode == null ? null : {type: 'focus', nodeId: nextNode.id};
    }

    if (key === 'ArrowRight') {
        if (!currentNode.hasChildren) {
            return null;
        }

        if (!currentNode.isExpanded) {
            return {type: 'toggle', nodeId: currentNode.id};
        }

        const firstChild = nodes[currentIndex + 1];
        return firstChild?.parentId === currentNode.id ? {type: 'focus', nodeId: firstChild.id} : null;
    }

    if (currentNode.hasChildren && currentNode.isExpanded) {
        return {type: 'toggle', nodeId: currentNode.id};
    }

    return currentNode.parentId == null ? null : {type: 'focus', nodeId: currentNode.parentId};
}

export function getPageComponentsRow(target: EventTarget | null): HTMLElement | null {
    return target instanceof Element ? target.closest<HTMLElement>(`.${PAGE_COMPONENTS_ROW_CLASS}`) : null;
}

export function getPageComponentsRowNodeId(row: HTMLElement | null): string | null {
    return row?.querySelector<HTMLElement>('[data-node-id]')?.dataset.nodeId ?? null;
}

export function focusPageComponentsRow(container: HTMLElement, nodeId: string): boolean {
    const row = getPageComponentsRows(container).find((candidate) => getPageComponentsRowNodeId(candidate) === nodeId);
    if (row == null) {
        return false;
    }

    row.focus();
    return true;
}

function getPageComponentsRows(container: HTMLElement): HTMLElement[] {
    return Array.from(container.querySelectorAll<HTMLElement>(`.${PAGE_COMPONENTS_ROW_CLASS}`));
}
