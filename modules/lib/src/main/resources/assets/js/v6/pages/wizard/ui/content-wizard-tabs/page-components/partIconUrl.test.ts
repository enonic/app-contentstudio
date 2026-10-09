import { describe, expect, it } from 'vitest';
import { resolvePartIconUrl } from './partIconUrl';
import type { PageComponentNodeData } from './types';

describe('partIconUrl', () => {
    it('keeps the custom icon for a part row independently of the current page model', () => {
        const node = { nodeType: 'part', descriptorKey: 'app:heading' } as PageComponentNodeData;
        const iconUrl = resolvePartIconUrl(node, new Map([['app:heading', '/heading.svg']]));

        expect(iconUrl).toBe('/heading.svg');
    });
});
