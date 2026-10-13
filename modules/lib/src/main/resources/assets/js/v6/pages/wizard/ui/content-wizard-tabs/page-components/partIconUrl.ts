import type { Descriptor } from '../../../../../../app/page/Descriptor';
import type { PageComponentNodeData } from './types';

export function createPartIconUrls(descriptors: readonly Descriptor[]): ReadonlyMap<string, string> {
    const icons = new Map<string, string>();
    for (const descriptor of descriptors) {
        const url = descriptor.getIcon();
        if (url) {
            icons.set(descriptor.getKey().toString(), url);
        }
    }
    return icons;
}

export function resolvePartIconUrl(
    node: PageComponentNodeData | null,
    iconUrls: ReadonlyMap<string, string>,
): string | undefined {
    if (node?.nodeType !== 'part' || !node.descriptorKey) {
        return undefined;
    }

    return iconUrls.get(node.descriptorKey);
}
