import { describe, expect, it } from 'vitest';
import { randomId } from './id';

describe('randomId', () => {
    it('should return a non-empty url-safe string', () => {
        expect(randomId()).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should return a different value on each call', () => {
        expect(randomId()).not.toBe(randomId());
    });
});
