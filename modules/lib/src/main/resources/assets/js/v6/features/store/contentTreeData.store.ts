import {TreeItems} from '@enonic/ui';
import {atom} from 'nanostores';
import {ContentData} from '../views/browse/grid/ContentData';

export const $contentTreeItems = atom<TreeItems<ContentData>>({
    nodes: {},
    children: {},
    hasMore: {},
});

export function getItemById(id: string): ContentData | undefined {
    return $contentTreeItems.get().nodes[id];
}

export function getAllContentTreeItems(): ContentData[] {
    return Object.values($contentTreeItems.get().nodes);
}

export function getContentTreeItemsCount(): number {
    return Object.keys($contentTreeItems.get().nodes).length;
}

export function resetContentTreeItems(): void {
    $contentTreeItems.set({
        nodes: {},
        children: {},
        hasMore: {},
    });
}

export function removeContentTreeItem(id: string): void {
    const currentItems = $contentTreeItems.get();
    const parentId = Object.entries(currentItems.children)
        .find(([, childIds]) => childIds?.includes(id))
        ?.[0];

    if (!currentItems.nodes[id]) {
        return;
    }

    const nodes = {...currentItems.nodes};
    const children = {...currentItems.children};
    const hasMore = {...currentItems.hasMore};
    const idsToRemove = [id];

    for (const currentId of idsToRemove) {
        const currentChildren = children[currentId];

        if (currentChildren?.length) {
            idsToRemove.push(...currentChildren);
        }

        delete nodes[currentId];
        delete children[currentId];
        delete hasMore[currentId];
    }

    if (parentId) {
        const updatedParentChildren = (children[parentId] ?? []).filter((childId) => childId !== id);
        children[parentId] = updatedParentChildren;

        const parentNode = nodes[parentId];

        if (parentNode && !hasMore[parentId] && updatedParentChildren.length === 0) {
            nodes[parentId] = {
                ...parentNode,
                hasChildren: false,
            };
        }
    }

    $contentTreeItems.set({
        nodes,
        children,
        hasMore,
    });
}

export function updateContentTreeItem(id: string, patch: Partial<ContentData>): void {
    const currentItems = $contentTreeItems.get();
    const existingItem = currentItems.nodes[id];

    if (!existingItem) {
        return;
    }

    const updatedItem: ContentData = {
        ...existingItem,
        ...patch,
    };

    const nodes = {...currentItems.nodes};
    nodes[id] = updatedItem;
    const children = {...currentItems.children};
    const hasMore = {...currentItems.hasMore};

    $contentTreeItems.set({
        nodes,
        children,
        hasMore,
    });
}
