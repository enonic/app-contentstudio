import {describe, expect, it} from 'vitest';
import {camelCase} from './camelCase';

describe('camelCase', () => {
    it('should convert space-separated words', () => {
        expect(camelCase('Foo Bar')).toBe('fooBar');
        expect(camelCase('foo bar baz')).toBe('fooBarBaz');
    });

    it('should convert hyphen-separated words', () => {
        expect(camelCase('foo-bar')).toBe('fooBar');
        expect(camelCase('foo-bar-baz')).toBe('fooBarBaz');
    });

    it('should convert underscore-separated words', () => {
        expect(camelCase('foo_bar')).toBe('fooBar');
        expect(camelCase('FOO_BAR')).toBe('fooBar');
    });

    it('should convert mixed separators', () => {
        expect(camelCase('foo-bar_baz qux')).toBe('fooBarBazQux');
    });

    it('should handle single word', () => {
        expect(camelCase('foo')).toBe('foo');
        expect(camelCase('FOO')).toBe('foo');
    });

    it('should handle empty string', () => {
        expect(camelCase('')).toBe('');
    });

    it('should handle PascalCase input', () => {
        expect(camelCase('FooBar')).toBe('fooBar');
    });

    it('should handle consecutive uppercase (acronyms)', () => {
        expect(camelCase('XMLParser')).toBe('xmlParser');
        expect(camelCase('parseHTML')).toBe('parseHtml');
    });
});
