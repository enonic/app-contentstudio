import {describe, expect, it} from 'vitest';
import {isBlank} from './isBlank';

describe('isBlank', () => {
    it('should return true for null', () => {
        expect(isBlank(null)).toBe(true);
    });

    it('should return true for undefined', () => {
        expect(isBlank(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
        expect(isBlank('')).toBe(true);
    });

    it('should return true for whitespace-only strings', () => {
        expect(isBlank(' ')).toBe(true);
        expect(isBlank('   ')).toBe(true);
        expect(isBlank('\t')).toBe(true);
        expect(isBlank('\n')).toBe(true);
        expect(isBlank(' \t\n ')).toBe(true);
    });

    it('should return false for non-blank strings', () => {
        expect(isBlank('a')).toBe(false);
        expect(isBlank(' a ')).toBe(false);
        expect(isBlank('hello world')).toBe(false);
    });

    it('should return false for strings with only special characters', () => {
        expect(isBlank('0')).toBe(false);
        expect(isBlank('.')).toBe(false);
    });
});
