import {describe, it, expect} from 'vitest';
import {parseBoolean, parseNumber, parseString} from './values';

describe('parseBoolean', () => {
    describe('boolean inputs', () => {
        it('should return true for boolean true', () => {
            expect(parseBoolean(true)).toBe(true);
        });

        it('should return false for boolean false', () => {
            expect(parseBoolean(false)).toBe(false);
        });
    });

    describe('string inputs', () => {
        it('should return true for string "true" (lowercase)', () => {
            expect(parseBoolean('true')).toBe(true);
        });

        it('should return true for string "True" (capitalized)', () => {
            expect(parseBoolean('True')).toBe(true);
        });

        it('should return true for string "TRUE" (uppercase)', () => {
            expect(parseBoolean('TRUE')).toBe(true);
        });

        it('should return false for string "false"', () => {
            expect(parseBoolean('false')).toBe(false);
        });

        it('should return false for empty string', () => {
            expect(parseBoolean('')).toBe(false);
        });

        it('should return false for arbitrary string', () => {
            expect(parseBoolean('hello')).toBe(false);
        });

        it('should return false for string "1"', () => {
            expect(parseBoolean('1')).toBe(false);
        });
    });

    describe('other input types', () => {
        it('should return false for number 1', () => {
            expect(parseBoolean(1)).toBe(false);
        });

        it('should return false for number 0', () => {
            expect(parseBoolean(0)).toBe(false);
        });

        it('should return false for null', () => {
            expect(parseBoolean(null)).toBe(false);
        });

        it('should return false for undefined', () => {
            expect(parseBoolean(undefined)).toBe(false);
        });

        it('should return false for object', () => {
            expect(parseBoolean({})).toBe(false);
        });

        it('should return false for array', () => {
            expect(parseBoolean([])).toBe(false);
        });
    });
});

describe('parseNumber', () => {
    describe('number inputs', () => {
        it('should return the number for valid integer', () => {
            expect(parseNumber(42)).toBe(42);
        });

        it('should return the number for valid float', () => {
            expect(parseNumber(3.14)).toBe(3.14);
        });

        it('should return the number for zero', () => {
            expect(parseNumber(0)).toBe(0);
        });

        it('should return the number for negative number', () => {
            expect(parseNumber(-10)).toBe(-10);
        });

        it('should return undefined for NaN', () => {
            expect(parseNumber(NaN)).toBeUndefined();
        });
    });

    describe('string inputs', () => {
        it('should parse valid numeric string', () => {
            expect(parseNumber('123')).toBe(123);
        });

        it('should parse valid float string', () => {
            expect(parseNumber('3.14')).toBe(3.14);
        });

        it('should parse string with leading/trailing whitespace', () => {
            expect(parseNumber('  42  ')).toBe(42);
        });

        it('should parse negative number string', () => {
            expect(parseNumber('-10')).toBe(-10);
        });

        it('should return undefined for empty string', () => {
            expect(parseNumber('')).toBeUndefined();
        });

        it('should return undefined for whitespace-only string', () => {
            expect(parseNumber('   ')).toBeUndefined();
        });

        it('should return undefined for non-numeric string', () => {
            expect(parseNumber('hello')).toBeUndefined();
        });

        it('should return undefined for partially numeric string', () => {
            expect(parseNumber('42px')).toBeUndefined();
        });
    });

    describe('other input types', () => {
        it('should return undefined for null', () => {
            expect(parseNumber(null)).toBeUndefined();
        });

        it('should return undefined for undefined', () => {
            expect(parseNumber(undefined)).toBeUndefined();
        });

        it('should return undefined for boolean true', () => {
            expect(parseNumber(true)).toBeUndefined();
        });

        it('should return undefined for boolean false', () => {
            expect(parseNumber(false)).toBeUndefined();
        });

        it('should return undefined for object', () => {
            expect(parseNumber({})).toBeUndefined();
        });

        it('should return undefined for array', () => {
            expect(parseNumber([])).toBeUndefined();
        });
    });

    describe('edge cases', () => {
        it('should parse scientific notation', () => {
            expect(parseNumber('1e3')).toBe(1000);
        });

        it('should parse hexadecimal string', () => {
            expect(parseNumber('0xFF')).toBe(255);
        });

        it('should return number for Infinity', () => {
            expect(parseNumber(Infinity)).toBe(Infinity);
        });

        it('should return number for -Infinity', () => {
            expect(parseNumber(-Infinity)).toBe(-Infinity);
        });
    });
});

describe('parseString', () => {
    describe('string inputs', () => {
        it('should return the same string', () => {
            expect(parseString('hello')).toBe('hello');
        });

        it('should return empty string for empty string', () => {
            expect(parseString('')).toBe('');
        });

        it('should preserve whitespace in string', () => {
            expect(parseString('  hello  ')).toBe('  hello  ');
        });
    });

    describe('null and undefined inputs', () => {
        it('should return empty string for null', () => {
            expect(parseString(null)).toBe('');
        });

        it('should return empty string for undefined', () => {
            expect(parseString(undefined)).toBe('');
        });
    });

    describe('other input types', () => {
        it('should convert number to string', () => {
            expect(parseString(42)).toBe('42');
        });

        it('should convert zero to string', () => {
            expect(parseString(0)).toBe('0');
        });

        it('should convert negative number to string', () => {
            expect(parseString(-10)).toBe('-10');
        });

        it('should convert float to string', () => {
            expect(parseString(3.14)).toBe('3.14');
        });

        it('should convert boolean true to string', () => {
            expect(parseString(true)).toBe('true');
        });

        it('should convert boolean false to string', () => {
            expect(parseString(false)).toBe('false');
        });

        it('should convert object to string', () => {
            expect(parseString({})).toBe('[object Object]');
        });

        it('should convert array to string', () => {
            expect(parseString([1, 2, 3])).toBe('1,2,3');
        });

        it('should convert empty array to empty string', () => {
            expect(parseString([])).toBe('');
        });
    });

    describe('edge cases', () => {
        it('should convert NaN to string', () => {
            expect(parseString(NaN)).toBe('NaN');
        });

        it('should convert Infinity to string', () => {
            expect(parseString(Infinity)).toBe('Infinity');
        });

        it('should convert symbol to string', () => {
            const sym = Symbol('test');
            expect(parseString(sym)).toBe('Symbol(test)');
        });
    });
});
