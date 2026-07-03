import { describe, expect, it } from 'vitest';
import { MediaSelectorDescriptor } from './MediaSelectorDescriptor';

describe('MediaSelectorDescriptor', () => {
    it('defaults allowPath to no restriction (whole repository) when allowPath is not configured', () => {
        const config = MediaSelectorDescriptor.readConfig({});

        expect(config.allowPath).toEqual([]);
    });

    it('reads configured allowPath entries and ignores blank values', () => {
        const config = MediaSelectorDescriptor.readConfig({
            allowPath: [{ value: '/site-a/*' }, { value: '' }, { value: '/site-b/*' }],
        });

        expect(config.allowPath).toEqual(['/site-a/*', '/site-b/*']);
    });
});
