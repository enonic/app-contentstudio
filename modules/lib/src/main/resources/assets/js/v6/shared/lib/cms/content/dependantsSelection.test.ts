import { describe, expect, it } from 'vitest';
import { ContentId } from '../../../../../app/content/ContentId';
import {
    calcDependantsSelection,
    filterShownDependantIds,
    filterShownDependants,
    hasHideableExcludedDependants,
    nextDependantExclusions,
    pruneExcludedDependantIds,
} from './dependantsSelection';

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

    describe('pruneExcludedDependantIds', () => {
        it('keeps exclusions that are still shown and still optional', () => {
            const next = pruneExcludedDependantIds(ids('a', 'b'), ids('a', 'b', 'c'), []);

            expect(toStrings(next)).toEqual(['a', 'b']);
        });

        it('drops exclusions that left the dependant list', () => {
            const next = pruneExcludedDependantIds(ids('a', 'gone'), ids('a', 'b'), []);

            expect(toStrings(next)).toEqual(['a']);
        });

        it('drops exclusions that became required', () => {
            const next = pruneExcludedDependantIds(ids('a', 'b'), ids('a', 'b'), ids('b'));

            expect(toStrings(next)).toEqual(['a']);
        });

        it('preserves the original order', () => {
            const next = pruneExcludedDependantIds(ids('c', 'a', 'b'), ids('a', 'b', 'c'), []);

            expect(next.map((item) => item.toString())).toEqual(['c', 'a', 'b']);
        });
    });

    describe('hasHideableExcludedDependants', () => {
        it('reports nothing to hide when no dependant is excluded', () => {
            expect(hasHideableExcludedDependants(ids('a', 'b'), [])).toBe(false);
        });

        it('reports something to hide when a dependant is excluded', () => {
            expect(hasHideableExcludedDependants(ids('a', 'b'), ids('b'))).toBe(true);
        });

        it('ignores exclusions that are no longer in the dependant list', () => {
            expect(hasHideableExcludedDependants(ids('a', 'b'), ids('gone'))).toBe(false);
        });
    });

    describe('filterShownDependantIds', () => {
        it('returns the same array reference when excluded dependants are shown', () => {
            const dependantIds = ids('a', 'b');

            expect(filterShownDependantIds(dependantIds, ids('b'), true)).toBe(dependantIds);
        });

        it('drops the excluded dependants when they are hidden', () => {
            const next = filterShownDependantIds(ids('a', 'b', 'c'), ids('b'), false);

            expect(toStrings(next)).toEqual(['a', 'c']);
        });

        it('keeps every dependant when nothing is excluded', () => {
            const next = filterShownDependantIds(ids('a', 'b'), [], false);

            expect(toStrings(next)).toEqual(['a', 'b']);
        });
    });

    describe('filterShownDependants', () => {
        const summary = (value: string): { getContentId: () => ContentId } => ({ getContentId: () => id(value) });

        it('returns the same array reference when excluded dependants are shown', () => {
            const dependants = [summary('a'), summary('b')];

            expect(filterShownDependants(dependants, ids('b'), true)).toBe(dependants);
        });

        it('drops the excluded dependants when they are hidden', () => {
            const next = filterShownDependants([summary('a'), summary('b')], ids('b'), false);

            expect(next.map((item) => item.getContentId().toString())).toEqual(['a']);
        });
    });
});
