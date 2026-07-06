import { describe, expect, it } from 'vitest';
import { appendUrlParams, decodeUrlParams, trimUrlParams } from './params';

describe('decodeUrlParams', () => {
    it('should return an empty object for a blank url', () => {
        expect(decodeUrlParams('')).toEqual({});
    });

    it('should return an empty object when there is no query string', () => {
        expect(decodeUrlParams('/admin/image')).toEqual({});
    });

    it('should parse query params into a record', () => {
        expect(decodeUrlParams('/admin/image?size=100&crop=true')).toEqual({ size: '100', crop: 'true' });
    });

    it('should url-decode param values', () => {
        expect(decodeUrlParams('/admin/image?name=a%20b')).toEqual({ name: 'a b' });
    });
});

describe('trimUrlParams', () => {
    it('should strip the query string', () => {
        expect(trimUrlParams('/admin/image?size=100')).toBe('/admin/image');
    });

    it('should return the url unchanged when there is no query string', () => {
        expect(trimUrlParams('/admin/image')).toBe('/admin/image');
    });
});

describe('appendUrlParams', () => {
    it('should append with ? when the url has no query string', () => {
        expect(appendUrlParams('/admin/image', { size: '200' }, false)).toBe('/admin/image?size=200');
    });

    it('should append with & when the url already has a query string', () => {
        expect(appendUrlParams('/admin/image?x=1', { size: '200' }, false)).toBe('/admin/image?x=1&size=200');
    });

    it('should skip null and undefined values', () => {
        expect(appendUrlParams('/admin/image', { a: '1', b: null, c: undefined }, false)).toBe('/admin/image?a=1');
    });

    it('should return the url unchanged when there are no params to append', () => {
        expect(appendUrlParams('/admin/image', {})).toBe('/admin/image');
        expect(appendUrlParams('/admin/image', { a: null })).toBe('/admin/image');
    });

    it('should percent-encode keys and values by default', () => {
        expect(appendUrlParams('/admin/image', { 'a b': 'c d' })).toBe('/admin/image?a+b=c+d');
    });

    it('should write keys and values verbatim when encode is false', () => {
        expect(appendUrlParams('/admin/image', { path: '/a/b' }, false)).toBe('/admin/image?path=/a/b');
    });
});
