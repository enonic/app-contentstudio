import { describe, expect, it } from 'vitest';
import type { Descriptor } from '../../../../../../app/page/Descriptor';
import { DescriptorKey } from '../../../../../../app/page/DescriptorKey';
import { PartComponentBuilder } from '../../../../../../app/page/region/PartComponent';
import { createPartIconUrls, resolvePartIconUrl } from './partIconUrl';

describe('partIconUrl', () => {
    it('should resolve a part component through its descriptor icon', () => {
        const descriptorKey = DescriptorKey.fromString('app:heading');
        const descriptor = {
            getKey: () => descriptorKey,
            getIcon: () => '/heading.svg',
        } as Descriptor;
        const part = new PartComponentBuilder().setDescriptor(descriptorKey).build();

        const iconUrl = resolvePartIconUrl(part, createPartIconUrls([descriptor]));

        expect(iconUrl).toBe('/heading.svg');
    });
});
