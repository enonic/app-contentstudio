import {atom, computed} from 'nanostores';
import {ContentData} from '../views/browse/grid/ContentData';

export const $contentTreeItems = atom<ContentData[]>([]);

export const $flatContentTreeItems = computed($contentTreeItems, (items) => {
    return flattenTree(items);
});

export function removeContentTreeItem(id: string): void {
    const {nodes, changed} = removeNode($contentTreeItems.get(), id);

    if (changed) {
        $contentTreeItems.set(nodes);
    }
}

export function updateContentTreeItem(id: string, patch: Partial<ContentData>): void {
    const {nodes, changed} = updateNode($contentTreeItems.get(), id, patch);

    if (changed) {
        $contentTreeItems.set(nodes);
    }
}

function flattenTree(items: ContentData[]): ContentData[] {
    let flatItems: ContentData[] = [];

    items.forEach(item => {
        flatItems.push(item);
        if (item.children?.length > 0) {
            flatItems = [...flatItems, ...flattenTree(item.children as ContentData[])];
        }
    });

    return flatItems;
}

type TreeOperationResult = {
    nodes: ContentData[];
    changed: boolean;
};

function removeNode(nodes: ContentData[], id: string): TreeOperationResult {
    let changed = false;
    const nextNodes: ContentData[] = [];

    for (const node of nodes) {
        if (node.id === id) {
            changed = true;
            continue;
        }

        if (node.children?.length) {
            const childResult = removeNode(node.children as ContentData[], id);

            if (childResult.changed) {
                changed = true;
                nextNodes.push(setChildren(node, childResult.nodes));
                continue;
            }
        }

        nextNodes.push(node);
    }

    return {
        nodes: changed ? nextNodes : nodes,
        changed,
    };
}

function updateNode(nodes: ContentData[], id: string, patch: Partial<ContentData>): TreeOperationResult {
    let changed = false;
    const nextNodes: ContentData[] = [];

    for (const node of nodes) {
        if (node.id === id) {
            changed = true;
            nextNodes.push(applyPatch(node, patch));
            continue;
        }

        if (node.children?.length) {
            const childResult = updateNode(node.children as ContentData[], id, patch);

            if (childResult.changed) {
                changed = true;
                nextNodes.push(setChildren(node, childResult.nodes));
                continue;
            }
        }

        nextNodes.push(node);
    }

    return {
        nodes: changed ? nextNodes : nodes,
        changed,
    };
}

function setChildren(node: ContentData, children: ContentData[]): ContentData {
    const normalizedChildren = children.length > 0 ? children : undefined;

    return {
        ...node,
        children: normalizedChildren,
        hasChildren: !!normalizedChildren,
    };
}

function applyPatch(node: ContentData, patch: Partial<ContentData>): ContentData {
    const merged = {
        ...node,
        ...patch,
    };

    if ('children' in patch) {
        const children = (patch.children as ContentData[] | undefined) ?? [];
        return setChildren(merged, children);
    }

    return merged;
}
