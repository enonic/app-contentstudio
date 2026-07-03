import { describe, expect, it } from 'vitest';
import { readAllowPath, SITE_PATH } from './form';

describe('readAllowPath', () => {
    it('returns the fallback when allowPath is not configured', () => {
        expect(readAllowPath({}, [SITE_PATH])).toEqual([SITE_PATH]);
    });

    it('reads configured values and drops blanks', () => {
        expect(readAllowPath({ allowPath: [{ value: '/a' }, { value: '' }, { value: '/b' }] }, [SITE_PATH])).toEqual(['/a', '/b']);
    });

    it('returns an empty configured list as-is, without applying the fallback', () => {
        expect(readAllowPath({ allowPath: [] }, [SITE_PATH])).toEqual([]);
    });
});
