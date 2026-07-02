import { describe, expect, it } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import { calcDependantsSelection, nextDependantExclusions } from './dependantsSelection';

const id = (value: string): ContentId => new ContentId(value);
const ids = (...values: string[]): ContentId[] => values.map(id);
const toStrings = (list: ContentId[]): string[] => list.map((item) => item.toString()).sort();

describe('dependantsSelection', () => {
    describe('calcDependantsSelection', () => {
        it('reports all selected when nothing is excluded or required', () => {
            const result = calcDependantsSelection(ids('a', 'b', 'c'), [], []);

            expect(result.count).toBe(3);
            expect(result.selectionType).toBe('all');
            expect(result.disabled).toBe(false);
            expect(toStrings(result.selectableIds)).toEqual(['a', 'b', 'c']);
        });

        it('reports none selected when every dependant is excluded', () => {
            const result = calcDependantsSelection(ids('a', 'b'), [], ids('a', 'b'));

            expect(result.selectionType).toBe('none');
            expect(result.disabled).toBe(false);
        });

        it('reports partial selection when some dependants are excluded', () => {
            const result = calcDependantsSelection(ids('a', 'b', 'c'), [], ids('a'));

            expect(result.count).toBe(3);
            expect(result.selectionType).toBe('partial');
            expect(result.disabled).toBe(false);
        });

        it('counts required dependants as selected, yielding partial when others are excluded', () => {
            const result = calcDependantsSelection(ids('req', 'dep'), ids('req'), ids('dep'));

            expect(result.selectionType).toBe('partial');
            expect(result.disabled).toBe(false);
            expect(toStrings(result.selectableIds)).toEqual(['dep']);
        });

        it('is checked and disabled when every dependant is required', () => {
            const result = calcDependantsSelection(ids('a', 'b'), ids('a', 'b'), []);

            expect(result.count).toBe(2);
            expect(result.selectionType).toBe('all');
            expect(result.disabled).toBe(true);
            expect(result.selectableIds).toHaveLength(0);
        });

        it('is checked and disabled for an empty list', () => {
            const result = calcDependantsSelection([], [], []);

            expect(result.count).toBe(0);
            expect(result.selectionType).toBe('all');
            expect(result.disabled).toBe(true);
        });
    });

    describe('nextDependantExclusions', () => {
        it('excludes every selectable dependant when all are currently selected', () => {
            const selection = calcDependantsSelection(ids('a', 'b'), [], []);

            const next = nextDependantExclusions(selection, []);

            expect(toStrings(next)).toEqual(['a', 'b']);
        });

        it('keeps required dependants out of the exclusion set when deselecting all', () => {
            const selection = calcDependantsSelection(ids('req', 'a'), ids('req'), []);

            const next = nextDependantExclusions(selection, []);

            expect(toStrings(next)).toEqual(['a']);
        });

        it('clears selectable exclusions when selecting all from a partial state', () => {
            const selection = calcDependantsSelection(ids('a', 'b', 'c'), [], ids('a'));

            const next = nextDependantExclusions(selection, ids('a'));

            expect(next).toHaveLength(0);
        });

        it('clears selectable exclusions when selecting all from an empty selection', () => {
            const selection = calcDependantsSelection(ids('a', 'b'), [], ids('a', 'b'));

            const next = nextDependantExclusions(selection, ids('a', 'b'));

            expect(next).toHaveLength(0);
        });

        it('preserves unrelated exclusions and adds selectable ids when deselecting all', () => {
            const selection = calcDependantsSelection(ids('a', 'b'), [], []);

            const next = nextDependantExclusions(selection, ids('x'));

            expect(toStrings(next)).toEqual(['a', 'b', 'x']);
        });
    });
});
