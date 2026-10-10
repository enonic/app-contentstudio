import type { PageComponentNodeData } from './types';

export function resolvePartIconUrl(
    node: PageComponentNodeData | null | undefined,
    iconUrls: ReadonlyMap<string, string>,
): string | undefined {
    if (node?.nodeType !== 'part' || !node.descriptorKey) {
        return undefined;
    }

    return iconUrls.get(node.descriptorKey);
}
