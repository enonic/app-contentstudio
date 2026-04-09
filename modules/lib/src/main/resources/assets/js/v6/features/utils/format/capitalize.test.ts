import {describe, expect, it} from 'vitest';
import {capitalize} from './capitalize';

describe('capitalize', () => {
    it('should capitalize the first character and lowercase the rest', () => {
        expect(capitalize('hello')).toBe('Hello');
        expect(capitalize('HELLO')).toBe('Hello');
        expect(capitalize('hELLO')).toBe('Hello');
    });

    it('should handle single character strings', () => {
        expect(capitalize('a')).toBe('A');
        expect(capitalize('A')).toBe('A');
    });

    it('should handle empty string', () => {
        expect(capitalize('')).toBe('');
    });

    it('should preserve spaces and only affect letter casing', () => {
        expect(capitalize('hello world')).toBe('Hello world');
        expect(capitalize('HELLO WORLD')).toBe('Hello world');
        expect(capitalize('HELLO WORLD, GUYS!')).toBe('Hello world, guys!');
    });

    it('should handle strings starting with non-letter characters', () => {
        expect(capitalize('123abc')).toBe('123abc');
        expect(capitalize(' hello')).toBe(' hello');
    });
});
