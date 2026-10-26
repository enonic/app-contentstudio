import { describe, expect, it } from 'vitest';
import {
    DEFAULT_ORDER,
    and,
    escapeSearchString,
    fulltextSearch,
    like,
    orderBy,
    pathMatch,
    query,
    quote,
    weightedField,
} from './query';

describe('query', () => {
    describe('quote', () => {
        it('should single-quote a plain value', () => {
            expect(quote('/content/a')).toBe("'/content/a'");
        });

        it('should double-quote a value containing a single quote without escaping', () => {
            expect(quote(`it's "q"`)).toBe(`"it's "q""`);
        });
    });

    describe('escapeSearchString', () => {
        it('should escape lucene operators, quotes and the +-= range', () => {
            expect(escapeSearchString(`it's "q" a*b`)).toBe(`it's \\"q\\" a\\*b`);
            expect(escapeSearchString('/a-b_c.d')).toBe('\\/a\\-b_c\\.d');
            expect(escapeSearchString('a && b || c')).toBe('a \\&& b \\|| c');
        });
    });

    it('should format a weighted field', () => {
        expect(weightedField('displayName', 5)).toBe('displayName^5');
        expect(weightedField('_alltext')).toBe('_alltext');
    });

    it('should build fulltext OR ngram over the joined fields', () => {
        expect(fulltextSearch(['data.tags'], 'tag')).toBe(
            "(fulltext('data.tags', 'tag', 'AND') OR ngram('data.tags', 'tag', 'AND'))",
        );
    });

    it('should build pathMatch under the content root', () => {
        expect(pathMatch('')).toBe("pathMatch('_path', '/content')");
        expect(pathMatch('/site/a')).toBe("pathMatch('_path', '/content/site/a')");
    });

    it('should build LIKE with quoting', () => {
        expect(like('_path', "/content/site's/*")).toBe(`_path LIKE "/content/site's/*"`);
    });

    it('should wrap logical expressions in parentheses', () => {
        expect(and('a', 'b')).toBe('(a AND b)');
    });

    it('should append ORDER BY only when an order is given', () => {
        expect(query('x')).toBe('x');
        expect(query('x', DEFAULT_ORDER)).toBe('x ORDER BY _score DESC, modifiedTime DESC');
        expect(orderBy([{ field: 'a', direction: 'ASC' }])).toBe('a ASC');
    });
});
