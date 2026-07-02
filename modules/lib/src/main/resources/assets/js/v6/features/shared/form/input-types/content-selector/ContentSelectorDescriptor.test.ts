import {describe, expect, it} from 'vitest';
import {ContentSelectorDescriptor} from './ContentSelectorDescriptor';
import {SITE_PATH} from '../../../../utils/form/form';

describe('ContentSelectorDescriptor', () => {
    it('defaults allowPath to the site wildcard when allowPath is not configured', () => {
        const config = ContentSelectorDescriptor.readConfig({});

        expect(config.allowPath).toEqual([SITE_PATH]);
    });

    it('reads configured allowPath entries and ignores blank values', () => {
        const config = ContentSelectorDescriptor.readConfig({
            allowPath: [{value: '/site-a/*'}, {value: ''}, {value: '/site-b/*'}],
        });

        expect(config.allowPath).toEqual(['/site-a/*', '/site-b/*']);
    });
});
