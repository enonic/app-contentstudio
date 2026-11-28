import { describe, expect, it } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import { groupDescendantsByRoot } from './descendantGroups';

const ids = (...values: string[]): ContentId[] => values.map((value) => new ContentId(value));

const toPlain = (groups: Map<string, ContentId[]>): [string, string[]][] =>
    [...groups.entries()].map(([rootId, group]) => [rootId, group.map((id) => id.toString())]);

describe('groupDescendantsByRoot', () => {
    it('should group the dependants under their root in the order of the roots', () => {
        const groups = groupDescendantsByRoot(
            ids('x', 'a'),
            new Map([
                ['a', ids('a1', 'a2')],
                ['x', ids('x1')],
            ]),
            ids('a1', 'x1', 'ref', 'a2'),
        );

        expect(toPlain(groups)).toEqual([
            ['x', ['x1']],
            ['a', ['a1', 'a2']],
        ]);
    });

    it('should keep the order of the dependants inside a group', () => {
        const groups = groupDescendantsByRoot(ids('a'), new Map([['a', ids('a1', 'a2', 'a3')]]), ids('a3', 'a1', 'a2'));

        expect(toPlain(groups)).toEqual([['a', ['a3', 'a1', 'a2']]]);
    });

    it('should leave out descendants the server did not resolve as dependants', () => {
        const groups = groupDescendantsByRoot(ids('a'), new Map([['a', ids('a1', 'published')]]), ids('a1'));

        expect(toPlain(groups)).toEqual([['a', ['a1']]]);
    });

    it('should give a descendant of nested roots to the closest root', () => {
        const groups = groupDescendantsByRoot(
            ids('a', 'b'),
            new Map([
                ['a', ids('b', 'b1', 'a1')],
                ['b', ids('b1')],
            ]),
            ids('a1', 'b1'),
        );

        expect(toPlain(groups)).toEqual([
            ['a', ['a1']],
            ['b', ['b1']],
        ]);
    });

    it('should skip roots without resolved descendants', () => {
        const groups = groupDescendantsByRoot(ids('a', 'x'), new Map([['a', ids('a1')]]), ids('ref'));

        expect(toPlain(groups)).toEqual([]);
    });
});
