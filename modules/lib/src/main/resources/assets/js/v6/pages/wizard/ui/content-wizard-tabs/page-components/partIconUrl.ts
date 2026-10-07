import type { Descriptor } from '../../../../../../app/page/Descriptor';
import type { PageItem } from '../../../../../../app/page/region/PageItem';
import { PartComponent } from '../../../../../../app/page/region/PartComponent';

export function createPartIconUrls(descriptors: readonly Descriptor[]): ReadonlyMap<string, string> {
    const icons = new Map<string, string>();

    for (const descriptor of descriptors) {
        const iconUrl = descriptor.getIcon();
        if (iconUrl) {
            icons.set(descriptor.getKey().toString(), iconUrl);
        }
    }

    return icons;
}

export function resolvePartIconUrl(
    component: PageItem | null,
    iconUrls: ReadonlyMap<string, string>,
): string | undefined {
    if (!(component instanceof PartComponent) || !component.hasDescriptor()) {
        return undefined;
    }

    return iconUrls.get(component.getDescriptorKey().toString());
}
