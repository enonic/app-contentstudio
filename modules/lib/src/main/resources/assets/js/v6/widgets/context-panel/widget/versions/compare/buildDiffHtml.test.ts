import { describe, expect, it } from 'vitest';
import { type ContentJson } from '../../../../../../app/content/ContentJson';
import { buildDiffHtml } from './buildDiffHtml';

const content = (overrides: Record<string, unknown> = {}): ContentJson =>
    ({ displayName: 'Foo', data: { field: 'value' }, _name: 'foo', ...overrides }) as unknown as ContentJson;

describe('buildDiffHtml', () => {
    it('should render the full content as an all-unchanged tree when versions are identical', () => {
        const { diffHtml, isEmpty } = buildDiffHtml(content(), content());

        expect(isEmpty).toBe(true);
        expect(diffHtml).toContain('jsondiffpatch-unchanged');
        expect(diffHtml).toContain('displayName');
        expect(diffHtml).toContain('Foo');
    });

    it('should render a delta tree when versions differ', () => {
        const older = content({ displayName: 'Foo' });
        const newer = content({ displayName: 'Bar' });

        const { diffHtml, isEmpty } = buildDiffHtml(older, newer);

        expect(isEmpty).toBe(false);
        expect(diffHtml).toContain('jsondiffpatch-modified');
    });
});
