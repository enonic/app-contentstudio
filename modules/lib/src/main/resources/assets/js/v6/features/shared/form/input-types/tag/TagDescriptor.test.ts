import {ValueTypes} from '@enonic/lib-admin-ui/data/ValueTypes';
import {describe, expect, it} from 'vitest';
import {TagDescriptor} from './TagDescriptor';
import {TAG_SITE_PATH} from './TagConfig';

describe('TagDescriptor', () => {
    it('defaults allowPath to the legacy site wildcard when allowPath is not configured', () => {
        const config = TagDescriptor.readConfig({});

        expect(config.allowPath).toEqual([TAG_SITE_PATH]);
        expect(config.allowPathConfigured).toBe(false);
    });

    it('defaults allowPath to the legacy site wildcard when the config array is empty', () => {
        const config = TagDescriptor.readConfig({
            allowPath: [],
        });

        expect(config.allowPath).toEqual([TAG_SITE_PATH]);
        expect(config.allowPathConfigured).toBe(false);
    });

    it('reads repeating allowPath entries and ignores blank values', () => {
        const config = TagDescriptor.readConfig({
            allowPath: [{value: '/site-a/*'}, {value: ''}, {value: '  /site-b/*  '}],
        });

        expect(config.allowPath).toEqual(['/site-a/*', '/site-b/*']);
        expect(config.allowPathConfigured).toBe(true);
    });

    it('marks explicit legacy site wildcard as configured', () => {
        const config = TagDescriptor.readConfig({
            allowPath: [{value: TAG_SITE_PATH}],
        });

        expect(config.allowPath).toEqual([TAG_SITE_PATH]);
        expect(config.allowPathConfigured).toBe(true);
    });

    it('preserves text-line validation', () => {
        const config = TagDescriptor.readConfig({
            maxLength: [{value: 3}],
        });

        expect(TagDescriptor.validate(ValueTypes.STRING.newValue('toolong'), config)).toHaveLength(1);
        expect(TagDescriptor.valueBreaksRequired(ValueTypes.STRING.newValue('   '))).toBe(true);
    });
});
