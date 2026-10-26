import { describe, expect, it } from 'vitest';
import { buildSelectorSearchExpr } from './selectorQueryExpr';

// Expected strings were captured from lib-admin-ui's PathMatchExpressionBuilder before the switch.
describe('buildSelectorSearchExpr', () => {
    const FIELDS = "'displayName^5,_name^3,_alltext'";
    const ORDER = ' ORDER BY _score DESC, modifiedTime DESC';

    it('should match everything under the root for an empty search', () => {
        expect(buildSelectorSearchExpr('', '')).toBe(
            `(((fulltext(${FIELDS}, '', 'AND') OR ngram(${FIELDS}, '', 'AND')) OR _path LIKE '/content/**') AND pathMatch('_path', '/content'))${ORDER}`,
        );
    });

    it('should turn whitespace into wildcards in the path match and keep it in the fulltext', () => {
        expect(buildSelectorSearchExpr('hello world', '/site/a')).toBe(
            `(((fulltext(${FIELDS}, 'hello world', 'AND') OR ngram(${FIELDS}, 'hello world', 'AND')) OR _path LIKE '/content/*hello*world*') AND pathMatch('_path', '/content/site/a'))${ORDER}`,
        );
        expect(buildSelectorSearchExpr('  spaced  ', '/')).toBe(
            `(((fulltext(${FIELDS}, '  spaced  ', 'AND') OR ngram(${FIELDS}, '  spaced  ', 'AND')) OR _path LIKE '/content/*spaced*') AND pathMatch('_path', '/content/'))${ORDER}`,
        );
    });

    it('should escape special characters and switch to double quotes around single quotes', () => {
        expect(buildSelectorSearchExpr(`it's "q" a*b`, '/x')).toBe(
            `(((fulltext(${FIELDS}, "it's \\"q\\" a\\*b", 'AND') OR ngram(${FIELDS}, "it's \\"q\\" a\\*b", 'AND')) OR _path LIKE "/content/*it's*\\"q\\"*a\\*b*") AND pathMatch('_path', '/content/x'))${ORDER}`,
        );
        expect(buildSelectorSearchExpr('/a-b_c.d', '/s')).toBe(
            `(((fulltext(${FIELDS}, '\\/a\\-b_c\\.d', 'AND') OR ngram(${FIELDS}, '\\/a\\-b_c\\.d', 'AND')) OR _path LIKE '/content/*\\/a\\-b_c\\.d*') AND pathMatch('_path', '/content/s'))${ORDER}`,
        );
    });

    it('should drop the path match for search strings longer than 80 characters', () => {
        const long = 'x'.repeat(81);
        expect(buildSelectorSearchExpr(long, '/s')).toBe(
            `((fulltext(${FIELDS}, '${long}', 'AND') OR ngram(${FIELDS}, '${long}', 'AND')) AND pathMatch('_path', '/content/s'))${ORDER}`,
        );
    });
});
