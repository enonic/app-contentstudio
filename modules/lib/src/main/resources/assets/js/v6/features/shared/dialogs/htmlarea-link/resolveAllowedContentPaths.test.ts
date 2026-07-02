import {describe, expect, it} from 'vitest';
import {SITE_PATH} from '../../../utils/form/form';
import {resolveAllowedContentPaths} from './resolveAllowedContentPaths';

describe('resolveAllowedContentPaths', () => {
    it('scopes to the site placeholder when inside a site and not showing all content', () => {
        expect(resolveAllowedContentPaths({isInSite: true, showAllContent: false})).toEqual([SITE_PATH]);
    });

    it('returns undefined (whole repository) when showing all content', () => {
        expect(resolveAllowedContentPaths({isInSite: true, showAllContent: true})).toBeUndefined();
    });

    it('returns undefined (whole repository) when not inside a site', () => {
        expect(resolveAllowedContentPaths({isInSite: false, showAllContent: false})).toBeUndefined();
    });
});
