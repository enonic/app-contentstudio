import {describe, expect, it} from 'vitest';
import {buildKey, normalize} from './keys';

describe('normalize', () => {
    describe('basic transformations', () => {
        it('should lowercase input', () => {
            expect(normalize('Hello')).toBe('hello');
        });

        it('should replace spaces with underscores', () => {
            expect(normalize('My Project Name')).toBe('my_project_name');
        });

        it('should replace hyphens with underscores', () => {
            expect(normalize('test--key')).toBe('test_key');
        });

        it('should replace dots with underscores', () => {
            expect(normalize('foo.bar')).toBe('foo_bar');
        });

        it('should replace slashes with underscores', () => {
            expect(normalize('foo/bar/baz')).toBe('foo_bar_baz');
        });

        it('should replace backslashes with underscores', () => {
            expect(normalize('foo\\bar')).toBe('foo_bar');
        });

        it('should replace colons with underscores', () => {
            expect(normalize('foo:bar')).toBe('foo_bar');
        });

        it('should handle mixed separators', () => {
            expect(normalize('foo.bar/baz')).toBe('foo_bar_baz');
        });
    });

    describe('diacritics', () => {
        it('should strip accented characters', () => {
            expect(normalize('café')).toBe('cafe');
        });

        it('should strip umlauts', () => {
            expect(normalize('Über')).toBe('uber');
        });
    });

    describe('ligatures', () => {
        it('should expand æ to ae', () => {
            expect(normalize('æbler')).toBe('aebler');
        });

        it('should expand ø to o', () => {
            expect(normalize('fjørd')).toBe('fjord');
        });

        it('should expand ß to ss', () => {
            expect(normalize('straße')).toBe('strasse');
        });

        it('should expand œ to oe', () => {
            expect(normalize('œuvre')).toBe('oeuvre');
        });

        it('should expand ł to l', () => {
            expect(normalize('łódź')).toBe('lodz');
        });

        it('should expand đ to d', () => {
            expect(normalize('đón')).toBe('don');
        });
    });

    describe('non-alphanumeric removal', () => {
        it('should remove special characters', () => {
            expect(normalize('Hello@World!')).toBe('helloworld');
        });

        it('should remove parentheses', () => {
            expect(normalize('foo(bar)')).toBe('foobar');
        });
    });

    describe('underscore handling', () => {
        it('should collapse multiple underscores', () => {
            expect(normalize('a___b')).toBe('a_b');
        });

        it('should trim leading underscores', () => {
            expect(normalize('__foo')).toBe('foo');
        });

        it('should trim trailing underscores', () => {
            expect(normalize('foo__')).toBe('foo');
        });

        it('should collapse underscores from consecutive separators', () => {
            expect(normalize('a - b')).toBe('a_b');
        });
    });

    describe('edge cases', () => {
        it('should return empty string for empty input', () => {
            expect(normalize('')).toBe('');
        });

        it('should return empty string for non-string input', () => {
            expect(normalize(null as unknown as string)).toBe('');
            expect(normalize(undefined as unknown as string)).toBe('');
        });

        it('should return empty string for all-special-character input', () => {
            expect(normalize('!@#$%')).toBe('');
        });

        it('should handle single character', () => {
            expect(normalize('A')).toBe('a');
        });
    });
});

describe('buildKey', () => {
    it('should join normalized args with hyphens', () => {
        expect(buildKey('Foo', 'Bar')).toBe('foo-bar');
    });

    it('should normalize each segment independently', () => {
        expect(buildKey('My App', 'user.name')).toBe('my_app-user_name');
    });

    it('should handle single argument', () => {
        expect(buildKey('Test')).toBe('test');
    });

    it('should handle three arguments', () => {
        expect(buildKey('a', 'b', 'c')).toBe('a-b-c');
    });
});
