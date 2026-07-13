import { afterEach, describe, expect, it } from 'vitest';
import { $config } from '../../config/config.store';
import { getCmsRestUri, joinPath } from './cms';

afterEach(() => {
    $config.setKey('adminUrl', '/admin');
});

describe('joinPath', () => {
    it('should join segments with single slashes', () => {
        expect(joinPath('a', 'b', 'c')).toBe('a/b/c');
    });

    it('should drop empty segments', () => {
        expect(joinPath('a', '', 'b')).toBe('a/b');
    });

    it('should collapse duplicate slashes between segments', () => {
        expect(joinPath('a/', '/b')).toBe('a/b');
    });

    it('should collapse a leading double slash to a single slash', () => {
        expect(joinPath('/', '', 'rest-v2/cs')).toBe('/rest-v2/cs');
    });

    it('should preserve the protocol double slash', () => {
        expect(joinPath('https://host.com', 'a')).toBe('https://host.com/a');
    });
});

describe('getCmsRestUri', () => {
    // adminUrl is always a root-relative path (default '/admin'), so the helper
    // forces a leading slash to produce an absolute-from-root REST URL.
    it('should build an absolute url under the admin prefix', () => {
        $config.setKey('adminUrl', '/admin');
        expect(getCmsRestUri('security/principals')).toBe('/admin/rest-v2/cs/security/principals');
    });

    it('should build a root-absolute url when admin is vhost-mapped to root (empty adminUrl)', () => {
        $config.setKey('adminUrl', '');
        expect(getCmsRestUri('security/principals')).toBe('/rest-v2/cs/security/principals');
    });

    it('should force a leading slash when adminUrl has none', () => {
        $config.setKey('adminUrl', 'admin');
        expect(getCmsRestUri('security/principals')).toBe('/admin/rest-v2/cs/security/principals');
    });
});
