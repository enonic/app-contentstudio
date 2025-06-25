import {describe, expect, it} from 'vitest';
import {prettifyProjectIdentifier, validateProjectIdentifier} from './identifier';

describe('validateProjectIdentifier', () => {
    describe('valid identifiers', () => {
        it('should accept lowercase letters', () => {
            expect(validateProjectIdentifier('abc')).toBe(true);
        });

        it('should accept letters with numbers', () => {
            expect(validateProjectIdentifier('a1')).toBe(true);
        });

        it('should accept letters with dashes', () => {
            expect(validateProjectIdentifier('a-b')).toBe(true);
        });

        it('should accept complex alphanumeric with dashes', () => {
            expect(validateProjectIdentifier('a1-b2-c3')).toBe(true);
        });

        it('should accept starting with a number', () => {
            expect(validateProjectIdentifier('0abc')).toBe(true);
        });
    });

    describe('invalid identifiers', () => {
        it('should reject empty string', () => {
            expect(validateProjectIdentifier('')).toBe(false);
        });

        it('should reject uppercase letters', () => {
            expect(validateProjectIdentifier('A')).toBe(false);
        });

        it('should reject starting with a dash', () => {
            expect(validateProjectIdentifier('-abc')).toBe(false);
        });

        it('should reject ending with a dash', () => {
            expect(validateProjectIdentifier('abc-')).toBe(false);
        });

        it('should reject dots', () => {
            expect(validateProjectIdentifier('a.b')).toBe(false);
        });

        it('should reject spaces', () => {
            expect(validateProjectIdentifier('a b')).toBe(false);
        });

        it('should reject underscores', () => {
            expect(validateProjectIdentifier('a_b')).toBe(false);
        });

        it('should reject special characters', () => {
            expect(validateProjectIdentifier('abc!')).toBe(false);
        });
    });
});

describe('prettifyProjectIdentifier', () => {
    it('should lowercase input', () => {
        expect(prettifyProjectIdentifier('Hello World')).toBe('hello-world');
    });

    it('should strip diacritics', () => {
        expect(prettifyProjectIdentifier('café')).toBe('cafe');
        expect(prettifyProjectIdentifier('Über')).toBe('uber');
    });

    it('should replace special characters with hyphens', () => {
        expect(prettifyProjectIdentifier('a@b#c')).toBe('a-b-c');
    });

    it('should replace dots with hyphens', () => {
        expect(prettifyProjectIdentifier('a.b.c')).toBe('a-b-c');
    });

    it('should collapse consecutive hyphens', () => {
        expect(prettifyProjectIdentifier('a---b')).toBe('a-b');
    });

    it('should strip leading and trailing hyphens', () => {
        expect(prettifyProjectIdentifier('--abc--')).toBe('abc');
    });

    it('should preserve trailing dash on user input', () => {
        expect(prettifyProjectIdentifier('abc-', true)).toBe('abc-');
    });

    it('should strip trailing dash when not user input', () => {
        expect(prettifyProjectIdentifier('abc-', false)).toBe('abc');
    });

    it('should pass through empty string', () => {
        expect(prettifyProjectIdentifier('')).toBe('');
    });

    it('should expand Nordic ligatures', () => {
        expect(prettifyProjectIdentifier('fjørd')).toBe('fjord');
        expect(prettifyProjectIdentifier('æbler')).toBe('aebler');
        expect(prettifyProjectIdentifier('Ångström')).toBe('angstrom');
    });

    it('should expand German ligatures', () => {
        expect(prettifyProjectIdentifier('straße')).toBe('strasse');
    });

    it('should expand other European ligatures', () => {
        expect(prettifyProjectIdentifier('œuvre')).toBe('oeuvre');
        expect(prettifyProjectIdentifier('łódź')).toBe('lodz');
        expect(prettifyProjectIdentifier('đón')).toBe('don');
    });
});
